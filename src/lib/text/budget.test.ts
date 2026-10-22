import { expect, it } from "vitest";
import { MAX_TEXT_LENGTH, parseToolJson } from "./budget";
import { formatJson, formatToml, formatYaml, textDiff } from "./core";

it("rejects huge pasted documents before starting synchronous parsers", () => {
  const input = "x".repeat(MAX_TEXT_LENGTH + 1);
  expect(() => parseToolJson(JSON.stringify(input))).toThrow(RangeError);
  expect(formatJson(input).ok).toBe(false);
  expect(formatToml(input).ok).toBe(false);
  expect(formatYaml(input).ok).toBe(false);
  expect(() => textDiff(input, "")).toThrow(RangeError);
});
it("rejects deeply nested JSON and compares ordinary documents normally", () => {
  expect(() => parseToolJson("[".repeat(150) + "0" + "]".repeat(150))).toThrow(RangeError);
  expect(textDiff("a\nb", "a\nc").some((part) => part.added)).toBe(true);
});
