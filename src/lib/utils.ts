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

export const LARGE_FILE_BYTES = 80 * 1024 * 1024;

export function isLargeFile(size: number): boolean {
  return size >= LARGE_FILE_BYTES;
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
