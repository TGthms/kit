import { describe, expect, it } from "vitest";
import { overlayGreetingDate, parseGreetingDate, parseGreetingSeed } from "./greeting-qa";

describe("greeting QA params", () => {
  it("accepts a real calendar day and rejects impossible dates", () => {
    expect(parseGreetingDate("2026-12-25")).toEqual({ year: 2026, month: 12, day: 25 });
    expect(parseGreetingDate("2026-02-29")).toBeNull();
    expect(parseGreetingDate("2026-13-01")).toBeNull();
    expect(parseGreetingDate("tomorrow")).toBeNull();
    expect(parseGreetingDate("")).toBeNull();
    expect(parseGreetingDate(null)).toBeNull();
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
});
