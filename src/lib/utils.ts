import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, locale = "en"): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: i === 0 ? 0 : 1 }).format(n)} ${units[i]}`;
}

/** Decode a data: URL without fetch() — CSP connect-src does not allow data:. */
export function blobFromDataUrl(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:") || comma < 5) throw new Error("Invalid data URL");
  const header = dataUrl.slice(5, comma);
  const body = dataUrl.slice(comma + 1);
  const mime = header.split(";")[0] || "application/octet-stream";
  if (/;base64/i.test(header)) {
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(body)], { type: mime });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Delay revoke so Safari finishes the download
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** Safe Blob from Uint8Array (avoids SharedArrayBuffer / offset buffer issues). */
export function bytesToBlob(bytes: Uint8Array, type: string): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type });
}

export function downloadText(text: string, filename: string, mime = "text/plain") {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export function extensionForMime(mime: string, fallback = "bin"): string {
  const normalized = mime.toLowerCase().split(";", 1)[0];
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  if (normalized === "application/pdf") return "pdf";
  if (normalized === "audio/mpeg") return "mp3";
  if (normalized === "audio/wav" || normalized === "audio/x-wav") return "wav";
  if (normalized === "video/mp4") return "mp4";
  return fallback.replace(/^\./, "") || "bin";
}

export const LARGE_FILE_BYTES = 80 * 1024 * 1024;
/** Hard cap: refuse to queue files that will almost certainly OOM the tab. */
export const MAX_FILE_BYTES = 200 * 1024 * 1024;

export function isLargeFile(size: number): boolean {
  return size >= LARGE_FILE_BYTES;
}

export function isOversizedFile(size: number): boolean {
  return size >= MAX_FILE_BYTES;
}

export async function downloadMany(
  items: Array<{ blob: Blob; name: string }>,
  zipName: string
): Promise<void> {
  if (!items.length) return;
  if (items.length === 1) {
    downloadBlob(items[0].blob, items[0].name);
    return;
  }
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const item of items) zip.file(item.name, item.blob);
  downloadBlob(await zip.generateAsync({ type: "blob" }), zipName);
}
