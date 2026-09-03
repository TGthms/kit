import { describe, expect, it } from "vitest";
import { amortizationTotal, compoundAmount, monthlyPayment } from "./loan";

describe("loan and compound helpers", () => {
  it("computes standard amortization payments", () => {
    const payment = monthlyPayment({ principal: 200_000, annualRatePercent: 6, years: 30 });
    expect(payment).toBeCloseTo(1199.1, 1);
    expect(amortizationTotal(payment, 30)).toBeCloseTo(payment * 360, 5);
    expect(monthlyPayment({ principal: 12_000, annualRatePercent: 0, years: 1 })).toBe(1000);
  });

  it("computes compound growth", () => {
    expect(compoundAmount({ principal: 1000, annualRatePercent: 5, years: 1, compoundsPerYear: 1 })).toBeCloseTo(1050);
    expect(compoundAmount({ principal: 1000, annualRatePercent: 6, years: 2, compoundsPerYear: 12 })).toBeCloseTo(1127.16, 1);
  });

  it("rejects invalid inputs", () => {
    expect(() => monthlyPayment({ principal: -1, annualRatePercent: 1, years: 1 })).toThrow(RangeError);
    expect(() => monthlyPayment({ principal: 1, annualRatePercent: 1, years: 0 })).toThrow(RangeError);
    expect(() => amortizationTotal(100, -1)).toThrow(RangeError);
    expect(() => compoundAmount({ principal: 1, annualRatePercent: 1, years: 1, compoundsPerYear: 0 })).toThrow(RangeError);
  });
});
