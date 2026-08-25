import { describe, expect, it } from "vitest";
import { addBusinessDays, addDate, countBusinessDays, differenceBetweenDates, differenceInCalendarDays, isBusinessDay, subtractDate } from "./date";

describe("date helpers", () => {
  it("calculates elapsed and calendar differences", () => {
    expect(differenceBetweenDates("2024-01-01T00:00:00Z", "2024-01-02T12:00:00Z").hours).toBe(36);
    expect(differenceBetweenDates("2024-01-02", "2024-01-01", true).days).toBe(1);
    expect(differenceInCalendarDays("2024-01-01T12:00:00Z", "2024-01-03T12:00:00Z")).toBe(2);
  });

  it("adds and subtracts calendar units with end-of-month clamping", () => {
    const january31 = new Date(2024, 0, 31, 12);
    expect(addDate(january31, 1, "months").getDate()).toBe(29);
    expect(subtractDate(new Date(2024, 3, 30, 12), 1, "months").getDate()).toBe(30);
    expect(addDate(new Date("2024-01-01T00:00:00Z"), 90, "minutes").toISOString()).toBe("2024-01-01T01:30:00.000Z");
  });

  it("uses explicit business-day interval semantics", () => {
    const friday = new Date(2024, 0, 5);
    const monday = new Date(2024, 0, 8);
    expect(isBusinessDay(friday)).toBe(true);
    expect(isBusinessDay(new Date(2024, 0, 6))).toBe(false);
    expect(countBusinessDays(friday, monday)).toBe(1);
    expect(countBusinessDays(friday, monday, { inclusive: true })).toBe(2);
    expect(countBusinessDays(monday, friday)).toBe(-1);
    expect(countBusinessDays(friday, monday, { inclusive: true, holidays: ["2024-01-08"] })).toBe(1);
    expect(addBusinessDays(friday, 1).getDate()).toBe(8);
    expect(addBusinessDays(monday, -1).getDate()).toBe(5);
  });
});
