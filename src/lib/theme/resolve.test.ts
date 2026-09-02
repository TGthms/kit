// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { getGreetingPeriod } from "@/lib/home/greeting";
import {
  THEME_CONTEXT_KEY,
  THEME_STORAGE_KEY,
  isNightHour,
  msUntilNextNightBoundary,
  nextThemesValue,
  rememberThemeChoice,
  resolveKitTheme,
  seedThemeContextIfMissing,
  shouldForceDark,
  syncAppliedTheme,
} from "./resolve";

const day = new Date(2026, 8, 1, 10, 0, 0, 0);
const dusk = new Date(2026, 8, 1, 21, 59, 0, 0);
const night = new Date(2026, 8, 1, 23, 0, 0, 0);
const lateNight = new Date(2026, 8, 2, 3, 30, 0, 0);
const justBeforeDawn = new Date(2026, 8, 2, 4, 59, 0, 0);
const dawn = new Date(2026, 8, 2, 5, 0, 0, 0);

describe("isNightHour", () => {
  it("matches the home-greeting night window (22:00–04:59)", () => {
    expect(isNightHour(dusk)).toBe(false);
    expect(isNightHour(new Date(2026, 8, 1, 22, 0, 0, 0))).toBe(true);
    expect(isNightHour(night)).toBe(true);
    expect(isNightHour(lateNight)).toBe(true);
    expect(isNightHour(justBeforeDawn)).toBe(true);
    expect(isNightHour(dawn)).toBe(false);
    expect(isNightHour(day)).toBe(false);
  });

  it("stays aligned with the home greeting's night period", () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const date = new Date(2026, 8, 1, hour, 0, 0, 0);
      expect(isNightHour(date)).toBe(getGreetingPeriod(date) === "night");
    }
  });
});

describe("shouldForceDark", () => {
  it("forces when the OS is dark, even during the day", () => {
    expect(shouldForceDark("dark", day)).toBe(true);
    expect(shouldForceDark("light", day)).toBe(false);
  });

  it("forces at night even when the OS is still light", () => {
    expect(shouldForceDark("light", night)).toBe(true);
    expect(shouldForceDark("dark", night)).toBe(true);
  });
});

describe("resolveKitTheme", () => {
  it("follows system light by default during the day, and honors light or dark", () => {
    expect(resolveKitTheme("system", "light", day)).toBe("light");
    expect(resolveKitTheme("light", "light", day)).toBe("light");
    expect(resolveKitTheme("dark", "light", day)).toBe("dark");
  });

  it("follows system dark by default, keeps dark, and forces a light choice to dark", () => {
    expect(resolveKitTheme("system", "dark", day)).toBe("dark");
    expect(resolveKitTheme("dark", "dark", day)).toBe("dark");
    expect(resolveKitTheme("light", "dark", day)).toBe("dark");
  });

  it("forces dark at night even if the OS is light, including an explicit light choice", () => {
    expect(resolveKitTheme("system", "light", night)).toBe("dark");
    expect(resolveKitTheme("light", "light", night)).toBe("dark");
    expect(resolveKitTheme("dark", "light", night)).toBe("dark");
  });
});

describe("nextThemesValue", () => {
  it("keeps system while the OS is dark so a later daytime OS-light switch still follows", () => {
    expect(nextThemesValue("system", "dark", day)).toBe("system");
  });

  it("writes dark at night when the OS is still light, including over a light choice", () => {
    expect(nextThemesValue("system", "light", night)).toBe("dark");
    expect(nextThemesValue("light", "light", night)).toBe("dark");
  });

  it("leaves a daytime light choice as light", () => {
    expect(nextThemesValue("light", "light", day)).toBe("light");
    expect(nextThemesValue("system", "light", day)).toBe("system");
    expect(nextThemesValue("dark", "light", day)).toBe("dark");
  });
});

describe("msUntilNextNightBoundary", () => {
  it("aims at 22:00 during the day and 05:00 during the night", () => {
    const fromDay = new Date(2026, 8, 1, 10, 0, 0, 0);
    const dayHit = new Date(fromDay.getTime() + msUntilNextNightBoundary(fromDay));
    expect(dayHit.getHours()).toBe(22);
    expect(dayHit.getMinutes()).toBe(0);

    const fromNight = new Date(2026, 8, 1, 23, 0, 0, 0);
    const nightHit = new Date(fromNight.getTime() + msUntilNextNightBoundary(fromNight));
    expect(nightHit.getDate()).toBe(2);
    expect(nightHit.getHours()).toBe(5);

    const fromPredawn = new Date(2026, 8, 2, 4, 0, 0, 0);
    const dawnHit = new Date(fromPredawn.getTime() + msUntilNextNightBoundary(fromPredawn));
    expect(dawnHit.getDate()).toBe(2);
    expect(dawnHit.getHours()).toBe(5);
  });
});

describe("theme context persistence", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("seeds missing context from the stored next-themes value once", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(seedThemeContextIfMissing("light")).toBe("light");
    expect(JSON.parse(window.localStorage.getItem(THEME_CONTEXT_KEY) ?? "null")).toMatchObject({
      choice: "light",
      system: "light",
    });
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(seedThemeContextIfMissing("dark")).toBe("light");
  });

  it("keeps a light intent while applying dark at night, then restores light in the morning", () => {
    const applied: string[] = [];
    const setTheme = (theme: string) => {
      applied.push(theme);
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    };

    rememberThemeChoice("light", setTheme, day, "light");
    expect(applied.at(-1)).toBe("light");
    expect(JSON.parse(window.localStorage.getItem(THEME_CONTEXT_KEY) ?? "null").choice).toBe("light");

    syncAppliedTheme(setTheme, night, "light");
    expect(applied.at(-1)).toBe("dark");
    expect(JSON.parse(window.localStorage.getItem(THEME_CONTEXT_KEY) ?? "null").choice).toBe("light");

    syncAppliedTheme(setTheme, dawn, "light");
    expect(applied.at(-1)).toBe("light");
  });

  it("does not treat a default user as having chosen dark after a night force", () => {
    const applied: string[] = [];
    const setTheme = (theme: string) => {
      applied.push(theme);
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    };

    syncAppliedTheme(setTheme, night, "light");
    expect(applied.at(-1)).toBe("dark");
    expect(JSON.parse(window.localStorage.getItem(THEME_CONTEXT_KEY) ?? "null").choice).toBe("system");

    syncAppliedTheme(setTheme, day, "light");
    expect(applied.at(-1)).toBe("system");
  });
});
