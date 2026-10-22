import { describe, expect, it } from "vitest";
import { convertBase, parseBaseInt, formatBaseInt, MAX_BASE_DIGITS } from "./base";

describe("base conversion input guards", () => {
  it.each([2.5, NaN, Infinity, 0, 37])("returns an error for base %s without throwing in render", (base) => {
    expect(convertBase("10", base, 16).ok).toBe(false);
    expect(convertBase("10", 10, base).ok).toBe(false);
    expect(parseBaseInt("10", base).ok).toBe(false);
    expect(() => formatBaseInt(BigInt(0), base)).toThrow();
  });
  it("round-trips signed prefixed values and rejects incomplete signs", () => {
    expect(convertBase("-0xff", 16, 2)).toEqual({ ok: true, value: "-11111111", decimal: "-255" });
    expect(convertBase("+0o17", 8, 10)).toMatchObject({ ok: true, value: "15" });
    expect(convertBase("-", 10, 16).ok).toBe(false);
    expect(convertBase("-0b", 2, 16).ok).toBe(false);
  });
  it("bounds work on giant pasted integers", () => {
    expect(convertBase("f".repeat(MAX_BASE_DIGITS + 1), 16, 2).ok).toBe(false);
    expect(convertBase("f".repeat(512), 16, 2)).toMatchObject({ ok: true, value: "1".repeat(2048) });
  });
});
