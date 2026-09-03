import { describe, expect, it } from "vitest";
import {
  GREETING_PERIOD_KEYS,
  KIT_SUBTITLE_KEYS,
  PRODUCTIVITY_SUBTITLE_KEYS,
  getGreetingDay,
  getGreetingPeriod,
  getGreetingPoolKeys,
  getGreetingVariant,
  getGreetingVisitSeed,
  getHomeGreetingSelection,
  localeAllowsChristianGreeting,
} from "./greeting";
import { GOOD_FRIDAY_VERSE_ID } from "./verses";

describe("home greeting", () => {
  it("selects a friendly time-of-day period", () => {
    expect(getGreetingPeriod(new Date(2026, 7, 25, 6))).toBe("morning");
    expect(getGreetingPeriod(new Date(2026, 7, 25, 13))).toBe("afternoon");
    expect(getGreetingPeriod(new Date(2026, 7, 25, 19))).toBe("evening");
    expect(getGreetingPeriod(new Date(2026, 7, 25, 23))).toBe("night");
    expect(getGreetingPeriod(new Date(2026, 7, 25, 3))).toBe("night");
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

  it("keeps later period lines in the live pool instead of replacing them", () => {
    const tuesdayMorning = new Date(2026, 7, 25, 10);
    const pool = getGreetingPoolKeys(tuesdayMorning);
    expect(pool).toEqual([...GREETING_PERIOD_KEYS.morning, "kit", "productivity", "privacy"]);
    expect(pool).toContain("morning8");
    expect(pool).toContain("morning2");
    expect(pool).not.toContain("weekend");
  });

  it("adds weekend lines to the pool on Saturday and Sunday", () => {
    const saturday = new Date(2026, 7, 29, 10);
    const pool = getGreetingPoolKeys(saturday);
    expect(pool).toContain("weekend");
    expect(pool).toContain("weekend2");
    const weekendIndex = pool.indexOf("weekend");
    expect(getHomeGreetingSelection(saturday, "en-US", weekendIndex)).toMatchObject({
      greetingKey: "greeting.weekend",
      category: "weekend",
    });
  });

  it("selects Christian and technology observances by calendar date", () => {
    expect(getHomeGreetingSelection(new Date(2026, 11, 25, 10), "en-US", 1)).toMatchObject({
      greetingKey: "greeting.observance.christmas",
      subtitle: { kind: "i18n", key: "subtitleObservance.christmas" },
      occasionKey: "christmas",
      category: "kit",
      motion: "scaleSoft",
    });
    expect(getHomeGreetingSelection(new Date(2026, 2, 14, 10), "en-US", 1).occasionKey).toBe("piDay");
    expect(getHomeGreetingSelection(new Date(2026, 1, 10, 10), "en-US", 1).occasionKey).toBe("saferInternetDay");
    expect(getHomeGreetingSelection(new Date(2026, 4, 7, 10), "en-US", 1).occasionKey).toBe("passwordDay");
    expect(getHomeGreetingSelection(new Date(2026, 9, 13, 10), "en-US", 1).occasionKey).toBe("adaLovelaceDay");
    expect(getHomeGreetingSelection(new Date(2026, 8, 13, 10), "en-US", 1).occasionKey).toBe("programmersDay");
  });

  it("shows Christian holidays in Chinese and skips them for ar, he, and hi", () => {
    const christmas = new Date(2026, 11, 25, 10);
    const easter = new Date(2026, 3, 5, 10);
    expect(localeAllowsChristianGreeting("zh-Hans")).toBe(true);
    expect(localeAllowsChristianGreeting("zh-Hant")).toBe(true);
    expect(localeAllowsChristianGreeting("zh")).toBe(true);
    expect(localeAllowsChristianGreeting("en")).toBe(true);
    expect(localeAllowsChristianGreeting("ar")).toBe(false);
    expect(localeAllowsChristianGreeting("he")).toBe(false);
    expect(localeAllowsChristianGreeting("hi")).toBe(false);
    expect(getHomeGreetingSelection(christmas, "zh-Hans", 1).occasionKey).toBe("christmas");
    expect(getHomeGreetingSelection(christmas, "zh-Hant", 1).occasionKey).toBe("christmas");
    expect(getHomeGreetingSelection(christmas, "zh", 1).occasionKey).toBe("christmas");
    expect(getHomeGreetingSelection(christmas, "ar", 1).occasionKey).toBeUndefined();
    expect(getHomeGreetingSelection(christmas, "he", 1).occasionKey).toBeUndefined();
    expect(getHomeGreetingSelection(christmas, "hi", 1).occasionKey).toBeUndefined();
    expect(getHomeGreetingSelection(easter, "en", 0).occasionKey).toBe("easterSunday");
    expect(getHomeGreetingSelection(easter, "he", 0).occasionKey).toBeUndefined();
    expect(getHomeGreetingSelection(new Date(2026, 2, 14, 10), "ar", 1).occasionKey).toBe("piDay");
  });

  it("keeps ordinary selections localized by key and includes the weekday", () => {
    const selection = getHomeGreetingSelection(new Date(2026, 7, 25, 10), "fr-FR", 2);
    const morningKeys = new Set(["productivity", "kit", "privacy", ...GREETING_PERIOD_KEYS.morning].map((key) => `greeting.${key}`));
    expect(morningKeys.has(selection.greetingKey)).toBe(true);
    expect(selection.subtitle).toEqual({ kind: "i18n", key: expect.stringMatching(/^subtitle(Facts\.fact[1-8])?$/) });
    expect(selection.day).toBe("mardi");
  });

  it("stays stable inside a six-hour slot", () => {
    expect(getGreetingVariant(new Date(2026, 7, 25, 10), 32, 42)).toBe(getGreetingVariant(new Date(2026, 7, 25, 11), 32, 42));
    expect(getGreetingVariant(new Date(2026, 7, 25, 10), 32, 42)).not.toBe(getGreetingVariant(new Date(2026, 7, 25, 10), 32, 43));
    expect(getGreetingVisitSeed()).toBe(0);
  });

  it("gives every Christian observance its own translation key", () => {
    const dates = [
      [2026, 3, 29, "palmSunday"], [2026, 4, 5, "easterSunday"], [2026, 4, 6, "easterMonday"],
    ] as const;
    for (const [year, month, day, key] of dates) {
      const selection = getHomeGreetingSelection(new Date(year, month - 1, day), "en-US", 0);
      expect(selection).toMatchObject({
        greetingKey: `greeting.observance.${key}`,
        subtitle: { kind: "i18n", key: `subtitleObservance.${key}` },
        occasionKey: key,
      });
    }
  });

  it("always uses the WEB verse as the Good Friday subtitle", () => {
    const goodFriday = new Date(2026, 3, 3, 10);
    expect(getHomeGreetingSelection(goodFriday, "en-US", 0)).toMatchObject({
      greetingKey: "greeting.observance.goodFriday",
      subtitle: { kind: "verse", id: GOOD_FRIDAY_VERSE_ID },
      motion: "fade",
      occasionKey: "goodFriday",
    });
    expect(getHomeGreetingSelection(goodFriday, "zh-Hans", 2).subtitle).toEqual({ kind: "verse", id: "john1930" });
    expect(getHomeGreetingSelection(goodFriday, "ar", 0).occasionKey).toBeUndefined();
    expect(getHomeGreetingSelection(goodFriday, "he", 0).subtitle.kind).not.toBe("verse");
  });

  it("pairs kit, privacy, and productivity greetings with connected subtitle pools", () => {
    const tuesdayMorning = new Date(2026, 7, 25, 10);
    const pool = getGreetingPoolKeys(tuesdayMorning);
    const kit = getHomeGreetingSelection(tuesdayMorning, "en", pool.indexOf("kit"));
    const privacy = getHomeGreetingSelection(tuesdayMorning, "en", pool.indexOf("privacy"));
    const productivity = getHomeGreetingSelection(tuesdayMorning, "en", pool.indexOf("productivity"));
    expect(kit.greetingKey).toBe("greeting.kit");
    expect(kit.subtitle.kind).toBe("i18n");
    expect(KIT_SUBTITLE_KEYS).toContain(kit.subtitle.kind === "i18n" ? kit.subtitle.key : "");
    expect(privacy.motion).toBe("fade");
    expect(KIT_SUBTITLE_KEYS).toContain(privacy.subtitle.kind === "i18n" ? privacy.subtitle.key : "");
    expect(productivity.greetingKey).toBe("greeting.productivity");
    expect(productivity.motion).toBe("rise");
    expect(PRODUCTIVITY_SUBTITLE_KEYS).toContain(productivity.subtitle.kind === "i18n" ? productivity.subtitle.key : "");
  });

  it("picks calm motion from time of day and festive observances", () => {
    expect(getHomeGreetingSelection(new Date(2026, 7, 25, 10), "en", 0).motion).toBe("rise");
    expect(getHomeGreetingSelection(new Date(2026, 7, 25, 20), "en", 0).motion).toBe("fadeSlow");
    expect(getHomeGreetingSelection(new Date(2026, 2, 14, 10), "en", 0).motion).toBe("scaleSoft");
    expect(getHomeGreetingSelection(new Date(2026, 2, 29, 10), "en", 0).motion).toBe("fade");
  });
});
