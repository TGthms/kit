/** Shared search over the *current locale's* catalog. No queries leave the device. */
export type SearchDocument<T> = {
  item: T;
  id: string;
  name: string;
  keywords: string;
  description: string;
  category: string;
};

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

const intents: Record<string, string[]> = {
  "pdf-compress": ["make pdf smaller", "reduce pdf size", "shrink pdf"],
  "image-compress": ["make image smaller", "reduce photo size", "shrink image"],
  "images-to-pdf": ["photos to pdf", "pictures to pdf"],
  "pdf-merge": ["combine pdf", "join pdf"],
  "function-grapher": ["plot function", "draw graph"],
};

/** One edit or adjacent transposition. Only longer words get typo matching. */
function near(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1)
    return false;
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  if (a.length === b.length)
    return (
      a.slice(i + 1) === b.slice(i + 1) ||
      (a[i] === b[i + 1] &&
        a[i + 1] === b[i] &&
        a.slice(i + 2) === b.slice(i + 2))
    );
  return a.length > b.length
    ? a.slice(i + 1) === b.slice(i)
    : a.slice(i) === b.slice(i + 1);
}

export function searchTools<T>(
  documents: readonly SearchDocument<T>[],
  input: string,
): T[] {
  const query = normalizeSearch(input.slice(0, 128));
  if (!query) return [];
  const tokens = query.split(" ").slice(0, 12);
  return documents
    .map((doc, index) => {
      const name = normalizeSearch(doc.name);
      const id = normalizeSearch(doc.id);
      const keywords = normalizeSearch(doc.keywords);
      const description = normalizeSearch(doc.description);
      const category = normalizeSearch(doc.category);
      const aliases = intents[doc.id] ?? [];
      const fields = [name, id, keywords, category, description, ...aliases];
      const words = `${name} ${id} ${keywords}`.split(" ");
      const exact = name === query || id === query;
      const phrase = aliases.includes(query);
      // Every word must contribute. Catalog order is the tie breaker, never usage
      // telemetry, so typing does not cause personalized or random reshuffling.
      let score = exact
        ? 10000
        : phrase
          ? 9000
          : name.startsWith(query)
            ? 5000
            : name.includes(query)
              ? 3000
              : 0;
      for (const token of tokens) {
        const field = fields.findIndex((value) => value.includes(token));
        if (field >= 0) score += [100, 80, 60, 40, 20][field] ?? 10;
        else if (words.some((word) => near(token, word))) score += 2;
        else return { item: doc.item, score: -1, index };
      }
      return { item: doc.item, score, index };
    })
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}
