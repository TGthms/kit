import { describe, expect, it } from "vitest";
import { applyPercentChange, changePercent, percentOf, whatPercent } from "./percentage";

describe("percentage helpers", () => {
  it("computes percent-of and what-percent", () => {
    expect(percentOf(20, 50)).toBe(10);
    expect(percentOf(12.5, 200)).toBe(25);
    expect(whatPercent(10, 50)).toBe(20);
    expect(whatPercent(25, 200)).toBe(12.5);
  });

  it("computes and applies percent change", () => {
    expect(changePercent(50, 60)).toBe(20);
    expect(changePercent(100, 80)).toBe(-20);
    expect(applyPercentChange(50, 10)).toBeCloseTo(55);
    expect(applyPercentChange(200, -25)).toBe(150);
  });

  it("guards non-finite values and division by zero", () => {
    expect(() => percentOf(Number.NaN, 1)).toThrow(RangeError);
    expect(() => whatPercent(1, 0)).toThrow(RangeError);
    expect(() => changePercent(0, 10)).toThrow(RangeError);
    expect(() => applyPercentChange(1, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
