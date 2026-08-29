export type XmlNode = {
  name: string;
  attributes: Record<string, string>;
  children: Array<XmlNode | string>;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function encodeEntities(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function skipWs(input: string, i: number): number {
  while (i < input.length && /\s/.test(input[i])) i++;
  return i;
}

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    attrs[m[1]] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

function parseNode(input: string, start: number): { node: XmlNode; next: number } {
  let i = skipWs(input, start);
  if (input[i] !== "<") throw new Error(`Expected '<' at ${i}`);
  i++;
  if (input.startsWith("!--", i)) {
    const end = input.indexOf("-->", i);
    if (end < 0) throw new Error("Unterminated comment");
    return parseNode(input, end + 3);
  }
  if (input.startsWith("![CDATA[", i)) {
    throw new Error("CDATA must be inside an element");
  }
  if (input[i] === "?") {
    const end = input.indexOf("?>", i);
    if (end < 0) throw new Error("Unterminated processing instruction");
    return parseNode(input, end + 2);
  }
  if (input[i] === "!") {
    // A DOCTYPE with an internal subset (`<!DOCTYPE foo [ ... ]>`) can
    // contain ">" characters inside the "[...]" part (e.g. after an
    // <!ENTITY ...> declaration); naively stopping at the first ">" cuts
    // the declaration off in the middle and misaligns everything parsed
    // after it. Walk past a bracketed internal subset, if present, before
    // looking for the declaration's real closing ">".
    let bracketDepth = 0;
    let end = -1;
    for (let k = i; k < input.length; k++) {
      if (input[k] === "[") bracketDepth++;
      else if (input[k] === "]") bracketDepth = Math.max(0, bracketDepth - 1);
      else if (input[k] === ">" && bracketDepth === 0) {
        end = k;
        break;
      }
    }
    if (end < 0) throw new Error("Unterminated declaration");
    return parseNode(input, end + 1);
  }

  const nameMatch = input.slice(i).match(/^[/]?[A-Za-z_:][\w:.-]*/);
  if (!nameMatch) throw new Error(`Invalid tag at ${i}`);
  const name = nameMatch[0];
  if (name.startsWith("/")) throw new Error(`Unexpected closing tag </${name.slice(1)}>`);
  i += name.length;
  const restStart = i;
  let j = i;
  let inQuote: '"' | "'" | null = null;
  while (j < input.length) {
    const c = input[j];
    if (inQuote) {
      if (c === inQuote) inQuote = null;
    } else if (c === '"' || c === "'") {
      inQuote = c;
    } else if (c === ">") {
      break;
    }
    j++;
  }
  if (j >= input.length) throw new Error("Unterminated start tag");
  const rawAttrs = input.slice(restStart, j).trim();
  const selfClose = rawAttrs.endsWith("/");
  const attrSrc = selfClose ? rawAttrs.slice(0, -1) : rawAttrs;
  const node: XmlNode = { name, attributes: parseAttributes(attrSrc), children: [] };
  i = j + 1;
  if (selfClose) return { node, next: i };

  while (i < input.length) {
    i = skipWs(input, i);
    if (input.startsWith(`</${name}`, i)) {
      const close = input.indexOf(">", i);
      if (close < 0) throw new Error(`Unterminated closing tag for ${name}`);
      return { node, next: close + 1 };
    }
    if (input.startsWith("<![CDATA[", i)) {
      const end = input.indexOf("]]>", i);
      if (end < 0) throw new Error("Unterminated CDATA");
      node.children.push(input.slice(i + 9, end));
      i = end + 3;
      continue;
    }
    if (input.startsWith("<!--", i)) {
      const end = input.indexOf("-->", i);
      if (end < 0) throw new Error("Unterminated comment");
      i = end + 3;
      continue;
    }
    if (input[i] === "<") {
      const child = parseNode(input, i);
      node.children.push(child.node);
      i = child.next;
    } else {
      const nextTag = input.indexOf("<", i);
      const end = nextTag < 0 ? input.length : nextTag;
      const text = decodeEntities(input.slice(i, end)).trim();
      if (text) node.children.push(text);
      i = end;
    }
  }
  throw new Error(`Missing closing tag for ${name}`);
}

export function parseXml(input: string): XmlNode {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Empty XML");
  const { node } = parseNode(trimmed, 0);
  return node;
}

export function xmlToJson(input: string): unknown {
  const node = parseXml(input);
  return nodeToJson(node);
}

function nodeToJson(node: XmlNode): unknown {
  const hasAttrs = Object.keys(node.attributes).length > 0;
  const elements = node.children.filter((c): c is XmlNode => typeof c !== "string");
  const texts = node.children.filter((c): c is string => typeof c === "string");
  if (!hasAttrs && elements.length === 0) {
    return texts.join(" ");
  }
  const obj: Record<string, unknown> = {};
  if (hasAttrs) obj["@attributes"] = node.attributes;
  if (texts.length) obj["#text"] = texts.join(" ");
  const grouped = new Map<string, unknown[]>();
  for (const child of elements) {
    const list = grouped.get(child.name) ?? [];
    list.push(nodeToJson(child));
    grouped.set(child.name, list);
  }
  for (const [name, list] of grouped) {
    obj[name] = list.length === 1 ? list[0] : list;
  }
  return obj;
}

export function jsonToXml(value: unknown, rootName = "root"): string {
  return serializeNode(valueToNode(rootName, value), 0) + "\n";
}

function valueToNode(name: string, value: unknown): XmlNode {
  if (value === null || value === undefined) {
    return { name, attributes: {}, children: [] };
  }
  if (typeof value !== "object") {
    return { name, attributes: {}, children: [String(value)] };
  }
  if (Array.isArray(value)) {
    return {
      name,
      attributes: {},
      children: value.map((item) => valueToNode("item", item)),
    };
  }
  const rec = value as Record<string, unknown>;
  const attributes =
    rec["@attributes"] && typeof rec["@attributes"] === "object" && !Array.isArray(rec["@attributes"])
      ? Object.fromEntries(
          Object.entries(rec["@attributes"] as Record<string, unknown>).map(([k, v]) => [k, String(v)])
        )
      : {};
  const children: Array<XmlNode | string> = [];
  if (typeof rec["#text"] === "string") children.push(rec["#text"]);
  for (const [k, v] of Object.entries(rec)) {
    if (k === "@attributes" || k === "#text") continue;
    if (Array.isArray(v)) {
      for (const item of v) children.push(valueToNode(k, item));
    } else {
      children.push(valueToNode(k, v));
    }
  }
  return { name, attributes, children };
}

function serializeNode(node: XmlNode, depth: number): string {
  const pad = "  ".repeat(depth);
  const attrs = Object.entries(node.attributes)
    .map(([k, v]) => ` ${k}="${encodeEntities(v)}"`)
    .join("");
  if (!node.children.length) return `${pad}<${node.name}${attrs}/>`;
  if (node.children.length === 1 && typeof node.children[0] === "string") {
    return `${pad}<${node.name}${attrs}>${encodeEntities(node.children[0])}</${node.name}>`;
  }
  const inner = node.children
    .map((c) => (typeof c === "string" ? `${pad}  ${encodeEntities(c)}` : serializeNode(c, depth + 1)))
    .join("\n");
  return `${pad}<${node.name}${attrs}>\n${inner}\n${pad}</${node.name}>`;
}

export function xmlToJsonText(input: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    return { ok: true, text: JSON.stringify(xmlToJson(input), null, 2) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function jsonToXmlText(
  input: string,
  rootName = "root"
): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const data = JSON.parse(input);
    return { ok: true, text: jsonToXml(data, rootName) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
