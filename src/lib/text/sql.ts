const KEYWORDS = new Set(
  [
    "select",
    "from",
    "where",
    "and",
    "or",
    "not",
    "in",
    "is",
    "null",
    "like",
    "between",
    "join",
    "inner",
    "left",
    "right",
    "full",
    "outer",
    "on",
    "group",
    "by",
    "order",
    "having",
    "limit",
    "offset",
    "insert",
    "into",
    "values",
    "update",
    "set",
    "delete",
    "create",
    "table",
    "alter",
    "drop",
    "as",
    "distinct",
    "union",
    "all",
    "case",
    "when",
    "then",
    "else",
    "end",
    "exists",
    "with",
    "asc",
    "desc",
  ].map((k) => k.toUpperCase())
);

const BREAK_BEFORE = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP",
  "ORDER",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "UNION",
  "VALUES",
  "SET",
]);

export function formatSql(input: string): { ok: true; text: string } | { ok: false; error: string } {
  const src = input.trim();
  if (!src) return { ok: false, error: "Empty SQL" };

  const tokens: string[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      let j = i + 1;
      while (j < src.length) {
        // Standard SQL escapes a quote by doubling it (`''`); MySQL-style
        // dialects also allow a backslash escape (`\'`). Recognize both so
        // a string like 'it\'s a test' isn't cut short at the escaped
        // quote, which would corrupt everything tokenized after it.
        if (src[j] === "\\" && j + 1 < src.length) {
          j += 2;
          continue;
        }
        if (src[j] === c && src[j + 1] === c) {
          j += 2;
          continue;
        }
        if (src[j] === c) {
          j++;
          break;
        }
        j++;
      }
      tokens.push(src.slice(i, j));
      i = j;
      continue;
    }
    if (c === "-" && src[i + 1] === "-") {
      const end = src.indexOf("\n", i);
      const comment = src.slice(i, end < 0 ? src.length : end).trimEnd();
      tokens.push(comment);
      i = end < 0 ? src.length : end + 1;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const commentEnd = end < 0 ? src.length : end + 2;
      tokens.push(src.slice(i, commentEnd));
      i = commentEnd;
      continue;
    }
    if (",()".includes(c)) {
      tokens.push(c);
      i++;
      continue;
    }
    let j = i + 1;
    while (j < src.length && !/\s/.test(src[j]) && !"',`()".includes(src[j])) j++;
    tokens.push(src.slice(i, j));
    i = j;
  }

  if (!tokens.length) return { ok: false, error: "Empty SQL" };

  const out: string[] = [];
  let indent = 0;
  let line = "";
  const pushLine = () => {
    if (line.trim()) out.push(line.replace(/\s+$/, ""));
    line = "  ".repeat(Math.max(0, indent));
  };

  for (let t = 0; t < tokens.length; t++) {
    const raw = tokens[t];
    if (raw.startsWith("--") || raw.startsWith("/*")) {
      if (line.trim()) pushLine();
      line += raw;
      pushLine();
      continue;
    }
    const upper = raw.toUpperCase();
    const word = KEYWORDS.has(upper) ? upper : raw;

    if (word === "(") {
      line += (line.trim() ? " " : "") + "(";
      indent++;
      pushLine();
      continue;
    }
    if (word === ")") {
      indent = Math.max(0, indent - 1);
      pushLine();
      line += ")";
      continue;
    }
    if (word === ",") {
      line += ",";
      pushLine();
      continue;
    }
    if (BREAK_BEFORE.has(word) && line.trim()) {
      // JOIN-family clauses get a blank separator line before them so
      // multi-join queries are easier to scan; other clause keywords
      // (SELECT, WHERE, GROUP BY, ...) just start a fresh line.
      if (word === "JOIN" || word === "INNER" || word === "LEFT" || word === "RIGHT" || word === "FULL") {
        pushLine();
        out.push("");
      } else {
        pushLine();
      }
    }
    line += (line.trim() ? " " : "") + word;
  }
  pushLine();
  const text = out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  return { ok: true, text };
}
