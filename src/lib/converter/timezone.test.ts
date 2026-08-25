import { describe, expect, it } from "vitest";
import { convertLocalTimeZone, convertTimeZone, formatTimeZone, getTimeZoneOffsetMinutes, getTimeZoneParts, isValidTimeZone } from "./timezone";

describe("timezone helpers", () => {
  const instant = new Date("2024-01-15T12:00:00Z");

  it("validates IANA IDs and formats an instant without mutating it", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(getTimeZoneParts(instant, "America/New_York")).toMatchObject({ year: 2024, month: 1, day: 15, hour: 7, minute: 0 });
    expect(formatTimeZone(instant, "America/New_York", { locale: "en-US", dateStyle: "short", timeStyle: "short" })).toContain("1/15/24");
    expect(instant.toISOString()).toBe("2024-01-15T12:00:00.000Z");
  });

  it("reports DST-aware offsets and converts the same instant between zones", () => {
    expect(getTimeZoneOffsetMinutes(new Date("2024-07-01T12:00:00Z"), "America/New_York")).toBe(-240);
    const conversion = convertTimeZone(instant, "America/New_York", "Europe/Berlin");
    expect(conversion.instant.toISOString()).toBe(instant.toISOString());
    expect(conversion.from.hour).toBe(7);
    expect(conversion.to.hour).toBe(13);
  });

  it("converts a local wall-clock time from one IANA zone to another", () => {
    const conversion = convertLocalTimeZone("2024-01-15T12:00:00", "America/New_York", "America/Los_Angeles");
    expect(conversion.from.hour).toBe(12);
    expect(conversion.to.hour).toBe(9);
    expect(conversion.instant.toISOString()).toBe("2024-01-15T17:00:00.000Z");
    expect(() => convertLocalTimeZone("bad", "UTC", "UTC")).toThrow(RangeError);
  });
});
