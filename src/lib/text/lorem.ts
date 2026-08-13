const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
];

export type LoremMode = "paragraphs" | "sentences" | "words";

function wordAt(i: number) {
  return WORDS[i % WORDS.length];
}

function sentence(start: number, len: number): string {
  const parts: string[] = [];
  for (let i = 0; i < len; i++) parts.push(wordAt(start + i));
  parts[0] = parts[0][0].toUpperCase() + parts[0].slice(1);
  return parts.join(" ") + ".";
}

export function generateLorem(count: number, mode: LoremMode = "paragraphs"): string {
  const n = Math.max(1, Math.min(200, Math.floor(count) || 1));
  if (mode === "words") {
    return Array.from({ length: n }, (_, i) => wordAt(i)).join(" ");
  }
  if (mode === "sentences") {
    return Array.from({ length: n }, (_, i) => sentence(i * 8, 8 + (i % 5))).join(" ");
  }
  const paras: string[] = [];
  let cursor = 0;
  for (let p = 0; p < n; p++) {
    const sentences: string[] = [];
    const sc = 3 + (p % 3);
    for (let s = 0; s < sc; s++) {
      const len = 7 + ((p + s) % 6);
      sentences.push(sentence(cursor, len));
      cursor += len;
    }
    paras.push(sentences.join(" "));
  }
  return paras.join("\n\n");
}
