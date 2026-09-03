export type FindReplaceOptions = {
  all?: boolean;
  caseInsensitive?: boolean;
};

export type SortLinesOptions = {
  reverse?: boolean;
  numeric?: boolean;
};

export type UniqueLinesOptions = {
  keepOrder?: boolean;
};

function splitPreservingTrailingNewline(text: string): { lines: string[]; trailingNewline: boolean } {
  const trailingNewline = text.endsWith("\n");
  const body = trailingNewline ? text.slice(0, -1) : text;
  return { lines: body.length === 0 && trailingNewline ? [""] : body.split("\n"), trailingNewline };
}

function joinPreservingTrailingNewline(lines: string[], trailingNewline: boolean): string {
  const joined = lines.join("\n");
  return trailingNewline ? `${joined}\n` : joined;
}

export function findReplace(text: string, find: string, replace: string, options: FindReplaceOptions = {}): string {
  const { all = true, caseInsensitive = false } = options;
  if (find.length === 0) return text;
  if (!caseInsensitive) {
    if (!all) return text.replace(find, replace);
    return text.split(find).join(replace);
  }
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flags = all ? "gi" : "i";
  return text.replace(new RegExp(escaped, flags), replace);
}

export function sortLines(text: string, options: SortLinesOptions = {}): string {
  const { reverse = false, numeric = false } = options;
  const { lines, trailingNewline } = splitPreservingTrailingNewline(text);
  const sorted = [...lines].sort((a, b) => {
    if (numeric) {
      const na = Number.parseFloat(a);
      const nb = Number.parseFloat(b);
      const aNum = Number.isFinite(na);
      const bNum = Number.isFinite(nb);
      if (aNum && bNum && na !== nb) return na - nb;
      if (aNum !== bNum) return aNum ? -1 : 1;
    }
    return a < b ? -1 : a > b ? 1 : 0;
  });
  if (reverse) sorted.reverse();
  return joinPreservingTrailingNewline(sorted, trailingNewline);
}

export function uniqueLines(text: string, options: UniqueLinesOptions = {}): string {
  const { keepOrder = true } = options;
  const { lines, trailingNewline } = splitPreservingTrailingNewline(text);
  let unique: string[];
  if (keepOrder) {
    const seen = new Set<string>();
    unique = [];
    for (const line of lines) {
      if (seen.has(line)) continue;
      seen.add(line);
      unique.push(line);
    }
  } else {
    unique = [...new Set(lines)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }
  return joinPreservingTrailingNewline(unique, trailingNewline);
}
