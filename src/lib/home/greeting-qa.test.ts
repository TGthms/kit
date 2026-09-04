import { describe, expect, it } from "vitest";
import {
  overlayGreetingDate,
  parseGreetingDate,
  parseGreetingSeed,
  parseGreetingTime,
  virtualGreetingNow,
} from "./greeting-qa";

describe("greeting QA params", () => {
  it("accepts a real calendar day and rejects impossible dates", () => {
    expect(parseGreetingDate("2026-12-25")).toEqual({ year: 2026, month: 12, day: 25 });
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
});
