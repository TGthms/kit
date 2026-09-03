import { describe, expect, it } from "vitest";
import { sanitizeFilename, slugify } from "./slugify";

describe("slugify and filename sanitization", () => {
  it("slugifies text with diacritics and punctuation", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("Café déjà vu")).toBe("cafe-deja-vu");
    expect(slugify("--AbC  123--")).toBe("abc-123");
    expect(slugify("")).toBe("");
  });

  it("sanitizes filenames and falls back to file", () => {
    expect(sanitizeFilename("report: final?.pdf")).toBe("report final.pdf");
    expect(sanitizeFilename("path/to\\file")).toBe("pathtofile");
    expect(sanitizeFilename('a<>:"|?*b')).toBe("ab");
    expect(sanitizeFilename("   ")).toBe("file");
    expect(sanitizeFilename("::")).toBe("file");
  });
});
