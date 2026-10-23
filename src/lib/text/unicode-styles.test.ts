import { describe, expect, it } from "vitest";
import {
  plainUnicodeText,
  styleUnicodeText,
  unicodeStyles,
  type UnicodeStyle,
} from "./unicode-styles";
import { findSymbols, symbols } from "./symbols";
describe("Unicode text styles", () => {
  it("maps the legacy letterlike symbols without unassigned holes", () => {
    expect(styleUnicodeText("ChRZ h", "fraktur")).toBe("ℭ𝔥ℜℨ 𝔥");
    expect(styleUnicodeText("BEFHILMRego", "script")).toBe("ℬℰℱℋℐℒℳℛℯℊℴ");
    expect(styleUnicodeText("h", "italic")).toBe("ℎ");
    expect(styleUnicodeText("CHNPQRZ", "doubleStruck")).toBe("ℂℍℕℙℚℝℤ");
  });
  it("preserves emoji, accents, combining marks, non-Latin and newlines", () => {
    expect(styleUnicodeText("é中🙂\ne\u0301", "bold")).toBe("é中🙂\n𝐞\u0301");
  });
  it("can restyle and return every alphabet to plain text", () => {
    const text =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (const style of Object.keys(unicodeStyles) as UnicodeStyle[]) {
      expect([...unicodeStyles[style]]).toHaveLength(62);
      expect(plainUnicodeText(styleUnicodeText(text, style))).toBe(text);
      expect(styleUnicodeText(styleUnicodeText(text, style), "bold")).toBe(
        styleUnicodeText(text, "bold"),
      );
    }
  });
});
describe("symbol catalog", () => {
  it("has unique, valid code points and searchable names", () => {
    expect(new Set(symbols.map((s) => s.code)).size).toBe(symbols.length);
    expect(findSymbols("U+221A")[0].glyph).toBe("√");
    expect(findSymbols("copyright")[0].glyph).toBe("©");
    expect(findSymbols("→")[0].name).toBe("right arrow");
    expect(findSymbols("arrow", "currency")).toEqual([]);
  });
});
