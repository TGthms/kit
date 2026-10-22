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
  return value;
}
