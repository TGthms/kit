import { describe, expect, it } from "vitest";
import { generateLorem } from "./lorem";

describe("generateLorem", () => {
  it("is deterministic for the same inputs", () => {
    expect(generateLorem(3, "paragraphs")).toBe(generateLorem(3, "paragraphs"));
  });

  it("starts from the canonical lorem ipsum opening", () => {
    expect(generateLorem(5, "words")).toBe("lorem ipsum dolor sit amet");
  });

  it("capitalizes sentences and ends them with periods", () => {
    const text = generateLorem(2, "sentences");
    expect(text.split(". ").every((part) => /^[A-Z]/.test(part))).toBe(true);
    expect(text.endsWith(".")).toBe(true);
  });

  it("joins paragraphs with blank lines", () => {
    expect(generateLorem(3, "paragraphs").split("\n\n")).toHaveLength(3);
  });

  it("clamps count to at least 1", () => {
    expect(generateLorem(0, "words")).toBe("lorem");
    expect(generateLorem(-5, "words")).toBe("lorem");
  });
});
