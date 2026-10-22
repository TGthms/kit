import { parseToolJson } from "./budget";

function ident(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function propertyName(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

function infer(value: unknown, name: string, types: Map<string, string>, counts: Map<string, number>): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (!value.length) return "unknown[]";
    const inner = [...new Set(value.map((v) => infer(v, `${name}Item`, types, counts)))];
    return inner.length === 1 ? `${inner[0]}[]` : `(${inner.join(" | ")})[]`;
  }
  if (typeof value === "object") {
    const typeName = ident((name[0]?.toUpperCase() ?? "Value") + name.slice(1));
    let number = counts.get(typeName) ?? 0;
    let unique: string;
    do { number += 1; unique = number === 1 ? typeName : `${typeName}${number}`; } while (types.has(unique));
    counts.set(typeName, number);
    // Reserve before walking children so a nested `root` cannot capture Root.
    types.set(unique, "");
    const fields = Object.entries(value as Record<string, unknown>).map(([k, v]) => {
      return `  ${propertyName(k)}: ${infer(v, k, types, counts)};`;
    });
    types.set(unique, fields.join("\n"));
    return unique;
  }
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "unknown";
}

export function jsonToTypescript(input: string, rootName = "Root"): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const data = parseToolJson(input);
    const name = ident(rootName || "Root");
    // TypeScript keywords cannot be exported declaration names.
    const declaration = /^(?:string|number|boolean|any|unknown|never|void|object|null|undefined|class|interface|type|export|default|function|new|const|let|var|enum|extends|implements|import|return|if|else|for|while|switch|case|break|true|false|this|super|delete|in|instanceof|typeof|keyof|infer|is|asserts|readonly|symbol|bigint)$/u.test(name) ? `_${name}` : name;
    const types = new Map<string, string>();
    // Reserve the public name for primitives and arrays too.
    const objectRoot = data !== null && typeof data === "object" && !Array.isArray(data);
    if (!objectRoot) types.set(declaration, "");
    const root = infer(data, declaration, types, new Map());
    if (!objectRoot) types.delete(declaration);
    const blocks = [...types.entries()].map(([name, body]) => `export interface ${name} {\n${body}\n}`);
    if (!objectRoot || root !== declaration) {
      blocks.push(`export type ${declaration} = ${root};`);
    }
    return { ok: true, text: blocks.join("\n\n") + "\n" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
