import YAML from "yaml";
import { parse as parseToml } from "smol-toml";
import { marked } from "marked";
import TurndownService from "turndown";
import Papa from "papaparse";
import { diffLines } from "diff";
import { assertTextBudget, assertJsonBudget, parseToolJson } from "./budget";

export function formatJson(input: string, minify = false): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const data = parseToolJson(input);
    return { ok: true, text: minify ? JSON.stringify(data) : JSON.stringify(data, null, 2) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function formatYaml(input: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    assertTextBudget(input);
    const data = YAML.parse(input);
    assertJsonBudget(data);
    return { ok: true, text: YAML.stringify(data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Validates TOML and returns it with a single trailing newline. The document is
 * not re-serialized: TOML keeps comments and key order, which a round trip
 * through a serializer would discard.
 */
export function formatToml(input: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    assertTextBudget(input);
    parseToml(input);
    return { ok: true, text: input.trim() + "\n" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function markdownToHtml(md: string): string {
  assertTextBudget(md);
  return marked.parse(md, { async: false }) as string;
}

export function htmlToMarkdown(html: string): string {
  assertTextBudget(html);
  const td = new TurndownService();
  return td.turndown(html);
}

export function csvToJson(csv: string): { ok: true; text: string } | { ok: false; error: string } {
  try { assertTextBudget(csv); } catch (error) { return { ok: false, error: (error as Error).message }; }
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    return { ok: false, error: parsed.errors[0]?.message || "CSV parse error" };
  }
  return { ok: true, text: JSON.stringify(parsed.data, null, 2) };
}

export function jsonToCsv(json: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const data = parseToolJson(json);
    if (!Array.isArray(data)) return { ok: false, error: "JSON must be an array of objects" };
    return { ok: true, text: Papa.unparse(data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function textDiff(a: string, b: string) {
  assertTextBudget(a);
  assertTextBudget(b);
  const result = diffLines(a, b, { timeout: 250, maxEditLength: 10_000 });
  if (!result) throw new RangeError("These documents are too different to compare in this tab. Try smaller sections.");
  return result;
}

export function encodeBase64Text(text: string): string {
  assertTextBudget(text);
  return btoa(unescape(encodeURIComponent(text)));
}

export function decodeBase64Text(b64: string): string {
  assertTextBudget(b64);
  return decodeURIComponent(escape(atob(b64.trim())));
}

export async function fileToBase64(file: Blob): Promise<string> {
  if (file.size > 16 * 1024 * 1024) throw new RangeError("Use a file of 16 MB or less for Base64 conversion.");
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBlob(b64: string, mime = "application/octet-stream"): Blob {
  if (b64.length > 24 * 1024 * 1024) throw new RangeError("Base64 data is too large for this tab.");
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

export function urlDecode(text: string): string {
  return decodeURIComponent(text);
}

export { xmlToJson, jsonToXml, xmlToJsonText, jsonToXmlText, parseXml } from "./xml";
export { formatSql } from "./sql";
export { hashText, hashBytes, HASH_ALGOS, type HashAlgo } from "./hash";
export { generateUuid, generateUuids } from "./uuid";
export {
  parseHex,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  convertColor,
} from "./color";
export { runRegex, replaceRegex, runRegexAsync, replaceRegexAsync } from "./regex";
export { generateLorem, type LoremMode } from "./lorem";
export { generateQrDataUrl, readQrFromImageData, qrToPixels } from "./qr";
