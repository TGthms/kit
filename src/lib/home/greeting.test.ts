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
    expect(pool).toEqual([...GREETING_PERIOD_KEYS.morning, "kit", "kit2", "kit3", "productivity", "productivity2", "productivity3", "privacy", "privacy2", "privacy3"]);
    expect(pool).toContain("morning8");
    expect(pool).toContain("morning15");
    expect(pool).not.toContain("weekend");
    expect(pool).not.toContain("monday");
  });

  it("adds weekend lines to the pool on Saturday and Sunday", () => {
    const saturday = new Date(2026, 7, 29, 10);
    const pool = getGreetingPoolKeys(saturday);
    expect(pool).toContain("weekend");
    expect(pool).toContain("weekend2");
    expect(pool).toContain("weekend3");
    const weekendIndex = pool.indexOf("weekend");
    expect(getHomeGreetingSelection(saturday, "en-US", weekendIndex)).toMatchObject({
      greetingKey: "greeting.weekend",
      category: "weekend",
    });
  });

  it("selects Christian and technology observances by calendar date", () => {
    const christmas = getHomeGreetingSelection(new Date(2026, 11, 25, 10), "en-US", 1);
    expect(christmas).toMatchObject({
      greetingKey: "greeting.observance.christmas",
      occasionKey: "christmas",
      category: "kit",
      motion: "fade",
    });
    expect(christmas.subtitle.kind).toBe("i18n");
    expect(christmas.subtitle.kind === "i18n" && christmas.subtitle.key).toMatch(/^subtitleObservance\.christmas[23]?$/);
    expect(getHomeGreetingSelection(new Date(2026, 2, 14, 10), "en-US", 1).occasionKey).toBe("piDay");
    expect(getHomeGreetingSelection(new Date(2026, 1, 10, 10), "en-US", 1).occasionKey).toBe("saferInternetDay");
    expect(getHomeGreetingSelection(new Date(2026, 4, 7, 10), "en-US", 1).occasionKey).toBe("passwordDay");
    expect(getHomeGreetingSelection(new Date(2026, 9, 13, 10), "en-US", 1).occasionKey).toBe("adaLovelaceDay");
    expect(getHomeGreetingSelection(new Date(2026, 8, 13, 10), "en-US", 1).occasionKey).toBe("programmersDay");
    expect(getHomeGreetingSelection(new Date(2026, 0, 28, 10), "en-US", 1).occasionKey).toBe("dataPrivacyDay");
    expect(getHomeGreetingSelection(new Date(2026, 6, 17, 10), "en-US", 1).occasionKey).toBe("emojiDay");
    expect(getHomeGreetingSelection(new Date(2026, 8, 19, 10), "en-US", 1).occasionKey).toBe("softwareFreedomDay");
    expect(getHomeGreetingSelection(new Date(2026, 9, 21, 10), "en-US", 1).occasionKey).toBe("encryptionDay");
    expect(getHomeGreetingSelection(new Date(2026, 9, 29, 10), "en-US", 1).occasionKey).toBe("internetDay");
    expect(getHomeGreetingSelection(new Date(2026, 10, 5, 10), "en-US", 1).occasionKey).toBe("digitalPreservationDay");
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
    const morningKeys = new Set(["productivity", "productivity2", "productivity3", "kit", "kit2", "kit3", "privacy", "privacy2", "privacy3", ...GREETING_PERIOD_KEYS.morning].map((key) => `greeting.${key}`));
    expect(morningKeys.has(selection.greetingKey)).toBe(true);
    expect(selection.subtitle.kind).toBe("i18n");
    expect(selection.subtitle.kind === "i18n" && selection.subtitle.key).toMatch(
      /^subtitle(?:Facts\.(?:fact[1-8]|kit[1-8]|prod[1-6]|morning[1-3]|afternoon[1-3]|evening[1-3]|night[1-3]))?$/,
    );
    expect(selection.day).toBe("mardi");
  });

  it("stays stable inside a greeting period and changes at the period boundary", () => {
    expect(getGreetingVariant(new Date(2026, 7, 25, 10), 32, 42)).toBe(getGreetingVariant(new Date(2026, 7, 25, 11), 32, 42));
    expect(getGreetingVariant(new Date(2026, 7, 25, 16), 32, 42)).not.toBe(getGreetingVariant(new Date(2026, 7, 25, 17), 32, 42));
    expect(getGreetingVariant(new Date(2026, 7, 25, 10), 32, 42)).not.toBe(getGreetingVariant(new Date(2026, 7, 25, 10), 32, 43));
    expect(getGreetingVisitSeed()).toBe(0);
  });

  it("can skip an observance so the New Year card owns that moment", () => {
    const newYears = new Date(2027, 0, 1, 10);
    expect(getHomeGreetingSelection(newYears, "en", 1).occasionKey).toBe("newYear");
    expect(getHomeGreetingSelection(newYears, "en", 1, { skipOccasionKeys: ["newYear"] }).occasionKey).toBeUndefined();
  });

  it("gives every Christian observance its own translation key", () => {
    const dates = [
      [2026, 3, 29, "palmSunday"], [2026, 4, 5, "easterSunday"], [2026, 4, 6, "easterMonday"],
    ] as const;
    for (const [year, month, day, key] of dates) {
      const selection = getHomeGreetingSelection(new Date(year, month - 1, day), "en-US", 0);
      expect(selection.greetingKey).toBe(`greeting.observance.${key}`);
      expect(selection.occasionKey).toBe(key);
      expect(selection.subtitle.kind).toBe("i18n");
      expect(selection.subtitle.kind === "i18n" && selection.subtitle.key).toMatch(new RegExp(`^subtitleObservance\\.${key}[23]?$`));
    }
  });

  it("always uses the WEB verse as the Good Friday subtitle", () => {
    const goodFriday = new Date(2026, 3, 3, 10);
    expect(getHomeGreetingSelection(goodFriday, "en-US", 0)).toMatchObject({
      greetingKey: "greeting.observance.goodFriday",
      subtitle: { kind: "verse", id: GOOD_FRIDAY_VERSE_ID },
      motion: "fadeSlow",
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
    expect(productivity.motion).toBe("fade");
    expect(PRODUCTIVITY_SUBTITLE_KEYS).toContain(productivity.subtitle.kind === "i18n" ? productivity.subtitle.key : "");
  });

  it("adds Monday morning and Friday afternoon flavor lines", () => {
    const mondayMorning = new Date(2026, 7, 24, 10);
    const fridayAfternoon = new Date(2026, 7, 28, 15);
    expect(mondayMorning.getDay()).toBe(1);
    expect(fridayAfternoon.getDay()).toBe(5);
    expect(getGreetingPoolKeys(mondayMorning)).toContain("monday");
    expect(getGreetingPoolKeys(fridayAfternoon)).toContain("friday");
    expect(getGreetingPoolKeys(new Date(2026, 7, 28, 23))).toContain("friday");
    expect(getGreetingPoolKeys(new Date(2026, 7, 24, 20))).not.toContain("monday");
  });

  it("picks opacity-only motion from time of day and solemn observances", () => {
    expect(getHomeGreetingSelection(new Date(2026, 7, 25, 10), "en", 0).motion).toBe("fade");
    expect(getHomeGreetingSelection(new Date(2026, 7, 25, 20), "en", 0).motion).toBe("fadeSlow");
    expect(getHomeGreetingSelection(new Date(2026, 2, 14, 10), "en", 0).motion).toBe("fade");
    expect(getHomeGreetingSelection(new Date(2026, 2, 29, 10), "en", 0).motion).toBe("fadeSlow");
  });
});
