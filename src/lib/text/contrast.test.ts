import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, relativeLuminance, wcagLevel } from "./contrast";

describe("WCAG contrast helpers", () => {
  it("parses short and long hex colors", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHex("#336699")).toEqual({ r: 51, g: 102, b: 153 });
    expect(() => parseHex("#gg0000")).toThrow(RangeError);
  });

  it("computes relative luminance and contrast ratio", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1);
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0);
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21);
  });

  it("maps ratios to normal-text WCAG levels", () => {
    expect(wcagLevel(21)).toBe("AAA");
    expect(wcagLevel(7)).toBe("AAA");
    expect(wcagLevel(4.5)).toBe("AA");
    expect(wcagLevel(4.49)).toBe("fail");
    expect(wcagLevel(3)).toBe("fail");
  });
});
