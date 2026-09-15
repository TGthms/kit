import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { collectTools, isIndexablePage, readToolPage, writeDiscoveryFiles } from "./discovery.mjs";

const SITE = "https://trykit.pages.dev";

/** One tool page, as the exporter writes it: head, canonical, and its own JSON-LD. */
function toolPage({ name, description, url, category, categoryUrl, kind, inLanguage, noindex = false }) {
  const graph = [
    { "@type": "WebPage", name, description, url },
    { "@type": "SoftwareApplication", name, description, url, applicationCategory: kind, inLanguage },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Kit", item: `${SITE}/en/` },
        { "@type": "ListItem", position: 2, name: category, item: categoryUrl },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    },
  ];
  return `<!DOCTYPE html><html lang="${inLanguage}"><head>
<title>${name} — Kit</title>
<meta name="description" content="${description}"/>
${noindex ? '<meta name="robots" content="noindex, follow"/>' : ""}
<link rel="canonical" href="${url}"/>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>
</head><body></body></html>`;
}

/** A small export: two languages, three real tools, one compatibility address. */
function writeExport(locales = ["en", "fr"]) {
  const root = mkdtempSync(join(tmpdir(), "kit-discovery-"));
  const tool = (name) => name.toLowerCase().replace(/\s+/gu, "-");
  const catalogue = [
    { name: "Merge PDFs", description: "Stack several PDFs into one.", category: "PDF", kind: "BusinessApplication", segment: "pdf-merge" },
    { name: "Split PDFs", description: "Divide one PDF into several.", category: "PDF", kind: "BusinessApplication", segment: "pdf-split" },
    { name: "Format JSON", description: "Format and validate JSON.", category: "Developer", kind: "DeveloperApplication", segment: "json-format" },
  ];
  for (const locale of locales) {
    for (const entry of catalogue) {
      const dir = join(root, locale, "tools", entry.segment);
      mkdirSync(dir, { recursive: true });
      const suffix = locale === "en" ? "" : ` (${locale})`;
      writeFileSync(
        join(dir, "index.html"),
        toolPage({
          name: `${entry.name}${suffix}`,
          description: `${entry.description}${suffix}`,
          url: `${SITE}/${locale}/tools/${entry.segment}/`,
          category: entry.category,
          categoryUrl: `${SITE}/${locale}/c/${tool(entry.category)}/`,
          kind: entry.kind,
          inLanguage: locale,
        }),
      );
    }
    /* An old address kept alive: a page for a tool that no longer exists. */
    const alias = join(root, locale, "tools", "merged-pdfs");
    mkdirSync(alias, { recursive: true });
    writeFileSync(
      join(alias, "index.html"),
      toolPage({
        name: "Merge PDFs",
        description: "Renamed.",
        url: `${SITE}/${locale}/tools/merged-pdfs/`,
        category: "PDF",
        categoryUrl: `${SITE}/${locale}/c/pdf/`,
        kind: "BusinessApplication",
        inLanguage: locale,
        noindex: true,
      }),
    );
  }
  writeFileSync(
    join(root, "sw-precache.json"),
    `${JSON.stringify({
      core: [],
      engines: [],
      chromeByLocale: Object.fromEntries(locales.map((locale) => [locale, [`/${locale}/`]])),
      toolsByLocale: {},
      rscByLocale: {},
      extrasByLocale: {},
      pagesByLocale: {},
    })}\n`,
  );
  return root;
}

const roots = [];
function fixture(...args) {
  const root = writeExport(...args);
  roots.push(root);
  return root;
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe("reading a tool page", () => {
  it("takes the name, description and kind from the page's own data", () => {
    const html = toolPage({
      name: "Merge PDFs",
      description: "Stack several PDFs into one.",
      url: `${SITE}/en/tools/pdf-merge/`,
      category: "PDF",
      categoryUrl: `${SITE}/en/c/pdf/`,
      kind: "BusinessApplication",
      inLanguage: "en",
    });
    expect(readToolPage(html)).toMatchObject({
      name: "Merge PDFs",
      description: "Stack several PDFs into one.",
      applicationCategory: "BusinessApplication",
      url: `${SITE}/en/tools/pdf-merge/`,
      categoryName: "PDF",
    });
  });

  it("says nothing about a page that declares no application", () => {
    expect(readToolPage("<!DOCTYPE html><html><body></body></html>")).toBeNull();
  });

  it("treats an ask not to be indexed as a compatibility address", () => {
    expect(isIndexablePage('<meta name="robots" content="noindex, follow"/>')).toBe(false);
    expect(isIndexablePage('<meta name="robots" content="index, follow"/>')).toBe(true);
    expect(isIndexablePage("<html></html>")).toBe(true);
  });
});

describe("the catalogue read off an export", () => {
  it("lists every tool, and every language it exists in", () => {
    const root = fixture(["en", "fr"]);
    const tools = collectTools(root, ["en", "fr"]);
    expect(tools.map((tool) => tool.segment)).toEqual(["json-format", "pdf-merge", "pdf-split"]);
    const merge = tools.find((tool) => tool.segment === "pdf-merge");
    expect(Object.keys(merge.locales).sort()).toEqual(["en", "fr"]);
    expect(merge.locales.en.url).toBe(`${SITE}/en/tools/pdf-merge/`);
    expect(merge.locales.fr.name).toBe("Merge PDFs (fr)");
  });

  it("leaves a compatibility address out, so nothing links to a renamed tool", () => {
    const root = fixture(["en"]);
    expect(collectTools(root, ["en"]).map((tool) => tool.segment)).not.toContain("merged-pdfs");
  });
});

describe("what the machines are given", () => {
  it("writes all three files, describing the real catalogue", () => {
    const root = fixture(["en", "fr"]);
    const result = writeDiscoveryFiles(root);
    expect(result).toEqual({ tools: 3, locales: 2, categories: 2 });

    const json = JSON.parse(readFileSync(join(root, "api", "tools.json"), "utf8"));
    expect(json.tools).toHaveLength(3);
    expect(json.locales.map((entry) => entry.code)).toEqual(["en", "fr"]);
    expect(json.about.catalogue).toContain("3 tools");
    expect(json.privacy).toMatchObject({ requiresUpload: false, requiresAccount: false, processingMode: "browser" });
    expect(json.about.relatedTools).toContain("alsoInCategory");

    const merge = json.tools.find((tool) => tool.id === "pdf-merge");
    /* Every language's address, so a reader can link the right one. */
    expect(merge.urls).toEqual({
      en: `${SITE}/en/tools/pdf-merge/`,
      fr: `${SITE}/fr/tools/pdf-merge/`,
    });
    expect(merge.names.fr).toBe("Merge PDFs (fr)");
    expect(merge.alsoInCategory).toEqual(["pdf-split"]);
    expect(json.sections).toEqual([
      { name: "Developer", url: `${SITE}/en/c/developer/`, tools: 1 },
      { name: "PDF", url: `${SITE}/en/c/pdf/`, tools: 2 },
    ]);

    const short = readFileSync(join(root, "llms.txt"), "utf8");
    expect(short).toContain("# Kit");
    expect(short).toContain("### PDF (2 tools)");
    expect(short).toContain("### Developer (1 tool)");
    expect(short).toContain("Languages: en, fr");
    /* Every tool is a link a reader can follow, not a name to search for. */
    expect(short).toContain(`- [Merge PDFs](${SITE}/en/tools/pdf-merge/)`);
    expect(short).toContain(`- [Format JSON](${SITE}/en/tools/json-format/)`);
    expect(short).toContain(`${SITE}/<locale>/tools/<segment>/`);
    /* The one thing that leaves the device is stated, not glossed over. */
    expect(short).toContain("api.frankfurter.dev");
    expect(short).toContain("/api/tools.json");

    const full = readFileSync(join(root, "llms-full.txt"), "utf8");
    for (const segment of ["pdf-merge", "pdf-split", "json-format"]) {
      expect(full, segment).toContain(`- segment: ${segment}`);
    }
    expect(full).toContain("### Merge PDFs");
    expect(full).toContain("- description: Stack several PDFs into one.");
    /* Every language's name, so a tool can be named in the language asked for. */
    expect(full).toContain("en: Merge PDFs; fr: Merge PDFs (fr)");
    expect(full).toContain("## PDF");
  });

  it("describes Kit the way the hand-written file did, and claims no more", () => {
    const root = fixture(["en"]);
    writeDiscoveryFiles(root);
    const short = readFileSync(join(root, "llms.txt"), "utf8");
    expect(short).toContain(SITE);
    /* The licence of the engine that ships with the media tools travels with
       the description, as it did when this file was written by hand. */
    expect(short).toMatch(/MIT/u);
    expect(short).toMatch(/GPL/u);
    expect(short).toContain("github.com/TGthms/kit");
    for (const file of ["llms.txt", "llms-full.txt", "api/tools.json"]) {
      const text = readFileSync(join(root, file), "utf8");
      /* Nothing may sound like a review or a rating: Kit has none. */
      expect(text, file).not.toMatch(/aggregateRating/iu);
      expect(text, file).not.toMatch(/\bbest\b|\b#1\b|award/iu);
    }
  });

  it("names every tool in every file it writes", () => {
    const root = fixture(["en", "fr"]);
    writeDiscoveryFiles(root);
    const json = JSON.parse(readFileSync(join(root, "api", "tools.json"), "utf8"));
    const segments = json.tools.map((tool) => tool.id).sort();
    const short = readFileSync(join(root, "llms.txt"), "utf8");
    const full = readFileSync(join(root, "llms-full.txt"), "utf8");
    for (const segment of segments) {
      /* The index links it, the long file describes it, the data carries it. */
      expect(short, `${segment} missing from llms.txt`).toContain(`/en/tools/${segment}/`);
      expect(full, `${segment} missing from llms-full.txt`).toContain(`- segment: ${segment}`);
    }
    const described = [...full.matchAll(/^- segment: (.+)$/gmu)].map((match) => match[1]).sort();
    expect(described).toEqual(segments);
  });

  it("names the catalogue in the default language, whatever order it reads", () => {
    /* Arabic sorts before English, and the first language read used to supply
       the name — which made every entry in the catalogue Arabic. */
    const root = fixture(["ar", "en"]);
    writeDiscoveryFiles(root);
    const json = JSON.parse(readFileSync(join(root, "api", "tools.json"), "utf8"));
    const merge = json.tools.find((tool) => tool.id === "pdf-merge");
    expect(merge.name).toBe("Merge PDFs");
    expect(merge.description).toBe("Stack several PDFs into one.");
    expect(merge.section).toBe("PDF");
    /* The other language keeps its own wording, beside it. */
    expect(merge.names.ar).toBe("Merge PDFs (ar)");
    const short = readFileSync(join(root, "llms.txt"), "utf8");
    expect(short).toContain("- [Merge PDFs](");
    expect(short).not.toContain("- [Merge PDFs (ar)](");
  });

  it("refuses to describe an export it could not read", () => {
    const empty = mkdtempSync(join(tmpdir(), "kit-discovery-empty-"));
    roots.push(empty);
    expect(() => writeDiscoveryFiles(empty)).toThrow();
    writeFileSync(
      join(empty, "sw-precache.json"),
      `${JSON.stringify({ core: [], chromeByLocale: {}, engines: [], toolsByLocale: {}, rscByLocale: {}, extrasByLocale: {}, pagesByLocale: {} })}\n`,
    );
    expect(() => writeDiscoveryFiles(empty)).toThrow(/no languages/u);

    const noTools = fixture(["en"]);
    for (const locale of ["en"]) {
      rmSync(join(noTools, locale), { recursive: true, force: true });
    }
    expect(() => writeDiscoveryFiles(noTools)).toThrow(/no tool page/u);
  });
});
