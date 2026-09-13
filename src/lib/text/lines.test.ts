import { describe, expect, it } from "vitest";
import { findReplace, sortLines, uniqueLines } from "./lines";

describe("line text helpers", () => {
  it("finds and replaces with optional case-insensitivity", () => {
    expect(findReplace("foo bar foo", "foo", "x")).toBe("x bar x");
    expect(findReplace("foo bar foo", "foo", "x", { all: false })).toBe("x bar foo");
    expect(findReplace("Foo BAR foo", "foo", "x", { caseInsensitive: true })).toBe("x BAR x");
  });

  it("treats dollar signs in the replacement as text in every mode", () => {
    expect(findReplace("a", "a", "$&")).toBe("$&");
    expect(findReplace("a", "a", "$1")).toBe("$1");
    expect(findReplace("a", "a", "$&", { all: false })).toBe("$&");
    expect(findReplace("A", "a", "$&", { caseInsensitive: true })).toBe("$&");
    expect(findReplace("A", "a", "$&", { caseInsensitive: true, all: false })).toBe("$&");
    expect(findReplace("price 10", "10", "$5")).toBe("price $5");
  });

  it("sorts lines and preserves a trailing newline", () => {
    expect(sortLines("b\na\nc")).toBe("a\nb\nc");
    expect(sortLines("b\na\nc\n")).toBe("a\nb\nc\n");
    expect(sortLines("10\n2\n1", { numeric: true })).toBe("1\n2\n10");
    expect(sortLines("a\nb", { reverse: true })).toBe("b\na");
  });

  it("deduplicates lines", () => {
    expect(uniqueLines("a\nb\na\nc")).toBe("a\nb\nc");
    expect(uniqueLines("b\na\nb\n", { keepOrder: false })).toBe("a\nb\n");
  });
});
