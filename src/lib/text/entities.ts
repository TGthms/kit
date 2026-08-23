function validCodePoint(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff);
}

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};

export function encodeHtmlEntities(input: string, named = true): string {
  return [...input]
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (named) {
        if (ch === "&") return "&amp;";
        if (ch === "<") return "&lt;";
        if (ch === ">") return "&gt;";
        if (ch === '"') return "&quot;";
        if (ch === "'") return "&#39;";
      }
      if (code < 32 || code > 126) return `&#${code};`;
      return ch;
    })
    .join("");
}

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (full, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const n = parseInt(body.slice(2), 16);
      return validCodePoint(n) ? String.fromCodePoint(n) : full;
    }
    if (body.startsWith("#")) {
      const n = parseInt(body.slice(1), 10);
      return validCodePoint(n) ? String.fromCodePoint(n) : full;
    }
    return NAMED[body.toLowerCase()] ?? full;
  });
}
