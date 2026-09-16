import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { locales, messageFileFor } from "./config";
import en from "../../../messages/en.json";
import { tools } from "@/lib/tools/registry";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      leafPaths(v, prefix ? `${prefix}.${k}` : k)
    );
  }
  return prefix ? [prefix] : [];
}

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../messages");

/**
 * A tool's own sentence is newer than the rest of the catalog and is being
 * written language by language. While a language has none, its tool pages fall
 * back to the card label it already carries — which is translated — so an absent
 * summary is a state rather than a gap. Any summary that *is* present is still
 * held to the rule below: it must not be the English one.
 */
const optionalKey = (path: string) => /^tools\.[^.]+\.summary$/u.test(path);

describe("message catalogs", () => {
  const required = leafPaths(en);

  it("ships a JSON catalog for every first-class locale", () => {
    const files = new Set(readdirSync(root));
    for (const loc of locales) {
      expect(files.has(`${loc}.json`), loc).toBe(true);
    }
  });

  it("gives every tool a sentence of its own in English", async () => {
    /* Adding a tool without writing its sentence should fail here rather than
       ship a page whose only description is its own name. */
    for (const tool of tools) {
      const summary = (en as { tools: Record<string, { summary?: string }> }).tools[tool.id]?.summary;
      expect(summary, tool.id).toBeTruthy();
      expect(summary!.length, `${tool.id} length`).toBeGreaterThanOrEqual(100);
      expect(summary!.length, `${tool.id} length`).toBeLessThanOrEqual(160);
      expect(summary!, tool.id).not.toMatch(/[{}]/u);
    }
  });

  it("gives a language either every sentence or none of them", async () => {
    /* Half a language would show a sentence on some tool pages and a plain
       label on others: the fallback belongs to the language, not to the tool. */
    for (const loc of locales) {
      const catalog = (await import(`../../../messages/${messageFileFor(loc)}.json`)).default as {
        tools: Record<string, { summary?: string }>;
      };
      const written = tools.filter((tool) => catalog.tools[tool.id]?.summary).length;
      expect([0, tools.length], `${loc} has ${written} sentences`).toContain(written);
    }
  });

  /* A sentence is measured in columns, not characters: a Chinese glyph is about
     twice as wide as a Latin one, so fifty characters of Chinese and a hundred of
     English take the same room in a search result. The floor exists only to
     reject a label — "From Hz to RPM" and "Hz 到 RPM" both fail it by a wide
     margin — and the ceiling is about where a search engine would cut in. */
  const wide =
    /[\u1100-\u115F\u2E80-\u303F\u3040-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/u;
  const columns = (value: string) => [...value].reduce((n, char) => n + (wide.test(char) ? 2 : 1), 0);

  it("gives every sentence that is present a sentence's worth of room", async () => {
    const english = en as { tools: Record<string, { summary?: string }> };
    const problems: string[] = [];
    for (const loc of locales) {
      const catalog = (await import(`../../../messages/${messageFileFor(loc)}.json`)).default as {
        tools: Record<string, { summary?: string }>;
      };
      for (const tool of tools) {
        const summary = catalog.tools[tool.id]?.summary;
        if (!summary) continue;
        const width = columns(summary);
        if (width < 40 || summary.length < 18) problems.push(`${loc} ${tool.id} short: ${width}`);
        if (width > 175) problems.push(`${loc} ${tool.id} long: ${width}`);
        if (loc !== "en" && summary === english.tools[tool.id]?.summary)
          problems.push(`${loc} ${tool.id} is the English sentence`);
      }
    }
    expect(problems).toEqual([]);
  });

  /* The converter's picker names each unit in the reader's language. Where a
     label is still the English string it is because that language writes the unit
     the same way — kelvin, celsius, fahrenheit, bar, psi, hertz and stone in all
     of them, the CSS units rem and em everywhere, and spelled-alike words such as
     Dutch "kilometer", Portuguese "megabytes" and French "volts".

     These counts record how many that leaves, so a new unit cannot arrive in
     English by default: adding one to English raises every language's count and
     fails here. Lowering a number by naming a label properly is the expected
     direction; raising one needs a reason. */
  const englishLabelsAllowed: Record<string, number> = {
    en: 122,
    es: 26,
    fr: 43,
    de: 11,
    it: 11,
    "pt-BR": 34,
    "pt-PT": 32,
    nl: 34,
    da: 15,
    sv: 14,
    nb: 13,
    fi: 6,
    pl: 4,
    cs: 4,
    hu: 10,
    ro: 6,
    el: 3,
    tr: 9,
    ru: 3,
    uk: 3,
    ar: 3,
    he: 3,
    hi: 3,
    th: 3,
    vi: 12,
    id: 11,
    ja: 3,
    ko: 3,
    "zh-Hans": 3,
    "zh-Hant": 3,
  };

  it("names a unit in the reader's language, and no worse than it does now", async () => {
    const english = (en as { tools: Record<string, Record<string, string>> }).tools["everyday-converter"];
    const unitKeys = Object.keys(english).filter((key) => /^unit[A-Z]/u.test(key));
    expect(unitKeys.length).toBeGreaterThan(100);

    const over: string[] = [];
    for (const loc of locales) {
      const catalog = (await import(`../../../messages/${messageFileFor(loc)}.json`)).default as {
        tools: Record<string, Record<string, string>>;
      };
      const everyday = catalog.tools["everyday-converter"];
      const same = unitKeys.filter((key) => everyday[key] === english[key]).length;
      const allowed = englishLabelsAllowed[loc];
      expect(allowed, `${loc} is not in the table`).toBeTypeOf("number");
      if (same > allowed) over.push(`${loc} ${same} > ${allowed}`);
    }
    expect(over).toEqual([]);
  });

  it("keeps every English key in every catalog, including tool names", async () => {
    const missingByLocale: Record<string, string[]> = {};
    for (const loc of locales) {
      const file = messageFileFor(loc);
      const catalog = (await import(`../../../messages/${file}.json`)).default;
      const missing = required.filter((path) => {
        if (optionalKey(path)) return false;
        const value = getPath(catalog, path);
        return typeof value !== "string" || value.trim() === "";
      });
      missingByLocale[loc] = missing;
    }
    const broken = Object.entries(missingByLocale).filter(([, m]) => m.length > 0);
    expect(broken.map(([loc, m]) => `${loc}:${m.length}:${m.slice(0, 5).join(",")}`)).toEqual([]);

    for (const loc of locales) {
      const file = messageFileFor(loc);
      const catalog = (await import(`../../../messages/${file}.json`)).default as {
        tools: Record<string, { name?: string; description?: string }>;
      };
      for (const tool of tools) {
        expect(catalog.tools[tool.id]?.name, `${loc} ${tool.id} name`).toBeTruthy();
        expect(catalog.tools[tool.id]?.description, `${loc} ${tool.id} description`).toBeTruthy();
      }
    }
  });

  it("keeps Chinese converter chrome keys from sliding one slot", async () => {
    for (const loc of ["zh-Hans", "zh-Hant"] as const) {
      const catalog = (await import(`../../../messages/${loc}.json`)).default as {
        tools: Record<string, Record<string, string>>;
      };
      const t = catalog.tools["everyday-converter"];
      expect(t.swapUnits, `${loc} swapUnits`).not.toMatch(/货币|貨幣/u);
      expect(t.swapCurrencies, `${loc} swapCurrencies`).toMatch(/货币|貨幣/u);
      expect(t.dpi, `${loc} dpi`).toMatch(/DPI/i);
      expect(t.searchAria, `${loc} searchAria`).toMatch(/\{label\}/u);
      expect(t.rateUnavailable, `${loc} rateUnavailable`).not.toMatch(/\{label\}/u);
    }
  });

  it("keeps Japanese and Korean converter chrome aligned", async () => {
    const ja = (await import("../../../messages/ja.json")).default as { tools: Record<string, Record<string, string>> };
    const ko = (await import("../../../messages/ko.json")).default as { tools: Record<string, Record<string, string>> };
    expect(ja.tools["everyday-converter"].swapUnits).toMatch(/単位/);
    expect(ja.tools["everyday-converter"].swapCurrencies).toMatch(/通貨/);
    expect(ja.tools["everyday-converter"].dpi).toBe("DPI");
    expect(ja.tools["everyday-converter"].searchAria).toMatch(/\{label\}/);
    expect(ko.tools["everyday-converter"].swapUnits).toMatch(/단위/);
    expect(ko.tools["everyday-converter"].swapCurrencies).toMatch(/통화/);
    expect(ko.tools["everyday-converter"].dpi).toBe("DPI");
    expect(ko.tools["everyday-converter"].searchAria).toMatch(/\{label\}/);
  });

  it("does not leave English currency name, description, or limits", async () => {
    const leftover: string[] = [];
    const enCurrency = (en as { tools: Record<string, Record<string, string>> }).tools["currency-converter"];
    for (const loc of locales) {
      if (loc === "en") continue;
      const file = messageFileFor(loc);
      const catalog = (await import(`../../../messages/${file}.json`)).default as {
        tools: Record<string, Record<string, string>>;
      };
      const currency = catalog.tools["currency-converter"] ?? {};
      if (/\bconverter\b/i.test(currency.name ?? "") && !/valutaconverter/i.test(currency.name ?? "")) {
        leftover.push(`${loc}:name`);
      }
      if (currency.description === enCurrency.description) leftover.push(`${loc}:description`);
      if (currency.limits === enCurrency.limits) leftover.push(`${loc}:limits`);
    }
    expect(leftover).toEqual([]);
  });

  it("does not leave English How Kit works story copy", async () => {
    const leftover: string[] = [];
    const enHow = (en as { how: Record<string, string> }).how;
    const keys = [
      "lanesTitle", "greetTitle", "greetLede",
      "whyTitle", "exampleTitle", "verifyTitle", "faqTitle", "ctaTitle",
    ] as const;
    for (const loc of locales) {
      if (loc === "en") continue;
      const file = messageFileFor(loc);
      const catalog = (await import(`../../../messages/${file}.json`)).default as { how: Record<string, string> };
      for (const key of keys) {
        if (catalog.how[key] === enHow[key]) leftover.push(`${loc}:${key}`);
      }
    }
    expect(leftover).toEqual([]);
  });

  it("does not leave English unit labels in non-English catalogs", async () => {
    const leftover: string[] = [];
    for (const loc of locales) {
      if (loc === "en") continue;
      const file = messageFileFor(loc);
      const catalog = (await import(`../../../messages/${file}.json`)).default as {
        tools: Record<string, Record<string, string>>;
      };
      const everyday = catalog.tools["everyday-converter"] ?? {};
      if (everyday.unitNmi === "Nautical miles (nmi)") leftover.push(`${loc}:unitNmi`);
      if (everyday.unitUsTsp === "US teaspoons") leftover.push(`${loc}:unitUsTsp`);
      if (everyday.unitStone === "Stone") leftover.push(`${loc}:unitStone`);
      expect(catalog.tools["currency-converter"]?.unitMm, `${loc} currency unitMm`).toBeUndefined();
    }
    expect(leftover).toEqual([]);
  });

  it("translates multi-word English phrases in every catalog", async () => {
    // Single words are often legitimate cognates (cs "Text", de "Start") and
    // stay under the spot checks above. A multi-word English sentence or
    // label surviving into a locale, however, is always an untranslated gap.
    const allow = new Set([
      "brand.name", "footer.github", "categories.pdf",
      "tools.markdown-html.name", "tools.markdown-html.toHtml", "tools.markdown-html.toMd",
      "tools.csv-json.name", "tools.csv-json.toJson", "tools.csv-json.toCsv",
      "tools.xml-json.name", "tools.xml-json.toJson", "tools.xml-json.toXml",
      "tools.json-types.name", "tools.video-gif.name", "tools.pdf-to-images.name",
      "tools.images-to-pdf.name", "tools.base64.name",
      "tools.everyday-converter.unitRem", "tools.everyday-converter.unitEm",
      "tools.everyday-converter.unitPsi", "tools.everyday-converter.unitBar",
      "tools.everyday-converter.dpi",
      "tools.everyday-converter.presetKmhMph", "tools.everyday-converter.presetGbGib",
      "tools.everyday-converter.presetHzRpm", "tools.everyday-converter.presetNmLbFt",
      "tools.everyday-converter.presetPxRem", "tools.everyday-converter.presetPxPt",
      "tools.everyday-converter.presetL100kmMpg", "tools.everyday-converter.presetBarPsi",
      "tools.everyday-converter.presetOhmsKilohms", "tools.everyday-converter.presetKwhJoules",
      "tools.everyday-converter.presetMs2G", "tools.everyday-converter.presetCelsiusFahrenheit",
      "tools.everyday-converter.presetCelsiusKelvin", "tools.everyday-converter.presetVoltsMillivolts",
      "tools.timezone-converter.zoneUtc",
      "tools.date-calculator.holidaysPlaceholder", "tools.date-calculator.minutesResult",
      "tools.meeting-planner.utcHour", "tools.meeting-planner.zone",
      "tools.tip-split-calculator.person",
      "tools.image-palette.pixels",
      "tools.slugify.slug", "how.statsUploads",
      "tools.bmi-calorie-calculator.minorBadge", "tools.bmi-calorie-calculator.imperial",
      "tools.everyday-converter.presetMetricImperial",
      "tools.hash-generator.keywords", "tools.tip-split-calculator.tipPercent",
      "tools.bmi-calorie-calculator.cm", "tools.bmi-calorie-calculator.ft",
      "tools.bmi-calorie-calculator.in", "tools.bmi-calorie-calculator.kg",
      "tools.bmi-calorie-calculator.lb", "tools.bmi-calorie-calculator.kcal",
      "tools.bmi-calorie-calculator.bmr", "tools.bmi-calorie-calculator.bmi",
      "tools.bmi-calorie-calculator.healthyWeightValue",
      "how.techDl", "tools.percentage-calculator.modeOf",
      "how.compareKit", "how.techPdfJob", "how.techMediaRuns",
      "how.techImageRuns", "how.techCryptoRuns", "how.techPwaRuns",
      "tools.slugify.name", "tools.lorem-ipsum.name", "tools.hash-generator.digest",
      "tools.regex-tester.flags", "tools.image-filters.sepia",
      "tools.image-filters.invert", "tools.image-filters.filter",
      "tools.currency-converter.searchAria", "tools.timezone-converter.searchAria",
    ]);
    const masked = (path: string) => /tools\.(everyday-converter|currency-converter)\.unit[A-Z]/.test(path);
    // Latin-script locales may keep geographic exonyms identical to English.
    const nonLatin = new Set(["ja", "ko", "zh-Hans", "zh-Hant", "zh", "ar", "he", "hi", "th", "ru", "uk", "el"]);
    const isGeo = (path: string) => /tools\.timezone-converter\.(city|zone)[A-Z]/.test(path);
    const leaves = leafPaths(en).map((path) => [path, getPath(en, path)] as const);

    const leftover: string[] = [];
    for (const loc of locales) {
      if (loc === "en") continue;
      const file = messageFileFor(loc);
      const catalog = (await import(`../../../messages/${file}.json`)).default;
      for (const [path, enValue] of leaves) {
        if (typeof enValue !== "string" || !enValue.includes(" ") || !/[A-Za-z]{2}/.test(enValue)) continue;
        if (allow.has(path) || masked(path)) continue;
        if (isGeo(path) && !nonLatin.has(loc)) continue;
        const value = getPath(catalog, path);
        if (value === enValue) leftover.push(`${loc}:${path}`);
      }
    }
    expect(leftover).toEqual([]);
  });
});
