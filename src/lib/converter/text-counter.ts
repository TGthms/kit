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
  locale?: string;
};

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

export function measureText(text: string, options: TextMetricsOptions = {}): TextMetrics {
  const wordsPerMinute = options.wordsPerMinute ?? 200;
  if (wordsPerMinute <= 0 || !Number.isFinite(wordsPerMinute)) throw new RangeError("wordsPerMinute must be greater than zero.");
  const characters = graphemes(text, options.locale);
  const wordCount = words(text, options.locale);
  const readingTimeSeconds = wordCount === 0 ? 0 : Math.ceil((wordCount / wordsPerMinute) * 60);
  return {
    words: wordCount,
    characters: characters.length,
    charactersNoSpaces: characters.filter((character) => !/^\s+$/u.test(character)).length,
    sentences: sentences(text, options.locale),
    paragraphs: paragraphs(text),
    readingTimeMinutes: wordCount / wordsPerMinute,
    readingTimeSeconds,
  };
}
