/** Split text into user-perceived characters (emoji, CJK, combining marks). */
export function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

/**
 * Per-character delay so a short hello still types, and a long observance
 * never runs past `maxDurationMs`.
 */
export function typewriterIntervalMs(count: number, maxDurationMs = 1400, perMs = 26): number {
  if (count <= 1) return 0;
  const duration = Math.min(maxDurationMs, Math.max(380, count * perMs));
  return duration / count;
}
