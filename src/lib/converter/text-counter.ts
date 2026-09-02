export type TextMetrics = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  readingTimeSeconds: number;
};

export type TextMetricsOptions = {
  wordsPerMinute?: number;
  cjkCharsPerMinute?: number;
  locale?: string;
};

/** On-screen silent reading of alphabetic prose. Brysbaert 2019 is ~238 WPM in print; 220 is closer to phone reading. */
export const DEFAULT_WORDS_PER_MINUTE = 220;

/** Han / Hiragana / Katakana / Hangul characters per minute (mid of published 300–500 CPM ranges). */
export const DEFAULT_CJK_CHARS_PER_MINUTE = 400;

const CJK_CHAR = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF66-\uFF9D\uAC00-\uD7AF]/gu;

function graphemes(text: string, locale?: string): string[] {
  if (typeof Intl.Segmenter === "function") {
    return Array.from(new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

function words(text: string, locale?: string): number {
  if (!text.trim()) return 0;
  if (typeof Intl.Segmenter === "function") {
    return Array.from(new Intl.Segmenter(locale, { granularity: "word" }).segment(text)).filter((part) => part.isWordLike).length;
  }
  return (text.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

function sentences(text: string, locale?: string): number {
  if (!text.trim()) return 0;
  if (typeof Intl.Segmenter === "function") {
    return Array.from(new Intl.Segmenter(locale, { granularity: "sentence" }).segment(text)).filter((part) => part.segment.trim()).length;
  }
  return text.split(/[.!?。！？]+/u).filter((part) => part.trim()).length;
}

function paragraphs(text: string): number {
  return text.split(/(?:\r?\n){2,}/u).filter((part) => part.trim()).length;
}

function countCjkChars(text: string): number {
  return text.match(new RegExp(CJK_CHAR, "gu"))?.length ?? 0;
}

function positiveRate(value: number, label: string): number {
  if (value <= 0 || !Number.isFinite(value)) throw new RangeError(`${label} must be greater than zero.`);
  return value;
}

function readingSeconds(text: string, options: TextMetricsOptions): number {
  if (!text.trim()) return 0;
  const wordsPerMinute = positiveRate(options.wordsPerMinute ?? DEFAULT_WORDS_PER_MINUTE, "wordsPerMinute");
  const cjkCharsPerMinute = positiveRate(options.cjkCharsPerMinute ?? DEFAULT_CJK_CHARS_PER_MINUTE, "cjkCharsPerMinute");
  const cjkChars = countCjkChars(text);
  const alphabeticWords = words(text.replace(new RegExp(CJK_CHAR, "gu"), " "), options.locale);
  const minutes = alphabeticWords / wordsPerMinute + cjkChars / cjkCharsPerMinute;
  return Math.max(1, Math.round(minutes * 60));
}

/** Compact label: `45s`, `1m`, `1m 15s`, `1h 2m`. */
export function formatReadingTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remain = seconds % 60;
  if (hours > 0) {
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }
  if (remain === 0) return `${minutes}m`;
  return `${minutes}m ${remain}s`;
}

export function measureText(text: string, options: TextMetricsOptions = {}): TextMetrics {
  const characters = graphemes(text, options.locale);
  const wordCount = words(text, options.locale);
  const readingTimeSeconds = readingSeconds(text, options);
  return {
    words: wordCount,
    characters: characters.length,
    charactersNoSpaces: characters.filter((character) => !/^\s+$/u.test(character)).length,
    sentences: sentences(text, options.locale),
    paragraphs: paragraphs(text),
    readingTimeMinutes: readingTimeSeconds / 60,
    readingTimeSeconds,
  };
}
