import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Catalog = {
  home: {
    greeting: Record<string, unknown> & { occasionLabel: Record<string, unknown>; observance: Record<string, unknown> };
    subtitleFacts: Record<string, unknown>;
    subtitleObservance: Record<string, unknown>;
  };
};

const messageDir = path.join(process.cwd(), "messages");
const files = fs.readdirSync(messageDir).filter((file) => file.endsWith(".json")).sort();
const observances = ["newYear", "christmasEve", "christmas", "goodFriday", "palmSunday", "easterMonday", "easterSunday", "saferInternetDay", "womenAndGirlsInScience", "piDay", "backupDay", "earthDay", "passwordDay", "webDay", "adaLovelaceDay", "computerSecurityDay", "programmersDay"];
const greetingKeys = ["morning", "morning2", "morning3", "morning4", "morning5", "morning6", "morning7", "morning8", "afternoon", "afternoon2", "afternoon3", "afternoon4", "afternoon5", "afternoon6", "afternoon7", "afternoon8", "evening", "evening2", "evening3", "evening4", "evening5", "evening6", "evening7", "evening8", "night", "night2", "night3", "night4", "night5", "night6", "night7", "night8", "weekend", "productivity", "kit", "privacy"];

function read(locale: string): Catalog {
  return JSON.parse(fs.readFileSync(path.join(messageDir, `${locale}.json`), "utf8"));
}

function variables(value: string): string[] {
  return [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
}

describe("greeting localization catalogs", () => {
  it("contains every greeting, fact, and observance key in every catalog", () => {
    for (const file of files) {
      const locale = file.slice(0, -5);
      const data = read(locale);
      for (const key of greetingKeys) expect(data.home.greeting[key], `${locale}: greeting.${key}`).toEqual(expect.any(String));
      for (const key of ["fact1", "fact2", "fact3", "fact4", "fact5", "fact6"]) expect(data.home.subtitleFacts[key], `${locale}: subtitleFacts.${key}`).toEqual(expect.any(String));
      for (const key of observances) {
        expect(data.home.greeting.occasionLabel[key], `${locale}: occasionLabel.${key}`).toEqual(expect.any(String));
        expect(data.home.greeting.observance[key], `${locale}: observance.${key}`).toEqual(expect.any(String));
        expect(data.home.subtitleObservance[key], `${locale}: subtitleObservance.${key}`).toEqual(expect.any(String));
      }
    }
  });

  it("keeps interpolation variables consistent with English", () => {
    const english = read("en");
    const paths = [
      ...greetingKeys.map((key) => ["home", "greeting", key] as const),
      ...observances.flatMap((key) => [["home", "greeting", "observance", key] as const, ["home", "subtitleObservance", key] as const]),
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
      ...greetingKeys.map((key) => ["home", "greeting", key] as const),
      ...["fact5", "fact6"].map((key) => ["home", "subtitleFacts", key] as const),
      ...observances.flatMap((key) => [["home", "greeting", "observance", key] as const, ["home", "subtitleObservance", key] as const]),
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
});
