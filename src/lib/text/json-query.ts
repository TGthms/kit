import { assertJsonBudget, MAX_TEXT_LENGTH } from "./budget";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Flatten nested JSON into dotted paths; arrays use `[i]` segments. */
export function flattenJson(value: unknown, prefix = ""): Record<string, unknown> {
  assertJsonBudget(value);
  const out: Record<string, unknown> = Object.create(null);
  let outputSize = 0;
  const put = (path: string, item: unknown) => {
    outputSize += path.length + (JSON.stringify(item)?.length ?? 0);
    if (outputSize > MAX_TEXT_LENGTH * 4) throw new RangeError("Flattened JSON is too large to display. Use a smaller document.");
    out[path] = item;
  };

  const walk = (current: unknown, path: string): void => {
    if (Array.isArray(current)) {
      if (current.length === 0) {
        put(path, current);
        return;
      }
      current.forEach((item, index) => {
        const next = path ? `${path}[${index}]` : `[${index}]`;
        walk(item, next);
      });
      return;
    }
    if (isPlainObject(current)) {
      const keys = Object.keys(current);
      if (keys.length === 0) {
        put(path, current);
        return;
      }
      for (const key of keys) {
        const plain = /^[A-Za-z_$][\w$]*$/u.test(key);
        const next = plain ? (path ? `${path}.${key}` : key) : `${path}[${JSON.stringify(key)}]`;
        walk(current[key], next);
      }
      return;
    }
    put(path, current);
  };

  walk(value, prefix);
  return out;
}

type PathSegment = { type: "key"; key: string } | { type: "index"; index: number };

function parseJsonPath(path: string): PathSegment[] {
  const trimmed = path.trim();
  if (!trimmed.startsWith("$")) throw new Error(`Invalid JSONPath: ${path}`);
  const segments: PathSegment[] = [];
  let i = 1;
  while (i < trimmed.length) {
    if (trimmed[i] === ".") {
      i += 1;
      const start = i;
      while (i < trimmed.length && /[A-Za-z0-9_$]/.test(trimmed[i]!)) i += 1;
      if (i === start) throw new Error(`Invalid JSONPath: ${path}`);
      segments.push({ type: "key", key: trimmed.slice(start, i) });
      continue;
    }
    if (trimmed[i] === "[") {
      i += 1;
      if (trimmed[i] === '"') {
        const start = i;
        i += 1;
        while (i < trimmed.length) {
          if (trimmed[i] === "\\") { i += 2; continue; }
          if (trimmed[i] === '"') break;
          i += 1;
        }
        let key: unknown;
        try { key = JSON.parse(trimmed.slice(start, i + 1)); } catch { throw new Error(`Invalid JSONPath: ${path}`); }
        if (typeof key !== "string" || trimmed[i + 1] !== "]") throw new Error(`Invalid JSONPath: ${path}`);
        segments.push({ type: "key", key });
        i += 2;
        continue;
      }
      if (trimmed[i] === "'") {
        const quote = trimmed[i]!;
        i += 1;
        let key = "";
        while (i < trimmed.length && trimmed[i] !== quote) {
          if (trimmed[i] === "\\" && i + 1 < trimmed.length) {
            key += trimmed[i + 1];
            i += 2;
            continue;
          }
          key += trimmed[i];
          i += 1;
        }
        if (trimmed[i] !== quote) throw new Error(`Invalid JSONPath: ${path}`);
        i += 1;
        if (trimmed[i] !== "]") throw new Error(`Invalid JSONPath: ${path}`);
        i += 1;
        segments.push({ type: "key", key });
        continue;
      }
      const start = i;
      while (i < trimmed.length && /\d/.test(trimmed[i]!)) i += 1;
      if (i === start || trimmed[i] !== "]") throw new Error(`Invalid JSONPath: ${path}`);
      segments.push({ type: "index", index: Number(trimmed.slice(start, i)) });
      i += 1;
      continue;
    }
    throw new Error(`Invalid JSONPath: ${path}`);
  }
  return segments;
}

/**
 * Resolve a simple JSONPath (`$.a.b`, `$.items[0].name`, `$['a']`).
 * Returns matching values as an array; missing paths yield [].
 */
export function jsonPathGet(value: unknown, path: string): unknown[] {
  const segments = parseJsonPath(path);
  let current: unknown = value;
  for (const segment of segments) {
    if (segment.type === "index") {
      if (!Array.isArray(current) || segment.index < 0 || segment.index >= current.length) return [];
      current = current[segment.index];
      continue;
    }
    if (!isPlainObject(current) || !Object.prototype.hasOwnProperty.call(current, segment.key)) return [];
    current = current[segment.key];
  }
  return [current];
}
