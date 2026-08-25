import { describe, expect, it } from "vitest";
import { measureText } from "./text-counter";

describe("Unicode-aware text metrics", () => {
  it("counts words, grapheme characters, punctuation, and paragraphs", () => {
    const metrics = measureText("Hello, brave world!\n\nCafé is nice 👩‍💻.", { wordsPerMinute: 2 });
    expect(metrics.words).toBe(6);
    expect(metrics.characters).toBeLessThan("Hello, brave world!\n\nCafé is nice 👩‍💻.".length);
    expect(metrics.charactersNoSpaces).toBeLessThanOrEqual(metrics.characters);
    expect(metrics.sentences).toBe(2);
    expect(metrics.paragraphs).toBe(2);
    expect(metrics.readingTimeSeconds).toBe(180);
    expect(metrics.readingTimeMinutes).toBe(3);
  });

  it("handles CJK segmentation and empty text", () => {
    expect(measureText("你好世界。再见！").words).toBe(3);
    expect(measureText("")).toEqual({ words: 0, characters: 0, charactersNoSpaces: 0, sentences: 0, paragraphs: 0, readingTimeMinutes: 0, readingTimeSeconds: 0 });
    expect(() => measureText("text", { wordsPerMinute: 0 })).toThrow(RangeError);
  });
});
