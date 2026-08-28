import { describe, expect, it } from "vitest";
import { getGreetingDay, getGreetingPeriod, getGreetingVariant, getHomeGreetingSelection } from "./greeting";

describe("home greeting", () => {
  it("selects a friendly time-of-day period", () => {
    expect(getGreetingPeriod(new Date(2026, 7, 25, 6))).toBe("morning");
    expect(getGreetingPeriod(new Date(2026, 7, 25, 13))).toBe("afternoon");
    expect(getGreetingPeriod(new Date(2026, 7, 25, 19))).toBe("evening");
    expect(getGreetingPeriod(new Date(2026, 7, 25, 23))).toBe("night");
  });

  it("formats the weekday with the active locale", () => {
    const day = getGreetingDay(new Date(2026, 7, 25), "en-US");
    expect(day).toBe("Tuesday");
  });

  it("changes the selected variant across time slots and stays in range", () => {
    const morning = getGreetingVariant(new Date(2026, 7, 25, 6), 4);
    const afternoon = getGreetingVariant(new Date(2026, 7, 25, 14), 4);
    expect(morning).toBeGreaterThanOrEqual(0);
    expect(morning).toBeLessThan(4);
    expect(afternoon).toBeGreaterThanOrEqual(0);
    expect(afternoon).toBeLessThan(4);
    expect(() => getGreetingVariant(new Date(), 0)).toThrow(RangeError);
  });

  it("selects Christian and technology observances by calendar date", () => {
    expect(getHomeGreetingSelection(new Date(2026, 11, 25, 10), "en-US", 1)).toMatchObject({
      greetingKey: "greeting.observance",
      subtitleKey: "subtitleObservance",
      occasionKey: "christmas",
    });
    expect(getHomeGreetingSelection(new Date(2026, 2, 14, 10), "en-US", 1).occasionKey).toBe("piDay");
    expect(getHomeGreetingSelection(new Date(2026, 1, 10, 10), "en-US", 1).occasionKey).toBe("saferInternetDay");
    expect(getHomeGreetingSelection(new Date(2026, 4, 7, 10), "en-US", 1).occasionKey).toBe("passwordDay");
    expect(getHomeGreetingSelection(new Date(2026, 9, 13, 10), "en-US", 1).occasionKey).toBe("adaLovelaceDay");
    expect(getHomeGreetingSelection(new Date(2026, 8, 13, 10), "en-US", 1).occasionKey).toBe("programmersDay");
  });

  it("keeps ordinary selections localized by key and includes the weekday", () => {
    const selection = getHomeGreetingSelection(new Date(2026, 7, 25, 10), "fr-FR", 2);
    expect(selection.greetingKey).toMatch(/^greeting\.(morning|morning2|morning3)$/);
    expect(selection.subtitleKey).toMatch(/^subtitle(Facts\.fact[1-4])?$/);
    expect(selection.day).toBe("mardi");
  });
});
