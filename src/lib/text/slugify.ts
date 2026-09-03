/** Lowercase slug: NFD-strip diacritics, non [a-z0-9]+ → hyphen, trim hyphens. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const RESERVED_FILENAME = /[\\/:*?"<>|]/g;

/** Strip path separators and reserved filename chars; collapse spaces; fallback "file". */
export function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(RESERVED_FILENAME, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : "file";
}
