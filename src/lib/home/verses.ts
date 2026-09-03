/**
 * Public-domain scripture for observances that show a verse.
 *
 * World English Bible (WEB) is public domain. Do not substitute NIV/ESV/NASB.
 * Do not put these strings in `messages/*.json` — catalogs must not translate them.
 */
export const WEB_VERSE_IDS = ["john1930"] as const;

export type WebVerseId = (typeof WEB_VERSE_IDS)[number];

export const WEB_VERSES: Record<WebVerseId, { text: string; citation: string }> = {
  john1930: {
    text: 'When Jesus therefore had received the vinegar, he said, "It is finished." He bowed his head, and gave up his spirit.',
    citation: "John 19:30 (WEB)",
  },
};

export const GOOD_FRIDAY_VERSE_ID: WebVerseId = "john1930";
