function ident(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function propertyName(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

function infer(value: unknown, name: string, types: Map<string, string>): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (!value.length) return "unknown[]";
    const inner = [...new Set(value.map((v) => infer(v, name, types)))];
    return inner.length === 1 ? `${inner[0]}[]` : `(${inner.join(" | ")})[]`;
  }
  if (typeof value === "object") {
    const typeName = ident(name[0].toUpperCase() + name.slice(1));
    const fields = Object.entries(value as Record<string, unknown>).map(([k, v]) => {
      return `  ${propertyName(k)}: ${infer(v, k, types)};`;
    });
    let unique = typeName;
    let n = 2;
    while (types.has(unique) && types.get(unique) !== fields.join("\n")) {
      unique = `${typeName}${n++}`;
    }
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
    const data = JSON.parse(input);
    const types = new Map<string, string>();
    const root = infer(data, rootName, types);
    if (!types.size) {
      return { ok: true, text: `export type ${ident(rootName)} = ${root};\n` };
    }
    const blocks = [...types.entries()].map(([name, body]) => `export interface ${name} {\n${body}\n}`);
    if (!types.has(ident(rootName)) && root !== ident(rootName)) {
      blocks.push(`export type ${ident(rootName)} = ${root};`);
    }
    return { ok: true, text: blocks.join("\n\n") + "\n" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
