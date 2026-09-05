import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CITIES, cityTimeZones } from "./cities";

const messages = join(dirname(fileURLToPath(import.meta.url)), "../../../messages");

describe("world clock city catalog", () => {
  it("keeps a curated city list on valid IANA zones", () => {
    expect(CITIES.length).toBeGreaterThan(8);
    expect(new Set(CITIES.map((city) => city.key)).size).toBe(CITIES.length);
    expect(CITIES.some((city) => city.name === "Hong Kong, China")).toBe(true);
    for (const city of CITIES) {
      expect(new Intl.DateTimeFormat("en", { timeZone: city.zone }).resolvedOptions().timeZone).toBeTruthy();
    }
  });

  it("includes UTC and does not duplicate city zones", () => {
    const zones = cityTimeZones();
    expect(zones[0]).toBe(CITIES[0]?.zone);
    expect(zones).toContain("UTC");
    expect(new Set(zones).size).toBe(zones.length);
  });

  it("localizes city names in catalogs that do not use English exonyms", () => {
    const zh = JSON.parse(readFileSync(join(messages, "zh-Hans.json"), "utf8")) as {
      tools: { "timezone-converter": Record<string, string> };
    };
    const ja = JSON.parse(readFileSync(join(messages, "ja.json"), "utf8")) as {
      tools: { "timezone-converter": Record<string, string> };
    };
    const cities = zh.tools["timezone-converter"];
    expect(cities.cityBeijing).toBe("北京");
    expect(cities.cityHongKongChina).toBe("中国香港");
    expect(cities.citySanFrancisco).toBe("旧金山");
    expect(ja.tools["timezone-converter"].cityTokyo).toBe("東京");
    expect(ja.tools["timezone-converter"].cityNewYork).toBe("ニューヨーク");
  });
});
