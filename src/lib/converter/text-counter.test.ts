import { describe, expect, it } from "vitest";
import {
  DEFAULT_CJK_CHARS_PER_MINUTE,
  DEFAULT_WORDS_PER_MINUTE,
  formatReadingTime,
  measureText,
} from "./text-counter";

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
    expect(() => measureText("text", { cjkCharsPerMinute: 0 })).toThrow(RangeError);
  });

  it("estimates alphabetic reading time at 220 WPM by default", () => {
    const words = Array.from({ length: DEFAULT_WORDS_PER_MINUTE }, () => "word").join(" ");
    const metrics = measureText(words);
    expect(metrics.words).toBe(DEFAULT_WORDS_PER_MINUTE);
    expect(metrics.readingTimeSeconds).toBe(60);
    expect(metrics.readingTimeMinutes).toBe(1);
  });

  it("estimates CJK reading time from characters, not word segments", () => {
    const han = "你".repeat(DEFAULT_CJK_CHARS_PER_MINUTE);
    const metrics = measureText(han);
    expect(metrics.readingTimeSeconds).toBe(60);
  });

  it("adds alphabetic and CJK time for mixed text", () => {
    const metrics = measureText("Hello 你好", { wordsPerMinute: 60, cjkCharsPerMinute: 120 });
    // 1 English word at 60 WPM = 1s; 2 Han chars at 120 CPM = 1s
    expect(metrics.readingTimeSeconds).toBe(2);
  });

  it("never reports zero seconds for non-empty text", () => {
    expect(measureText("Hi").readingTimeSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe("formatReadingTime", () => {
  it("keeps seconds under a minute and remaining seconds after", () => {
    expect(formatReadingTime(0)).toBe("0s");
    expect(formatReadingTime(45)).toBe("45s");
    expect(formatReadingTime(60)).toBe("1m");
    expect(formatReadingTime(75)).toBe("1m 15s");
    expect(formatReadingTime(3600)).toBe("1h");
    expect(formatReadingTime(3725)).toBe("1h 2m");
  });
});
