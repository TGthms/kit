import { jobRatio, throwIfAborted } from "./abort";

export type BatchItem = { blob: Blob; name: string };

export async function runSequentialBatch<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<BatchItem>,
  opts?: {
    signal?: AbortSignal;
    onProgress?: (ratio: number) => void;
  }
): Promise<BatchItem[]> {
  if (!items.length) throw new Error("No files");
  const out: BatchItem[] = [];
  for (let i = 0; i < items.length; i++) {
    throwIfAborted(opts?.signal);
    out.push(await worker(items[i], i));
    opts?.onProgress?.(jobRatio(i + 1, items.length));
  }
  return out;
}

/** 1-based page/index loop used by long PDF rasters so cancel is checked per page. */
export async function forEachJobIndex(
  count: number,
  worker: (index: number) => Promise<void>,
  opts?: {
    signal?: AbortSignal;
    onProgress?: (ratio: number) => void;
  }
): Promise<void> {
  if (count < 1) return;
  for (let i = 1; i <= count; i++) {
    throwIfAborted(opts?.signal);
    await worker(i);
    opts?.onProgress?.(jobRatio(i, count));
  }
}

export function stemmedName(filename: string, suffix: string, ext: string): string {
  const base = filename.replace(/\.[^/.]+$/, "") || "file";
  const cleanExt = ext.replace(/^\./, "");
  return `${base}${suffix}.${cleanExt}`;
}
