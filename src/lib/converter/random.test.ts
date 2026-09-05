import { describe, expect, it } from "vitest";
import { randomBoolean, randomDecimal, randomDecimals, randomInteger, randomIntegers, randomPassphrase, randomPassword, randomPick, randomResultSummary, randomUnique } from "./random";

describe("random generation helpers", () => {
  it("supports injectable deterministic integer, decimal, boolean, and pick generation", () => {
    expect(randomInteger(1, 6, () => 0)).toBe(1);
    expect(randomInteger(1, 6, () => 0.999999)).toBe(6);
    expect(randomDecimal(0, 10, { rng: () => 0.25 })).toBe(2.5);
    expect(randomDecimal(0, 1, { precision: 2, rng: () => 0.999 })).toBe(0.99);
    expect(randomBoolean(() => 0.49)).toBe(true);
    expect(randomBoolean(() => 0.5)).toBe(false);
    expect(randomPick(["a", "b"], () => 0)).toBe("a");
  });

  it("returns unique selections without mutating input", () => {
    const input = ["a", "b", "a", "c"];
    const result = randomUnique(input, 2, () => 0);
    expect(new Set(result).size).toBe(2);
    expect(input).toEqual(["a", "b", "a", "c"]);
    expect(() => randomUnique([1, 1], 2)).toThrow(RangeError);
  });

  it("generates passwords and optionally unique passphrases", () => {
    expect(randomPassword({ length: 8, alphabet: "ab", rng: () => 0 })).toBe("aaaaaaaa");
    expect(new Set(randomPassphrase(["red", "blue", "green"], { count: 3, unique: true, rng: () => 0 }).split("-"))).toEqual(new Set(["red", "blue", "green"]));
    expect(() => randomPassword({ length: 0 })).toThrow(RangeError);
    expect(() => randomPick([])).toThrow(RangeError);
  });

  it("generates integer batches with step and uniqueness", () => {
    expect(randomIntegers(1, 3, { count: 4, rng: () => 0 })).toEqual([1, 1, 1, 1]);
    const stepped = randomIntegers(0, 10, { count: 5, step: 2, unique: true, rng: () => 0 });
    expect(new Set(stepped).size).toBe(5);
    expect(stepped.every((n) => n % 2 === 0 && n >= 0 && n <= 10)).toBe(true);
    expect(() => randomIntegers(1, 3, { count: 4, unique: true })).toThrow(RangeError);
    expect(randomDecimals(0, 1, { count: 2, precision: 1, rng: () => 0 })).toEqual([0, 0]);
  });

  it("formats non-password rolls for history without persisting rolled values", () => {
    expect(randomResultSummary("integer", ["42"])).toBe("integer × 1");
    expect(randomResultSummary("integer", ["4", "8", "15"])).toBe("integer × 3");
    expect(randomResultSummary("decimal", ["0.25", "0.5"])).toBe("decimal × 2");
    expect(randomResultSummary("boolean", ["true", "false", "true"])).toBe("boolean × 3");
    expect(randomResultSummary("pick", ["red", "blue"])).toBe("pick × 2");
    expect(randomResultSummary("pick", Array.from({ length: 40 }, (_, index) => `choice-${index}`))).toBe("pick × 40");
  });
});
