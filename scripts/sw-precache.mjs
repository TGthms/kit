/**
 * After static export, list shell assets for the service worker's idle fill.
 * Not committed; Cloudflare `npm run build` produces `out/sw-precache.json`.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKIP_DIRS = new Set(["node_modules"]);
const SKIP_LOCALE_DIRS = new Set(["_next", "vendor", "boot", "icons", "404", "_not-found"]);

/**
 * The app's own pages, in the order Offline access lists them: the id the page
 * can offer, and the path segment that names it under each language.
 *
 * These are the shell rather than the catalog — whichever language is chosen
 * they are what makes the app usable with the network off, which is why the
 * page can offer them like anything else it downloads.
 */
export const APP_PAGE_SEGMENTS = [
  ["home", ""],
  ["favorites", "favorites/"],
  ["history", "history/"],
  ["settings", "settings/"],
  ["offline", "settings/offline/"],
  ["how", "how/"],
  ["privacy", "privacy/"],
  ["terms", "terms/"],
];

export function toSitePath(outDir, file) {
  const rel = relative(outDir, file).split("\\").join("/");
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
}

export function walkFiles(root) {
  const files = [];
  function visit(dir) {
    for (const name of readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) visit(full);
      else if (st.isFile()) files.push(full);
    }
  }
  visit(root);
  return files;
}

export function buildPrecacheManifest(outDir, basePath = "") {
  const prefix = basePath.replace(/\/$/, "");
  const withBase = (path) => `${prefix}${path}`;
  const files = walkFiles(outDir);
  const core = [];
  const pdfjs = [];
  const ffmpeg = [];
  const locales = new Set();

  for (const file of files) {
    const path = toSitePath(outDir, file);
    if (path.includes("/_next/static/") && /\.(js|css|woff2?)$/u.test(path)) core.push(withBase(path));
    else if (path.startsWith("/boot/") && path.endsWith(".js")) core.push(withBase(path));
    else if (path.startsWith("/icons/") || path.endsWith("manifest.webmanifest") || path.endsWith("/favicon.ico") || path.endsWith("/favicon.svg")) {
      core.push(withBase(path));
    } else if (path.startsWith("/vendor/pdfjs/")) pdfjs.push(withBase(path));
    else if (path.startsWith("/vendor/ffmpeg/")) ffmpeg.push(withBase(path));
  }

  for (const name of readdirSync(outDir)) {
    const full = join(outDir, name);
    if (!statSync(full).isDirectory()) continue;
    if (SKIP_LOCALE_DIRS.has(name)) continue;
    if (existsSync(join(full, "index.html"))) locales.add(name);
  }

  const rscPath = (htmlPath) => `${htmlPath}index.txt`;
  const chromeByLocale = {};
  const toolsByLocale = {};
  const rscByLocale = {};
  const extrasByLocale = {};
  const pagesByLocale = {};
  /* Two kinds of address exist only so an old link keeps working, and neither is
     offered in Offline access. A tool alias marks itself `noindex`; a language
     alias names a different language as its own address. Both are still
     precached, but they are kept out of the lists below, because those are what
     decide whether a language counts as ready — leaving them in would mean no
     language could ever be complete, since nothing on the page can select
     them. */
  const aliasSegments = aliasToolSegments(outDir, [...locales]);
  const aliasLocales = aliasLocaleDirs(outDir, [...locales]);
  for (const locale of [...locales].sort()) {
    /* Read off the export rather than assumed: a page that this build did not
       write is not offered, and is not counted against the language either. */
    const pages = {};
    const chrome = [];
    for (const [id, segment] of APP_PAGE_SEGMENTS) {
      if (!existsSync(join(outDir, locale, segment, "index.html"))) continue;
      const url = withBase(`/${locale}/${segment}`);
      pages[id] = [url];
      chrome.push(url);
    }
    const toolsRoot = join(outDir, locale, "tools");
    const tools = [];
    const aliases = [];
    if (existsSync(toolsRoot)) {
      for (const entry of readdirSync(toolsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (!existsSync(join(toolsRoot, entry.name, "index.html"))) continue;
        const url = withBase(`/${locale}/tools/${entry.name}/`);
        (aliasSegments.has(entry.name) ? aliases : tools).push(url);
      }
    }
    tools.sort();
    aliases.sort();
    const catRoot = join(outDir, locale, "c");
    const categoryPages = [];
    if (existsSync(catRoot)) {
      for (const entry of readdirSync(catRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (existsSync(join(catRoot, entry.name, "index.html"))) {
          categoryPages.push(withBase(`/${locale}/c/${entry.name}/`));
        }
      }
    }
    categoryPages.sort();
    /* One row on the page rather than nine: switching a category on and off is
       not something a visitor preparing for a flight needs to decide. */
    pages.categories = categoryPages;
    chrome.push(...categoryPages);
    const rsc = [...chrome, ...tools].map(rscPath);

    if (aliasLocales.has(locale)) {
      /* Everything under an aliased language is prefetched, so a visitor who
         followed the old address still works offline, but none of it counts. */
      extrasByLocale[locale] = [...chrome, ...tools, ...aliases, ...rsc, ...aliases.map(rscPath)];
      continue;
    }
    chromeByLocale[locale] = chrome;
    toolsByLocale[locale] = tools;
    rscByLocale[locale] = rsc;
    pagesByLocale[locale] = pages;
    extrasByLocale[locale] = [...aliases, ...aliases.map(rscPath)];
  }

  core.sort();
  pdfjs.sort();
  ffmpeg.sort();
  return { core, engines: [...pdfjs, ...ffmpeg], chromeByLocale, toolsByLocale, rscByLocale, extrasByLocale, pagesByLocale };
}

/**
 * The tool route segments that are aliases rather than tools, read off the
 * pages themselves: those pages ask not to be indexed, which is exactly what
 * makes them compatibility addresses instead of something a visitor chooses.
 * The set is the same in every language, so only one language is read.
 */
export function aliasToolSegments(outDir, localeNames) {
  const locale = localeNames.includes("en") ? "en" : localeNames[0];
  const toolsRoot = join(outDir, locale, "tools");
  const found = new Set();
  if (!locale || !existsSync(toolsRoot)) return found;
  for (const entry of readdirSync(toolsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const page = join(toolsRoot, entry.name, "index.html");
    if (!existsSync(page)) continue;
    if (/<meta name="robots" content="noindex[^"]*"/u.test(readFileSync(page, "utf8"))) found.add(entry.name);
  }
  return found;
}

/**
 * The language directories that are compatibility addresses rather than
 * languages a visitor can choose.
 *
 * A language's home page names itself as its own address; the page behind an
 * old link names the language it now belongs to instead. That difference is
 * read off the pages rather than listed here, so adding or removing one needs
 * no change to this file.
 */
export function aliasLocaleDirs(outDir, localeNames) {
  const found = new Set();
  for (const name of localeNames) {
    const page = join(outDir, name, "index.html");
    if (!existsSync(page)) continue;
    const href = readFileSync(page, "utf8").match(/<link rel="canonical" href="([^"]+)"/u)?.[1];
    if (!href) continue;
    let first;
    try {
      first = new URL(href).pathname.split("/").filter(Boolean)[0];
    } catch {
      continue;
    }
    if (first && first !== name) found.add(name);
  }
  return found;
}

export function writePrecacheManifest(outDir, basePath = "") {
  if (!existsSync(outDir)) throw new Error(`export directory not found: ${outDir}`);
  const manifest = buildPrecacheManifest(outDir, basePath);
  writeFileSync(join(outDir, "sw-precache.json"), `${JSON.stringify(manifest)}\n`);
  return manifest;
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invoked) {
  const rootDir = dirname(dirname(thisFile));
  const outDir = join(rootDir, "out");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const manifest = writePrecacheManifest(outDir, basePath);
  const chrome = Object.values(manifest.chromeByLocale).reduce((n, list) => n + list.length, 0);
  console.log(
    `[sw-precache] core ${manifest.core.length}; engines ${manifest.engines.length}; chrome ${chrome}; locales ${Object.keys(manifest.chromeByLocale).length}`,
  );
  const pages = Object.values(manifest.pagesByLocale)[0] ?? {};
  console.log(`[sw-precache] app pages ${Object.keys(pages).length} per language, ${Object.keys(pages).length * Object.keys(manifest.pagesByLocale).length} in total`);
}
