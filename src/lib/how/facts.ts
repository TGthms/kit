import { GREETING_PERIOD_BOUNDS } from "@/lib/home/greeting";

/**
 * Numbers the How Kit works page quotes, kept in code so copy cannot drift
 * from the repo. The media figure is the gzipped vendored FFmpeg core in
 * `public/vendor/ffmpeg/` (wasm.gz + core.js, measured ≈ 9.9 MB → "about 10").
 */
export const HOW_MEDIA_ENGINE_MB = 10;

/** Greeting hour bounds the page quotes; single source with the greeting code. */
export const HOW_GREETING_BOUNDS = GREETING_PERIOD_BOUNDS;

/**
 * FAQ pairs in render order. The same strings feed the visible <details>
 * list and the FAQPage JSON-LD, so both stay in sync.
 */
export const HOW_FAQ_KEYS = [
  ["faqFreeQ", "faqFreeA"],
  ["faqFilesQ", "faqFilesA"],
  ["faqOfflineQ", "faqOfflineA"],
  ["faqMediaQ", "faqMediaA"],
  ["faqStoredQ", "faqStoredA"],
  ["faqClearQ", "faqClearA"],
  ["faqMobileQ", "faqMobileA"],
] as const;

export type HowFaqKey = (typeof HOW_FAQ_KEYS)[number][number];
