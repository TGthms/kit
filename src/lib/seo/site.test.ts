import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY, CONTENT_SECURITY_POLICY_HEADER, ogImageUrl, ogLocaleFor, SITE_HOST, SITE_NAME, SITE_URL, WEBSITE_ID } from "./site";
import { websiteJsonLd, serializeJsonLd } from "./json-ld";
import { buildLocaleMetadata, buildSectionMetadata, buildToolMetadata, languageAlternates, socialImages } from "./metadata";

describe("content security policy", () => {
  it("does not allow jsDelivr and includes wasm-unsafe-eval", () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/jsdelivr/i);
    expect(CONTENT_SECURITY_POLICY).toContain("'wasm-unsafe-eval'");
    expect(CONTENT_SECURITY_POLICY).toContain("https://api.frankfurter.dev");
    expect(CONTENT_SECURITY_POLICY).not.toContain("frame-ancestors");
    expect(CONTENT_SECURITY_POLICY_HEADER).toContain("frame-ancestors 'none'");
  });

  it("mirrors the Cloudflare _headers CSP plus frame-ancestors", () => {
    const headers = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../public/_headers"), "utf8");
    expect(headers).toContain(`Content-Security-Policy: ${CONTENT_SECURITY_POLICY_HEADER}`);
  });
});

describe("og locale tags", () => {
  it("maps regional and Chinese variants for Open Graph", () => {
    expect(ogLocaleFor("en")).toBe("en_US");
    expect(ogLocaleFor("pt-BR")).toBe("pt_BR");
    expect(ogLocaleFor("pt-PT")).toBe("pt_PT");
    expect(ogLocaleFor("zh-Hans")).toBe("zh_CN");
    expect(ogLocaleFor("zh-Hant")).toBe("zh_TW");
    expect(ogLocaleFor("zh")).toBe("zh_CN");
    expect(ogLocaleFor("ar")).toBe("ar_AR");
    expect(ogLocaleFor("ja")).toBe("ja_JP");
  });
});

describe("og image URL", () => {
  it("points at the canonical host without a GitHub Pages prefix", () => {
    expect(ogImageUrl()).toBe(`${SITE_URL}/og/kit.png`);
    expect(ogImageUrl()).not.toContain("/kit/");
    const [image] = socialImages();
    expect(image.width).toBe(1200);
    expect(image.height).toBe(630);
    expect(image.type).toBe("image/png");
  });
});

describe("WebSite JSON-LD", () => {
  it("names Kit on the subdomain root with a lowercase host fallback", () => {
    const data = websiteJsonLd();
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      alternateName: [SITE_HOST],
      url: `${SITE_URL}/`,
    });
    expect(SITE_HOST).toBe("trykit.pages.dev");
    expect(data.alternateName[0]).toBe(data.alternateName[0].toLowerCase());
    expect(serializeJsonLd({ html: "</script>" })).toContain("\\u003c/script>");
    expect(serializeJsonLd({ html: "</script>" })).not.toContain("</script>");
  });
});

describe("root language alternates", () => {
  it("points x-default and each locale home at the canonical host", () => {
    const languages = languageAlternates("/");
    expect(languages["x-default"]).toBe(`${SITE_URL}/en/`);
    expect(languages.en).toBe(`${SITE_URL}/en/`);
    expect(languages["zh-Hans"]).toBe(`${SITE_URL}/zh-Hans/`);
    expect(languages).not.toHaveProperty("zh");
  });
});

describe("social metadata builders", () => {
  it("uses a large Twitter card and the OG image on home, tools, and sections", async () => {
    const home = await buildLocaleMetadata("fr");
    expect(home.twitter).toMatchObject({ card: "summary_large_image" });
    expect(home.openGraph?.images).toBeTruthy();
    expect(home.openGraph?.locale).toBe("fr_FR");
    expect(home.alternates?.canonical).toBe(`${SITE_URL}/fr/`);

    const tool = await buildToolMetadata("en", "pdf-merge");
    expect(tool.title).toEqual(expect.stringContaining("Kit"));
    expect(tool.description).toBeTruthy();
    expect(String(tool.alternates?.canonical)).toContain("/en/tools/pdf-merge/");

    const clock = await buildToolMetadata("en", "timezone-converter", "world-clock");
    expect(String(clock.alternates?.canonical)).toContain("/en/tools/world-clock/");
    expect(String(clock.alternates?.canonical)).not.toContain("timezone-converter");
    expect(clock.robots).toBeUndefined();

    const alias = await buildToolMetadata("en", "timezone-converter");
    expect(alias.robots).toMatchObject({ index: false, follow: true });

    const legacy = await buildToolMetadata("en", "media-convert");
    expect(String(legacy.alternates?.canonical)).toContain("/en/tools/video-convert/");
    expect(legacy.robots).toMatchObject({ index: false, follow: true });

    const settings = await buildSectionMetadata("de", "settings");
    expect(settings.title).toEqual(expect.stringContaining("Kit"));
    expect(String(settings.alternates?.canonical)).toBe(`${SITE_URL}/de/settings/`);
    expect(settings.robots).toMatchObject({ index: false, follow: true });

    const zh = await buildLocaleMetadata("zh");
    expect(zh.alternates?.canonical).toBe(`${SITE_URL}/zh-Hans/`);
    expect(zh.robots).toMatchObject({ index: false, follow: true });
    expect(zh.alternates?.languages).not.toHaveProperty("zh");
  });
});

describe("sitemap", () => {
  it("indexes first-class locales and omits chrome and /zh/", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith("/en/"))).toBe(true);
    expect(urls.some((url) => url.includes("/zh-Hans/tools/world-clock/"))).toBe(true);
    expect(urls.some((url) => url.includes("/zh/"))).toBe(false);
    expect(urls.some((url) => url.includes("/history/"))).toBe(false);
    expect(urls.some((url) => url.includes("/settings/"))).toBe(false);
    expect(urls.some((url) => url.includes("/favorites/"))).toBe(false);
    expect(urls.some((url) => url.includes("timezone-converter"))).toBe(false);
  });
});
