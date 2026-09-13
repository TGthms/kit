/**
 * After static export, list shell assets for the service worker's idle fill.
 * Not committed; Cloudflare `npm run build` produces `out/sw-precache.json`.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKIP_DIRS = new Set(["node_modules"]);
const SKIP_LOCALE_DIRS = new Set(["_next", "vendor", "boot", "icons", "404", "_not-found"]);
const CHROME_SEGMENTS = ["", "settings/", "favorites/", "history/", "privacy/", "terms/", "how/"];

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
  /* Tool URLs that exist only so an old link keeps working. Each such page marks
     itself `noindex` and the app rewrites the address to the current one, so it
     is never offered in Offline access. It is still precached, but it is kept
     out of the lists below because those are what decides whether a language
     counts as ready — leaving them in would mean no language could ever be
     complete, since nothing on the page can select them. */
  const aliasSegments = aliasToolSegments(outDir, [...locales]);
  for (const locale of [...locales].sort()) {
    chromeByLocale[locale] = CHROME_SEGMENTS.map((seg) => withBase(`/${locale}/${seg}`));
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
    toolsByLocale[locale] = tools.sort();
    const aliasUrls = aliases.sort();
    extrasByLocale[locale] = [...aliasUrls, ...aliasUrls.map(rscPath)];
    const catRoot = join(outDir, locale, "c");
    if (existsSync(catRoot)) {
      for (const entry of readdirSync(catRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (existsSync(join(catRoot, entry.name, "index.html"))) {
          chromeByLocale[locale].push(withBase(`/${locale}/c/${entry.name}/`));
        }
      }
    }
    rscByLocale[locale] = [...chromeByLocale[locale], ...toolsByLocale[locale]].map(rscPath);
  }

  core.sort();
  pdfjs.sort();
  ffmpeg.sort();
  return { core, engines: [...pdfjs, ...ffmpeg], chromeByLocale, toolsByLocale, rscByLocale, extrasByLocale };
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
}
