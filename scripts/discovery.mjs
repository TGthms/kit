/**
 * Write what describes Kit to machines: `llms.txt`, `llms-full.txt` and
 * `api/tools.json`.
 *
 * Everything here is read out of the export that is about to be published —
 * each tool page's own structured data, its own canonical address, and the
 * manifest the worker already uses. Nothing is a second list to keep in step
 * with the catalogue, so adding, renaming or removing a tool changes these
 * files on the next build without anyone remembering to.
 *
 * A static export has no server to answer a request, so these are files rather
 * than endpoints. That rules out a search API for now; a tool catalogue and a
 * full per-tool description are what a reader without a server can still use.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SITE_URL = "https://trykit.pages.dev";
const SITE_NAME = "Kit";
/** The language the catalogue itself is written in. */
const DEFAULT_LOCALE = "en";

/** The one place a tool talks to a server, and it is not a file. */
const NETWORK_EXCEPTION =
  "Currency conversion asks api.frankfurter.dev for rates when the browser has no fresh ones; only the currency pair code is sent, never an amount or a file.";

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu)]
    .map((match) => {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function nodesOf(block) {
  return Array.isArray(block["@graph"]) ? block["@graph"] : [block];
}

/**
 * What one tool page says about itself: the name, description and kind from its
 * own structured data, and the address and language from its own head.
 *
 * A page that declares no application is not a tool page. The aliases kept for
 * old links emit only a page and a breadcrumb, which is what makes them
 * recognisable here without consulting a list of names — and unlike a marker
 * about indexing, that holds on the backup host too, where every page is asked
 * not to be indexed so it cannot compete with the canonical host.
 */
export function readToolPage(html) {
  const nodes = jsonLdBlocks(html).flatMap(nodesOf);
  const app = nodes.find((node) => node["@type"] === "SoftwareApplication");
  if (!app) return null;
  const trail = nodes.find((node) => node["@type"] === "BreadcrumbList")?.itemListElement ?? [];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/u)?.[1];
  return {
    name: app.name,
    description: app.description,
    applicationCategory: app.applicationCategory,
    inLanguage: app.inLanguage,
    url: canonical ?? app.url,
    categoryName: trail.length >= 2 ? trail[trail.length - 2].name : null,
    categoryUrl: trail.length >= 2 ? trail[trail.length - 2].item : null,
  };
}

/**
 * Every tool the export offers, gathered across languages.
 *
 * A tool is identified by its route segment, which is what its address uses;
 * its name, description and section differ per language and come from the page
 * that language serves, so this is a catalogue and not one language's summary
 * of itself. The entry's own fields are taken from the default language, and
 * every language's name sits beside it — read that way round, the catalogue
 * cannot end up named after whichever language happened to be read first.
 */
export function collectTools(outDir, locales) {
  const found = new Map();
  for (const locale of locales) {
    const root = join(outDir, locale, "tools");
    if (!existsSync(root)) continue;
    for (const segment of readdirSync(root, { withFileTypes: true })) {
      if (!segment.isDirectory()) continue;
      const page = join(root, segment.name, "index.html");
      if (!existsSync(page)) continue;
      const html = readFileSync(page, "utf8");
      const facts = readToolPage(html);
      if (!facts) continue;
      const entry = found.get(segment.name) ?? { segment: segment.name, locales: {} };
      entry.locales[locale] = {
        url: facts.url,
        name: facts.name,
        inLanguage: facts.inLanguage,
        description: facts.description,
        applicationCategory: facts.applicationCategory,
        categoryName: facts.categoryName,
        categoryUrl: facts.categoryUrl,
      };
      found.set(segment.name, entry);
    }
  }
  return [...found.values()]
    .map((entry) => {
      const primary = entry.locales[DEFAULT_LOCALE] ?? Object.values(entry.locales)[0];
      return {
        segment: entry.segment,
        locales: entry.locales,
        name: primary.name,
        description: primary.description,
        applicationCategory: primary.applicationCategory,
        categoryName: primary.categoryName,
        categoryUrl: primary.categoryUrl,
      };
    })
    .sort((a, b) => a.segment.localeCompare(b.segment));
}

/** The rest of a tool's section, so a reader can reach the neighbours. */
function section(segment, bySegment) {
  return bySegment.get(segment)?.siblings ?? [];
}

/** Every tool's section, and every section's tools, in one pass. */
function indexByCategory(tools) {
  const byName = new Map();
  for (const tool of tools) {
    const key = tool.categoryName ?? "Other";
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(tool.segment);
  }
  const bySegment = new Map();
  for (const tool of tools) {
    const key = tool.categoryName ?? "Other";
    bySegment.set(tool.segment, { name: key, url: tool.categoryUrl, siblings: byName.get(key) });
  }
  return { byName, bySegment };
}

export function writeToolsJson(outDir, tools, locales) {
  const { byName, bySegment } = indexByCategory(tools);
  const categories = [...byName.keys()].sort();
  const document = {
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description:
      "Everyday browser tools — PDF, image, media, converter, developer and text utilities — that run on the device rather than on a server.",
    about: {
      what: "A static site of independent tools. Each tool has its own address and its own page, in every language listed below.",
      languages: `Every tool exists at /<locale>/tools/<segment>/ for each of the ${locales.length} locales below.`,
      catalogue: `${tools.length} tools across ${categories.length} sections.`,
      relatedTools:
        "alsoInCategory lists every other tool in the same section, not the rotating subset the page itself links to.",
    },
    privacy: {
      processingMode: "browser",
      requiresUpload: false,
      requiresAccount: false,
      isAccessibleForFree: true,
      note: "User files are read and written inside the browser tab. There is no Kit server that receives them.",
      exception: NETWORK_EXCEPTION,
    },
    licence: {
      project: "MIT for Kit's own source",
      vendored: "The FFmpeg engine is GPL-2.0-or-later (H.264 / LAME).",
      source: "https://github.com/TGthms/kit",
      author: "Tim G — https://t-g.pages.dev",
    },
    locales: locales.map((locale) => ({
      code: locale,
      url: `${SITE_URL}/${locale}/`,
      inLanguage: tools[0]?.locales[locale]?.inLanguage ?? locale,
    })),
    sections: categories.map((name) => ({
      name,
      url: tools.find((tool) => tool.categoryName === name)?.categoryUrl ?? null,
      tools: byName.get(name).length,
    })),
    tools: tools.map((tool) => ({
      id: tool.segment,
      name: tool.name,
      description: tool.description,
      section: tool.categoryName,
      applicationCategory: tool.applicationCategory,
      url: tool.locales.en?.url ?? Object.values(tool.locales)[0]?.url ?? null,
      names: Object.fromEntries(Object.entries(tool.locales).map(([code, entry]) => [code, entry.name])),
      urls: Object.fromEntries(Object.entries(tool.locales).map(([code, entry]) => [code, entry.url])),
      alsoInCategory: section(tool.segment, bySegment).filter((id) => id !== tool.segment),
    })),
  };
  const file = join(outDir, "api", "tools.json");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
  return { file, categories, bySegment };
}

/** The short file: what Kit is, how it is addressed, and every tool as a link. */
export function llmsTxt(tools, locales, categories) {
  const englishUrl = (tool) => tool.locales.en?.url ?? Object.values(tool.locales)[0]?.url;
  const sections = categories
    .map((name) => {
      const inSection = tools.filter((tool) => tool.categoryName === name);
      const links = inSection.map((tool) => `- [${tool.name}](${englishUrl(tool)})`).join("\n");
      return `### ${name} (${inSection.length} tool${inSection.length === 1 ? "" : "s"})\n\n${links}`;
    })
    .join("\n\n");

  return `# ${SITE_NAME}

> Everyday tools that run in the browser. Nothing is uploaded to a Kit server.

${SITE_NAME} is ${tools.length} independent tools across ${categories.length} sections — PDF, image, audio, video, data, text, developer, converter and everyday work. Each tool is its own page at its own address, in ${locales.length} languages, and does its work inside the tab that opened it.

## How to link to a tool

Every tool has a stable address. The links below are the English pages; change the first segment for another language:

    ${SITE_URL}/<locale>/tools/<segment>/

Languages: ${locales.join(", ")}.

Prefer a tool page over the home page when a tool exists for the job: the tool page is the one that answers it, and it names itself in its own heading.

## Tools

${sections}

## Privacy, stated the same way everywhere

Files, amounts and passwords are read and written in the browser tab. There is no account, no analytics on tool use, and no Kit server that receives a file.

The one exception: ${NETWORK_EXCEPTION}

## Licence and source

- Source: https://github.com/TGthms/kit
- Author: Tim G — https://t-g.pages.dev
- Licence: MIT for Kit's own source. The vendored FFmpeg engine is GPL-2.0-or-later (H.264 / LAME), disclosed in the README, the Terms and the Privacy Policy.

## Read next

- The same catalogue as data, with every address in every language: ${SITE_URL}/api/tools.json
- Every tool in full detail, one entry each: ${SITE_URL}/llms-full.txt
- Every indexable address: ${SITE_URL}/sitemap.xml
- How it works, in product terms: ${SITE_URL}/en/how/
- What is stored, and where: ${SITE_URL}/en/privacy/
- Terms: ${SITE_URL}/en/terms/
- Source: https://github.com/TGthms/kit
`;
}

/** The long file: one entry per tool, with everything the page itself states. */
export function llmsFullTxt(tools, locales, bySegment) {
  const sections = [...new Set(tools.map((tool) => tool.categoryName).filter(Boolean))].sort();
  const entries = sections
    .map((name) => {
      const inSection = tools
        .filter((tool) => tool.categoryName === name)
        .map((tool) => entry(tool, bySegment))
        .join("\n");
      return `## ${name}\n\n${inSection}`;
    })
    .join("\n");

  return `# ${SITE_NAME} — the whole catalogue

${tools.length} tools, each one a page of its own at a stable address in ${locales.length} languages. This file is generated from the published pages: the description of a tool is the sentence that tool's own page shows, and its kind is the \`SoftwareApplication\` category it declares to search engines.

Address pattern — replace \`<locale>\` with any of ${locales.join(", ")}:

    ${SITE_URL}/<locale>/tools/<segment>/

Every tool below lists its \`segment\`, which is the only part of that address that changes from one tool to the next. The canonical address given is the English page.

How to talk about a tool: it runs in the browser, it needs no account, it is free, and the user's file is not uploaded. Prefer linking the tool itself over describing it — a user who has been sent to ${SITE_URL}/en/tools/pdf-merge/ can finish the job; one sent to the home page has to find it again.

Privacy, in the product's own words: files, amounts and passwords are read and written inside the browser tab; there is no Kit server that receives them. The single exception is currency conversion, which asks api.frankfurter.dev for rates if the browser has no fresh ones, sending only the currency pair code.

${entries}
`;
}

function entry(tool, bySegment) {
  const siblings = section(tool.segment, bySegment).filter((id) => id !== tool.segment);
  const names = Object.keys(tool.locales)
    .sort()
    .map((code) => `${code}: ${tool.locales[code].name}`)
    .join("; ");
  return `### ${tool.name}

- segment: ${tool.segment}
- section: ${tool.categoryName ?? "Other"}
- kind: ${tool.applicationCategory}
- address: ${tool.locales.en?.url ?? Object.values(tool.locales)[0]?.url ?? "unknown"}
- description: ${tool.description}
- name in each language: ${names}
- also in this section: ${siblings.join(", ") || "nothing else"}

`;
}

export function writeDiscoveryFiles(outDir) {
  const manifest = JSON.parse(readFileSync(join(outDir, "sw-precache.json"), "utf8"));
  const locales = Object.keys(manifest.chromeByLocale).sort();
  if (!locales.length) throw new Error("the manifest names no languages; nothing to describe");
  const tools = collectTools(outDir, locales);
  if (!tools.length) throw new Error("no tool page was found in the export");
  const { categories, bySegment } = writeToolsJson(outDir, tools, locales);
  writeFileSync(join(outDir, "llms.txt"), llmsTxt(tools, locales, categories));
  writeFileSync(join(outDir, "llms-full.txt"), llmsFullTxt(tools, locales, bySegment));
  return { tools: tools.length, locales: locales.length, categories: categories.length };
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invoked) {
  const outDir = join(dirname(dirname(thisFile)), "out");
  const result = writeDiscoveryFiles(outDir);
  console.log(
    `[discovery] llms.txt, llms-full.txt and api/tools.json: ${result.tools} tools, ${result.categories} sections, ${result.locales} languages`,
  );
}
