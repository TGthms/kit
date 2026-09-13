import { describe, expect, it } from "vitest";
import { parseTimestamp, type TimestampParse } from "./timestamp";

/** Narrow to the successful shape so a rejection fails the test with its reason. */
function parseOk(value: string): Extract<TimestampParse, { ok: true }> {
  const parsed = parseTimestamp(value);
  if (!parsed.ok) throw new Error(`expected ${value} to parse, got: ${parsed.error}`);
  return parsed;
}

describe("parseTimestamp", () => {
  it("reads the unit from the number of digits", () => {
    const expected = "2023-11-14T22:13:20.000Z";
    expect(parseOk("1700000000").iso).toBe(expected);
    expect(parseOk("1700000000000").iso).toBe(expected);
    expect(parseOk("1700000000000000").iso).toBe(expected);
    expect(parseOk("1700000000000000000").iso).toBe(expected);
  });

  it("reads a millisecond value from before 2001 as milliseconds", () => {
    /* Seconds and milliseconds overlap below 1e12, so a magnitude test read this
       value as seconds and reported a year in the far future. */
    expect(parseOk("915148800000").iso).toBe("1999-01-01T00:00:00.000Z");
    expect(parseOk("915148800000").unix).toBe(915148800);
  });

  it("accepts date strings and reports what it cannot read", () => {
    expect(parseOk("2020-01-02T03:04:05Z").iso).toBe("2020-01-02T03:04:05.000Z");
    expect(parseTimestamp("").ok).toBe(false);
    expect(parseTimestamp("not a date").ok).toBe(false);
    expect(parseTimestamp("   ").ok).toBe(false);
  });
});
