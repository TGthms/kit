import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GREETING_DISTINCT_VARIANT_KEYS,
  GREETING_VARIANT_KEYS,
  NEW_YEAR_CARD_KEYS,
  OBSERVANCE_KEYS,
  OBSERVANCE_RULES,
  SUBTITLE_FACT_KEYS,
} from "./greeting";

type Catalog = {
  home: {
    greeting: Record<string, unknown> & { occasionLabel: Record<string, unknown>; observance: Record<string, unknown>; extra1?: string; extra2?: string; extra3?: string };
    subtitleFacts: Record<string, unknown>;
    subtitleObservance: Record<string, unknown>;
    newYearCard: Record<string, unknown>;
  };
};

const messageDir = path.join(process.cwd(), "messages");
const files = fs.readdirSync(messageDir).filter((file) => file.endsWith(".json")).sort();

function read(locale: string): Catalog {
  return JSON.parse(fs.readFileSync(path.join(messageDir, `${locale}.json`), "utf8"));
}

function variables(value: string): string[] {
  return [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
}

describe("greeting localization catalogs", () => {
  it("keeps observance rules aligned with the catalog key list", () => {
    expect(OBSERVANCE_RULES.map((rule) => rule.key).sort()).toEqual([...OBSERVANCE_KEYS].sort());
  });

  it("contains every greeting, fact, and observance key in every catalog", () => {
    for (const file of files) {
      const locale = file.slice(0, -5);
      const data = read(locale);
      for (const key of GREETING_VARIANT_KEYS) expect(data.home.greeting[key], `${locale}: greeting.${key}`).toEqual(expect.any(String));
      for (const key of SUBTITLE_FACT_KEYS) expect(data.home.subtitleFacts[key], `${locale}: subtitleFacts.${key}`).toEqual(expect.any(String));
      for (const key of NEW_YEAR_CARD_KEYS) expect(data.home.newYearCard[key], `${locale}: newYearCard.${key}`).toEqual(expect.any(String));
      for (const key of OBSERVANCE_KEYS) {
        expect(data.home.greeting.occasionLabel[key], `${locale}: occasionLabel.${key}`).toEqual(expect.any(String));
        expect(data.home.greeting.observance[key], `${locale}: observance.${key}`).toEqual(expect.any(String));
        expect(data.home.subtitleObservance[key], `${locale}: subtitleObservance.${key}`).toEqual(expect.any(String));
        expect(data.home.subtitleObservance[`${key}2`], `${locale}: subtitleObservance.${key}2`).toEqual(expect.any(String));
        expect(data.home.subtitleObservance[`${key}3`], `${locale}: subtitleObservance.${key}3`).toEqual(expect.any(String));
      }
    }
  });

  it("keeps interpolation variables consistent with English", () => {
    const english = read("en");
    const paths = [
      ...GREETING_VARIANT_KEYS.map((key) => ["home", "greeting", key] as const),
      ...NEW_YEAR_CARD_KEYS.map((key) => ["home", "newYearCard", key] as const),
      ...OBSERVANCE_KEYS.flatMap((key) => [
        ["home", "greeting", "observance", key] as const,
        ["home", "subtitleObservance", key] as const,
        ["home", "subtitleObservance", `${key}2`] as const,
        ["home", "subtitleObservance", `${key}3`] as const,
      ]),
    ];
    for (const file of files) {
      const locale = file.slice(0, -5);
      const data = read(locale);
      for (const parts of paths) {
        const get = (source: Catalog) => parts.reduce<unknown>((value, part) => typeof value === "object" && value !== null ? (value as Record<string, unknown>)[part] : undefined, source);
        expect(variables(String(get(data))), `${locale}: ${parts.join(".")}`).toEqual(variables(String(get(english))));
      }
    }
  });

  it("does not silently fall back to English for new copy", () => {
    const english = read("en");
    const paths = [
      ...GREETING_VARIANT_KEYS.map((key) => ["home", "greeting", key] as const),
      ...NEW_YEAR_CARD_KEYS.map((key) => ["home", "newYearCard", key] as const),
      ...SUBTITLE_FACT_KEYS.map((key) => ["home", "subtitleFacts", key] as const),
      ...OBSERVANCE_KEYS.flatMap((key) => [
        ["home", "greeting", "observance", key] as const,
        ["home", "greeting", "occasionLabel", key] as const,
        ["home", "subtitleObservance", key] as const,
        ["home", "subtitleObservance", `${key}2`] as const,
        ["home", "subtitleObservance", `${key}3`] as const,
      ]),
    ];
    for (const file of files.filter((name) => name !== "en.json")) {
      const locale = file.slice(0, -5);
      const data = read(locale);
      for (const parts of paths) {
        const get = (source: Catalog) => parts.reduce<unknown>((value, part) => typeof value === "object" && value !== null ? (value as Record<string, unknown>)[part] : undefined, source);
        expect(String(get(data)), `${locale}: ${parts.join(".")}`).not.toBe(String(get(english)));
      }
    }
  });

  it("keeps later greeting variants distinct from the extra pool", () => {
    for (const file of files.filter((name) => name !== "en.json")) {
      const locale = file.slice(0, -5);
      const data = read(locale);
      const extras = [data.home.greeting.extra1, data.home.greeting.extra2, data.home.greeting.extra3].filter((value): value is string => typeof value === "string");
      for (const key of GREETING_DISTINCT_VARIANT_KEYS) {
        const value = String(data.home.greeting[key]);
        expect(extras.includes(value), `${locale}: greeting.${key} recycled extra copy`).toBe(false);
      }
      expect(extras.includes(String(data.home.subtitleFacts.fact5)), `${locale}: subtitleFacts.fact5 recycled extra copy`).toBe(false);
    }
  });

  it("keeps observance subtitles different from the heading", () => {
    for (const file of files) {
      const locale = file.slice(0, -5);
      const data = read(locale);
      for (const key of OBSERVANCE_KEYS) {
        const heading = String(data.home.greeting.observance[key]);
        const slots = [
          String(data.home.subtitleObservance[key]),
          String(data.home.subtitleObservance[`${key}2`]),
          String(data.home.subtitleObservance[`${key}3`]),
        ];
        for (const [index, slot] of slots.entries()) {
          const label = index === 0 ? key : `${key}${index + 1}`;
          expect(slot, `${locale}: subtitleObservance.${label}`).not.toBe(heading);
        }
        expect(new Set(slots).size, `${locale}: subtitleObservance.${key} slots must be unique`).toBe(3);
      }
    }
  });
});
