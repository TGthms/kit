export type RegexMatch = {
  index: number;
  text: string;
  groups: string[];
};

export type RegexResult =
  | { ok: true; matches: RegexMatch[]; flags: string }
  | { ok: false; error: string };

export function runRegex(pattern: string, flags: string, input: string): RegexResult {
  if (!pattern) return { ok: false, error: "Pattern is empty" };
  const cleaned = flags.replace(/[^gimsuy]/g, "");
  const unique = [...new Set(cleaned.split(""))].join("");
  const withG = unique.includes("g") ? unique : unique + "g";
  try {
    const re = new RegExp(pattern, withG);
    const matches: RegexMatch[] = [];
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(input))) {
      matches.push({
        index: m.index,
        text: m[0],
        groups: m.slice(1),
      });
      if (m[0] === "") re.lastIndex++;
      if (++guard > 10_000) break;
    }
    return { ok: true, matches, flags: withG };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function replaceRegex(
  pattern: string,
  flags: string,
  input: string,
  replacement: string
): { ok: true; text: string } | { ok: false; error: string } {
  const ran = runRegex(pattern, flags, input);
  if (!ran.ok) return ran;
  try {
    const re = new RegExp(pattern, ran.flags);
    return { ok: true, text: input.replace(re, replacement) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
