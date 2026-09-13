import { describe, expect, it } from "vitest";
import { extractUrlEntries, groupKeyFor, splitSitemapSource } from "./sitemap-split.mjs";

const origin = "https://trykit.pages.dev";

function url(loc, lastmod = "2026-09-13T21:55:26.365Z") {
  return `<url>\n<loc>${loc}</loc>\n<lastmod>${lastmod}</lastmod>\n</url>`;
}

function sitemapXml(locs) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs
    .map((loc) => url(loc))
    .join("\n")}\n</urlset>\n`;
}

describe("splitSitemapSource", () => {
  it("groups addresses by their language and keeps every one", () => {
    const source = sitemapXml([
      `${origin}/en/`,
      `${origin}/en/tools/pdf-merge/`,
      `${origin}/fr/`,
      `${origin}/zh-Hans/tools/pdf-merge/`,
    ]);
    const { children, total } = splitSitemapSource(source, origin);

    expect(total).toBe(4);
    expect(children.map((child) => child.key)).toEqual(["en", "fr", "zh-Hans"]);
    expect(children.reduce((sum, child) => sum + child.count, 0)).toBe(4);
    expect(children.find((child) => child.key === "en").count).toBe(2);
  });

  it("writes an index that points at every child on the same origin", () => {
    const { children, index } = splitSitemapSource(
      sitemapXml([`${origin}/en/`, `${origin}/fr/`]),
      origin
    );

    expect(index).toContain("<sitemapindex");
    for (const child of children) {
      expect(index).toContain(`<loc>${origin}/${child.fileName}</loc>`);
      expect(child.url).toBe(`${origin}/${child.fileName}`);
    }
    expect((index.match(/<sitemap>/g) || []).length).toBe(2);
  });

  it("gives each child a well-formed document of its own", () => {
    const { children } = splitSitemapSource(
      sitemapXml([`${origin}/en/`, `${origin}/en/how/`, `${origin}/de/`]),
      origin
    );

    for (const child of children) {
      expect(child.body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(child.body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(child.body.trimEnd().endsWith("</urlset>")).toBe(true);
      expect(extractUrlEntries(child.body).length).toBe(child.count);
    }
  });

  it("refuses to file an address that has no language", () => {
    expect(() => groupKeyFor(`${origin}/`)).toThrow(/language segment/);
    expect(() => splitSitemapSource(`<urlset>${url(`${origin}/`)}</urlset>`, origin)).toThrow(
      /root forwards to a language/
    );
  });

  it("refuses an empty sitemap rather than writing an index over nothing", () => {
    expect(() => splitSitemapSource("<urlset></urlset>", origin)).toThrow(/no <url> entries/);
  });
});
