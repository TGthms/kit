/** Bound synchronous work on pasted documents before it can monopolize the UI. */
export const MAX_TEXT_LENGTH = 1_000_000;
export const MAX_JSON_NODES = 50_000;
export const MAX_JSON_DEPTH = 100;

export function assertTextBudget(text: string): void {
  if (text.length > MAX_TEXT_LENGTH) throw new RangeError(`Use at most ${MAX_TEXT_LENGTH.toLocaleString("en")} characters.`);
}

export function assertJsonBudget(value: unknown): void {
  const stack = [{ value, depth: 0 }];
  let nodes = 0;
  while (stack.length) {
    const item = stack.pop()!;
    nodes += 1;
    if (nodes > MAX_JSON_NODES || item.depth > MAX_JSON_DEPTH) throw new RangeError("JSON is too large or deeply nested for this tool.");
    if (item.value && typeof item.value === "object") {
      for (const child of Object.values(item.value)) {
        stack.push({ value: child, depth: item.depth + 1 });
        if (stack.length > MAX_JSON_NODES) throw new RangeError("JSON has too many entries for this tool.");
      }
    }
  }
}

export function parseToolJson(text: string): unknown {
  assertTextBudget(text);
  const value: unknown = JSON.parse(text);
  assertJsonBudget(value);
  assertJsonNumberFidelity(text);
  return value;
}

/** Compare decimal literals without rounding them through IEEE-754 first.
 * Quoted strings are consumed whole, including escaped quotes. Refusing a
 * lossy conversion keeps identifiers and very small/large quantities intact. */
export function assertJsonNumberFidelity(text: string): void {
  const canonical = (literal: string) => {
    const [mantissa, exponent = "0"] = literal.toLowerCase().split("e");
    const negative = mantissa.startsWith("-");
    let digits = mantissa.replace(/^[+-]/u, "").replace(".", "").replace(/^0+/u, "");
    if (!digits) return "0";
    const power = Number(exponent) - (mantissa.split(".")[1]?.length ?? 0);
    const zeros = digits.length - digits.replace(/0+$/u, "").length;
    digits = digits.slice(0, digits.length - zeros);
    return `${negative ? "-" : ""}${digits}e${power + zeros}`;
  };
  for (const match of text.matchAll(/"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/gu)) {
    const literal = match[0];
    if (literal.startsWith('"')) continue;
    const number = Number(literal);
    if (!Number.isFinite(number) || canonical(literal) !== canonical(String(number))) {
      throw new RangeError("A number would lose precision during conversion. Keep it as a quoted string to preserve its exact value.");
    }
  }
}
