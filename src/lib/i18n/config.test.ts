import { describe, expect, it } from "vitest";
import {
  detectLocale,
  isLocale,
  isPathLocale,
  localeDir,
  localeHtmlLang,
  localeNames,
  locales,
  resolveLocale,
} from "./config";

const TABLE = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt-BR",
  "pt-PT",
  "nl",
  "da",
  "sv",
  "nb",
  "fi",
  "pl",
  "cs",
  "hu",
  "ro",
  "el",
  "tr",
  "ru",
  "uk",
  "ar",
  "he",
  "hi",
  "th",
  "vi",
  "id",
  "ja",
  "ko",
  "zh-Hans",
  "zh-Hant",
] as const;

describe("locale table", () => {
  it("lists every requested code exactly once", () => {
    expect([...locales]).toEqual([...TABLE]);
    expect(new Set(locales).size).toBe(30);
    expect(Object.keys(localeNames).sort()).toEqual([...TABLE].sort());
  });
});

describe("isLocale", () => {
  it("accepts every table code and rejects junk", () => {
    for (const code of TABLE) {
      expect(isLocale(code)).toBe(true);
    }
    expect(isLocale("zh")).toBe(false);
    expect(isLocale("pt")).toBe(false);
    expect(isLocale("en-US")).toBe(false);
    expect(isLocale("xx")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("resolveLocale", () => {
  it("maps zh to zh-Hans and leaves official codes alone", () => {
    expect(resolveLocale("zh")).toBe("zh-Hans");
    expect(resolveLocale("zh-Hans")).toBe("zh-Hans");
    expect(resolveLocale("fr")).toBe("fr");
    expect(resolveLocale("nope")).toBe("en");
    expect(isPathLocale("zh")).toBe(true);
    expect(isPathLocale("fr")).toBe(true);
    expect(isPathLocale("xx")).toBe(false);
  });
});

describe("detectLocale", () => {
  it("maps Chinese and Portuguese regional tags", () => {
    expect(detectLocale("zh-TW")).toBe("zh-Hant");
    expect(detectLocale("zh-Hant")).toBe("zh-Hant");
    expect(detectLocale("zh-HK")).toBe("zh-Hant");
    expect(detectLocale("zh-CN")).toBe("zh-Hans");
    expect(detectLocale("zh")).toBe("zh-Hans");
    expect(detectLocale("pt-BR")).toBe("pt-BR");
    expect(detectLocale("pt-PT")).toBe("pt-PT");
    expect(detectLocale("pt")).toBe("pt-PT");
    expect(detectLocale("ar")).toBe("ar");
    expect(detectLocale("ar-SA")).toBe("ar");
    expect(detectLocale("nb-NO")).toBe("nb");
    expect(detectLocale("no")).toBe("nb");
    expect(detectLocale("fr-CA")).toBe("fr");
    expect(detectLocale("en-GB")).toBe("en");
    expect(detectLocale("zz-ZZ")).toBe("en");
  });
});

describe("native picker source", () => {
  it("uses a single select listing every locale", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(process.cwd(), "src/components/layout/locale-switcher.tsx"), "utf8");
    expect(src).toContain("<select");
    expect(src).toContain("locales.map");
    expect(src).not.toMatch(/role="group"/);
  });
});

describe("direction and html lang", () => {
  it("marks Arabic and Hebrew RTL and everyone else LTR", () => {
    expect(localeDir("ar")).toBe("rtl");
    expect(localeDir("he")).toBe("rtl");
    expect(localeDir("en")).toBe("ltr");
    expect(localeDir("fr")).toBe("ltr");
    expect(localeDir("zh")).toBe("ltr");
    expect(localeHtmlLang("zh")).toBe("zh-Hans");
    expect(localeHtmlLang("pt-BR")).toBe("pt-BR");
  });

  it("bakes lang and dir onto the locale document html", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const localeLayout = readFileSync(join(process.cwd(), "src/app/[locale]/layout.tsx"), "utf8");
    const rootLayout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    const gateLayout = readFileSync(join(process.cwd(), "src/app/(root)/layout.tsx"), "utf8");
    expect(rootLayout).not.toMatch(/<html/);
    expect(gateLayout).toMatch(/<html lang="en" dir="ltr"/);
    expect(localeLayout).toMatch(/<html lang=\{lang\} dir=\{dir\}/);
  });
});
