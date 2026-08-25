import { describe, expect, it } from "vitest";
import { calculateTip, roundMoney } from "./tip";

describe("tip and split math", () => {
  it("calculates tax and tip from the pre-tax subtotal", () => {
    const result = calculateTip({ subtotal: 100, tipPercent: 20, taxPercent: 8.25, people: 3 });
    expect(result).toMatchObject({ subtotal: 100, tax: 8.25, tip: 20, total: 128.25, perPerson: 42.75 });
    expect(result.shares).toEqual([42.75, 42.75, 42.75]);
  });

  it("distributes cent remainders while preserving the rounded total", () => {
    const result = calculateTip({ subtotal: 10, tipPercent: 0, people: 3 });
    expect(result.total).toBe(10);
    expect(result.shares).toEqual([3.34, 3.33, 3.33]);
    expect(result.shares.reduce((sum, value) => sum + value, 0)).toBeCloseTo(result.total);
    expect(calculateTip({ subtotal: 10, tipPercent: 0, people: 3, splitRemainder: false }).shares).toEqual([3.33, 3.33, 3.33]);
  });

  it("supports unrounded calculations and validates inputs", () => {
    expect(roundMoney(2.675, 2)).toBe(2.68);
    expect(calculateTip({ subtotal: 10, tipPercent: 12.5, taxPercent: 8, roundTo: null }).total).toBe(12.05);
    expect(() => calculateTip({ subtotal: -1, tipPercent: 10 })).toThrow(RangeError);
    expect(() => calculateTip({ subtotal: 1, tipPercent: 10, people: 0 })).toThrow(RangeError);
  });
});
