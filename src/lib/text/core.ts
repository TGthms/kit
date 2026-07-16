import YAML from "yaml";
import { parse as parseToml } from "smol-toml";
import { marked } from "marked";
import TurndownService from "turndown";
import Papa from "papaparse";
import { diffLines } from "diff";

export function formatJson(input: string, minify = false): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const data = JSON.parse(input);
    return { ok: true, text: minify ? JSON.stringify(data) : JSON.stringify(data, null, 2) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function formatYaml(input: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const data = YAML.parse(input);
    return { ok: true, text: YAML.stringify(data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function formatToml(input: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const data = parseToml(input);
    // re-serialize via JSON-ish dump is limited; return pretty JSON of parsed for validation path
    // For true TOML output keep original if valid, else error
    void data;
    return { ok: true, text: input.trim() + "\n" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export function htmlToMarkdown(html: string): string {
  const td = new TurndownService();
  return td.turndown(html);
}

export function csvToJson(csv: string): { ok: true; text: string } | { ok: false; error: string } {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    return { ok: false, error: parsed.errors[0]?.message || "CSV parse error" };
  }
  return { ok: true, text: JSON.stringify(parsed.data, null, 2) };
}

export function jsonToCsv(json: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return { ok: false, error: "JSON must be an array of objects" };
    return { ok: true, text: Papa.unparse(data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function textDiff(a: string, b: string) {
  return diffLines(a, b);
}

export function encodeBase64Text(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

export function decodeBase64Text(b64: string): string {
  return decodeURIComponent(escape(atob(b64.trim())));
}

export async function fileToBase64(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBlob(b64: string, mime = "application/octet-stream"): Blob {
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
