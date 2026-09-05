// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { getHomeGreetingSelection } from "./greeting";
import {
  greetingSearchFromLocation,
  overlayGreetingDate,
  parseEmbeddedGreetingTime,
  parseGreetingDate,
  parseGreetingSeed,
  parseGreetingTime,
  readGreetingPreview,
  virtualGreetingNow,
} from "./greeting-qa";

describe("greeting QA params", () => {
  it("accepts a real calendar day and rejects impossible dates", () => {
    expect(parseGreetingDate("2026-12-25")).toEqual({ year: 2026, month: 12, day: 25 });
    expect(parseGreetingDate("2026-12-25T23:59:03")).toEqual({ year: 2026, month: 12, day: 25 });
    expect(parseGreetingDate("2026-02-29")).toBeNull();
    expect(parseGreetingDate("2026-13-01")).toBeNull();
    expect(parseGreetingDate("tomorrow")).toBeNull();
    expect(parseGreetingDate("")).toBeNull();
    expect(parseGreetingDate(null)).toBeNull();
  });

  it("parses HH:MM and HH:MM:SS and rejects impossible clocks", () => {
    expect(parseGreetingTime("23:59:03")).toEqual({ hours: 23, minutes: 59, seconds: 3 });
    expect(parseGreetingTime("23:59")).toEqual({ hours: 23, minutes: 59, seconds: 0 });
    expect(parseGreetingTime("9:05:00")).toEqual({ hours: 9, minutes: 5, seconds: 0 });
    expect(parseGreetingTime("24:00")).toBeNull();
    expect(parseGreetingTime("23:60")).toBeNull();
    expect(parseGreetingTime("23:59:61")).toBeNull();
    expect(parseGreetingTime("noon")).toBeNull();
    expect(parseGreetingTime("")).toBeNull();
    expect(parseGreetingTime(null)).toBeNull();
  });

  it("parses an integer seed", () => {
    expect(parseGreetingSeed("3")).toBe(3);
    expect(parseGreetingSeed("0")).toBe(0);
    expect(parseGreetingSeed("-2")).toBe(-2);
    expect(parseGreetingSeed("3.5")).toBeNull();
    expect(parseGreetingSeed("nope")).toBeNull();
    expect(parseGreetingSeed(null)).toBeNull();
  });

  it("overlays the calendar day onto the current clock", () => {
    const now = new Date(2026, 8, 3, 21, 15, 30, 4);
    const over = overlayGreetingDate(now, { year: 2026, month: 12, day: 25 });
    expect(over.getFullYear()).toBe(2026);
    expect(over.getMonth()).toBe(11);
    expect(over.getDate()).toBe(25);
    expect(over.getHours()).toBe(21);
    expect(over.getMinutes()).toBe(15);
    expect(overlayGreetingDate(now, null)).toBe(now);
  });

  it("overlays an explicit time when provided", () => {
    const now = new Date(2026, 8, 3, 21, 15, 30, 4);
    const over = overlayGreetingDate(now, { year: 2026, month: 12, day: 31 }, { hours: 23, minutes: 59, seconds: 3 });
    expect(over.getFullYear()).toBe(2026);
    expect(over.getMonth()).toBe(11);
    expect(over.getDate()).toBe(31);
    expect(over.getHours()).toBe(23);
    expect(over.getMinutes()).toBe(59);
    expect(over.getSeconds()).toBe(3);
    expect(over.getMilliseconds()).toBe(0);
  });

  it("advances a time preview from the origin instant", () => {
    const wall = new Date(2026, 6, 4, 8, 0, 0, 0);
    const start = virtualGreetingNow(
      wall,
      { year: 2026, month: 12, day: 31 },
      { hours: 23, minutes: 59, seconds: 3 },
      { wallMs: 1_000, nowMs: 1_000 },
    );
    expect(start.getSeconds()).toBe(3);
    const later = virtualGreetingNow(
      wall,
      { year: 2026, month: 12, day: 31 },
      { hours: 23, minutes: 59, seconds: 3 },
      { wallMs: 1_000, nowMs: 1_000 + 4_000 },
    );
    expect(later.getSeconds()).toBe(7);
    const dateOnly = virtualGreetingNow(wall, { year: 2026, month: 12, day: 31 }, null);
    expect(dateOnly.getHours()).toBe(8);
  });

  it("reads date, greetingDate, and an embedded clock from the query", () => {
    expect(readGreetingPreview(new URLSearchParams("date=2026-12-25"))).toEqual({
      date: { year: 2026, month: 12, day: 25 },
      time: null,
      seed: null,
    });
    expect(readGreetingPreview(new URLSearchParams("greetingDate=2026-03-14&greetingSeed=3"))).toEqual({
      date: { year: 2026, month: 3, day: 14 },
      time: null,
      seed: 3,
    });
    expect(readGreetingPreview(new URLSearchParams("date=&greetingDate=2026-12-25"))).toMatchObject({
      date: { year: 2026, month: 12, day: 25 },
    });
    expect(readGreetingPreview(new URLSearchParams("date=nope&greetingDate=2026-12-25"))).toMatchObject({
      date: { year: 2026, month: 12, day: 25 },
    });
    expect(readGreetingPreview(new URLSearchParams("date=2026-12-25T23:59:03"))).toEqual({
      date: { year: 2026, month: 12, day: 25 },
      time: { hours: 23, minutes: 59, seconds: 3 },
      seed: null,
    });
    expect(parseEmbeddedGreetingTime("2026-12-25T23:59")).toEqual({ hours: 23, minutes: 59, seconds: 0 });
    const christmas = overlayGreetingDate(
      new Date(2026, 8, 4, 15, 0, 0),
      readGreetingPreview(new URLSearchParams("date=2026-12-25")).date,
    );
    expect(getHomeGreetingSelection(christmas, "en", 0).occasionKey).toBe("christmas");
  });

  it("prefers the address-bar query over an empty Next search snapshot", () => {
    window.history.replaceState(null, "", "/en/?date=2026-12-25");
    expect(greetingSearchFromLocation({ toString: () => "" }).get("date")).toBe("2026-12-25");
    window.history.replaceState(null, "", "/");
  });
});
