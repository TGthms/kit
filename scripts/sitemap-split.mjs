/**
 * Divide the generated sitemap into one file per language and write an index
 * over them.
 *
 * Next produces a single sitemap covering every language. Splitting it keeps
 * each file small and, more usefully, lets a search engine report coverage per
 * language, so a problem in one language is traceable instead of being averaged
 * into one number for the whole site.
 *
 * The index replaces `out/sitemap.xml`, which `robots.txt` already points at.
 * Everything is built in memory and checked before anything is written, so a
 * mistake leaves the single-file sitemap Next produced in place rather than
 * publishing a broken one.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n';

export function extractUrlEntries(xml) {
  return [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((match) => match[0]);
}

/** The first meaningful segment of a URL path, which is its language. */
export function groupKeyFor(loc) {
  const path = new URL(loc).pathname;
  const segment = path.split("/").filter(Boolean)[0];
  if (!segment) {
    throw new Error(
      `sitemap lists ${loc}, which has no language segment. The root forwards to a language and must not be listed as a page.`
    );
  }
  return segment;
}

export function splitSitemapSource(xml, origin) {
  const entries = extractUrlEntries(xml);
  if (!entries.length) throw new Error("sitemap has no <url> entries to split");
  const groups = new Map();
  for (const entry of entries) {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) throw new Error(`sitemap entry has no <loc>: ${entry.slice(0, 80)}`);
    const key = groupKeyFor(loc);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  const children = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupEntries]) => ({
      key,
      fileName: `sitemap-${key}.xml`,
      url: `${origin}/sitemap-${key}.xml`,
      body: `${XML_HEADER}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${groupEntries.join("\n")}\n</urlset>\n`,
      count: groupEntries.length,
    }));
  const index = `${XML_HEADER}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${children
    .map((child) => `<sitemap><loc>${child.url}</loc></sitemap>`)
    .join("\n")}\n</sitemapindex>\n`;
  return { children, index, total: entries.length };
}

export function splitSitemap(outDir) {
  const sitemapPath = join(outDir, "sitemap.xml");
  if (!existsSync(sitemapPath)) throw new Error(`no sitemap at ${sitemapPath}`);
  const original = readFileSync(sitemapPath, "utf8");
  if (original.includes("<sitemapindex")) {
    /* Already split: a second run (or a resumed build) has nothing to do. */
    const existing = (original.match(/<sitemap>/g) || []).length;
    return { children: existing, total: null, skipped: true };
  }
  const firstLoc = original.match(/<loc>([^<]+)<\/loc>/)?.[1];
  if (!firstLoc) throw new Error("sitemap has no <loc> to take an origin from");
  const { children, index, total } = splitSitemapSource(original, new URL(firstLoc).origin);

  const counted = children.reduce((sum, child) => sum + child.count, 0);
  if (counted !== total) {
    throw new Error(`split lost URLs: ${total} in, ${counted} out`);
  }
  for (const child of children) {
    const back = extractUrlEntries(child.body).length;
    if (back !== child.count) throw new Error(`${child.fileName} round-trip mismatch`);
  }

  for (const child of children) writeFileSync(join(outDir, child.fileName), child.body);
  writeFileSync(sitemapPath, index);
  return { children: children.length, total, skipped: false };
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invoked) {
  const rootDir = dirname(dirname(thisFile));
  const outDir = join(rootDir, "out");
  const result = splitSitemap(outDir);
  console.log(
    result.skipped
      ? `[sitemap-split] already split; ${result.children} child sitemaps`
      : `[sitemap-split] ${result.total} URLs across ${result.children} language sitemaps + index`
  );
}
