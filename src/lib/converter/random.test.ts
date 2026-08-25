import { describe, expect, it } from "vitest";
import { randomBoolean, randomDecimal, randomInteger, randomPassphrase, randomPassword, randomPick, randomUnique } from "./random";

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
});
