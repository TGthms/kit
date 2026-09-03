import { describe, expect, it } from "vitest";
import { overlapWindows } from "./meeting";

describe("meeting overlap windows", () => {
  it("finds UTC hours inside every zone's work window on the given date", () => {
    const overlaps = overlapWindows({
      zones: ["America/New_York", "Europe/London"],
      date: "2024-06-15",
      startHour: 0,
      endHour: 23,
      workStart: 9,
      workEnd: 17,
    });
    expect(overlaps.length).toBeGreaterThan(0);
    for (const slot of overlaps) {
      expect(slot.localHours["America/New_York"]).toBeGreaterThanOrEqual(9);
      expect(slot.localHours["America/New_York"]).toBeLessThan(17);
      expect(slot.localHours["Europe/London"]).toBeGreaterThanOrEqual(9);
      expect(slot.localHours["Europe/London"]).toBeLessThan(17);
      expect(slot.utcIso).toContain("2024-06-15");
    }
  });

  it("returns empty when zones cannot overlap", () => {
    expect(
      overlapWindows({
        zones: ["Pacific/Auckland", "America/Los_Angeles"],
        date: "2024-01-15",
        startHour: 0,
        endHour: 23,
        workStart: 9,
        workEnd: 12,
      }),
    ).toEqual([]);
  });

  it("validates inputs", () => {
    expect(() => overlapWindows({ zones: ["UTC"], date: "15-06-2024", startHour: 0, endHour: 1 })).toThrow(RangeError);
    expect(() => overlapWindows({ zones: ["Not/AZone"], date: "2024-01-01", startHour: 0, endHour: 1 })).toThrow(RangeError);
    expect(() => overlapWindows({ zones: ["UTC"], date: "2024-01-01", startHour: 9, endHour: 17, workStart: 17, workEnd: 9 })).toThrow(RangeError);
  });
});
