import { describe, expect, it } from "vitest";
import { ogImageUrl, ogLocaleFor, SITE_URL } from "./site";
import { buildLocaleMetadata, buildSectionMetadata, buildToolMetadata, socialImages } from "./metadata";

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

    const settings = await buildSectionMetadata("de", "settings");
    expect(settings.title).toEqual(expect.stringContaining("Kit"));
    expect(String(settings.alternates?.canonical)).toBe(`${SITE_URL}/de/settings/`);
  });
});
