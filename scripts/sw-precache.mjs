/**
 * After static export, list shell assets for the service worker's idle fill,
 * and name the build's caches after their contents.
 *
 * Not committed; Cloudflare `npm run build` produces `out/sw-precache.json` and
 * rewrites `out/sw.js` with the stamp described below.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The token `public/sw.js` carries in place of the stamp. */
export const BUILD_PLACEHOLDER = "__KIT_BUILD__";

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
 * pages themselves: an alias names some other address as its own, which is
 * exactly what makes it a compatibility address instead of something a visitor
 * chooses. The set is the same in every language, so only one language is read.
 *
 * The rule is the page's own canonical rather than its "do not index" marker:
 * the backup host asks every one of its pages not to be indexed, so judging by
 * that would call every tool an alias there and leave its Offline access page
 * offering none. This is also the rule the language aliases below already use.
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
    const href = readFileSync(page, "utf8").match(/<link rel="canonical" href="([^"]+)"/u)?.[1];
    if (!href) continue;
    let path;
    try {
      path = new URL(href).pathname;
    } catch {
      continue;
    }
    if (path !== `/${locale}/tools/${entry.name}/`) found.add(entry.name);
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

/**
 * A digest of everything this build ships, used to name its caches.
 *
 * The worker carries it, so the worker's own bytes change exactly when the
 * content does: a browser then installs the new worker, which opens a fresh
 * pair of caches and deletes the previous pair. Content written by an earlier
 * build can therefore never be served alongside this one.
 *
 * An address that carries its own hash in the name is covered by the list
 * alone; documents and Flight payloads keep the same address whatever they
 * contain, so their bytes are read as well.
 */
export function buildStamp(outDir, manifest, basePath = "") {
  const prefix = basePath.replace(/\/$/, "");
  const fileFor = (url) => {
    const path = prefix && url.startsWith(prefix) ? url.slice(prefix.length) : url;
    return join(outDir, path.endsWith("/") ? `${path}index.html` : path);
  };
  const urls = new Set([
    ...manifest.core,
    ...manifest.engines,
    ...Object.values(manifest.chromeByLocale).flat(),
    ...Object.values(manifest.toolsByLocale).flat(),
    ...Object.values(manifest.rscByLocale).flat(),
    ...Object.values(manifest.extrasByLocale).flat(),
  ]);
  const hash = createHash("sha256");
  for (const url of [...urls].sort()) {
    hash.update(url);
    hash.update("\0");
    const file = fileFor(url);
    if (existsSync(file)) hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}

/** The line the worker declares its build on. */
const BUILD_LINE = /^const BUILD = "([^"]*)";$/mu;
const STAMP = /^[a-f0-9]{12}$/u;

/**
 * Put this build's stamp into the exported worker.
 *
 * `public/sw.js` is the source and keeps the placeholder, so what the worker
 * does is readable there. Only the exported copy is stamped. Running this again
 * over an export that already carries a stamp is expected — a resumed build, or
 * a hand-run step — so the current value is replaced rather than required to be
 * the placeholder.
 */
export function stampServiceWorker(outDir, stamp) {
  const file = join(outDir, "sw.js");
  if (!existsSync(file)) throw new Error(`no worker at ${file}`);
  const source = readFileSync(file, "utf8");
  const current = source.match(BUILD_LINE)?.[1];
  if (current === undefined) {
    throw new Error(
      `the worker has no \`const BUILD = "…"\` line: without one every build would share a single set of caches`,
    );
  }
  if (current !== BUILD_PLACEHOLDER && !STAMP.test(current)) {
    throw new Error(`the worker's build is ${JSON.stringify(current)}, which is neither the placeholder nor a stamp`);
  }
  if (current === stamp) return stamp;
  writeFileSync(file, source.replace(BUILD_LINE, `const BUILD = "${stamp}";`));
  return stamp;
}

export function writePrecacheManifest(outDir, basePath = "") {
  if (!existsSync(outDir)) throw new Error(`export directory not found: ${outDir}`);
  const manifest = buildPrecacheManifest(outDir, basePath);
  writeFileSync(join(outDir, "sw-precache.json"), `${JSON.stringify(manifest)}\n`);
  stampServiceWorker(outDir, buildStamp(outDir, manifest, basePath));
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
  console.log(`[sw-precache] build ${readFileSync(join(outDir, "sw.js"), "utf8").match(/^const BUILD = "([^"]+)"/mu)?.[1]}`);
}
