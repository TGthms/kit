import { describe, expect, it } from "vitest";
import { convertColor, hslToRgb, hsvToRgb, parseHex, rgbToHex, rgbToHsl, rgbToHsv } from "./color";

describe("parseHex", () => {
  it("accepts 3, 6, and 8 digit forms", () => {
    expect(parseHex("#abc")).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseHex("#aabbcc")).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseHex("AABBCC")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("rejects invalid input", () => {
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex("nope")).toBeNull();
    expect(parseHex("")).toBeNull();
  });
});

describe("conversions", () => {
  it("round-trips rgb → hex", () => {
    expect(rgbToHex({ r: 170, g: 187, b: 204 })).toBe("#aabbcc");
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
  });

  it("knows the primary colors", () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, v: 100 });
    expect(hsvToRgb({ h: 0, s: 100, v: 100 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("keeps grayscale neutral in hsl and hsv", () => {
    for (const rgb of [
      { r: 0, g: 0, b: 0 },
      { r: 128, g: 128, b: 128 },
      { r: 255, g: 255, b: 255 },
    ]) {
      expect(rgbToHsl(rgb).s).toBe(0);
      expect(rgbToHsv(rgb).s).toBe(0);
    }
  });
});

describe("convertColor", () => {
  it("formats every representation for #ff0000", () => {
    expect(convertColor("#ff0000")).toEqual({
      hex: "#ff0000",
      rgb: { r: 255, g: 0, b: 0 },
      hsl: { h: 0, s: 100, l: 50 },
      hsv: { h: 0, s: 100, v: 100 },
      cssRgb: "rgb(255, 0, 0)",
      cssHsl: "hsl(0, 100%, 50%)",
    });
  });

  it("accepts shorthand and returns null for garbage", () => {
    const result = convertColor("abc");
    expect(result?.hex).toBe("#aabbcc");
    expect(result?.hsl.h).toBeCloseTo(210, 5);
    expect(convertColor("zzz")).toBeNull();
  });
});
