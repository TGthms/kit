import { describe, expect, it } from "vitest";
import { CITIES, cityTimeZones } from "./cities";

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
});
