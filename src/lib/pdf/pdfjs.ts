import * as pdfjs from "pdfjs-dist";
import { forEachJobIndex } from "@/lib/jobs/batch";

let workerReady = false;

export function ensurePdfWorker() {
  if (workerReady) return;
  // Use CDN worker compatible with pdfjs-dist version for static export simplicity
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  workerReady = true;
}

async function openPdfDocument(data: ArrayBuffer) {
  const loadingTask = pdfjs.getDocument({ data: data.slice(0) });
  return { loadingTask, doc: await loadingTask.promise };
}

export async function renderPdfThumbnail(
  data: ArrayBuffer,
  pageNum = 1,
  scale = 0.35
): Promise<string> {
  ensurePdfWorker();
  const { doc, loadingTask } = await openPdfDocument(data);
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const url = canvas.toDataURL("image/jpeg", 0.7);
  await doc.cleanup();
  await loadingTask.destroy();
  return url;
}

export async function renderPdfPagesToBlobs(
  data: ArrayBuffer,
  opts: {
    scale?: number;
    mime?: "image/jpeg" | "image/png";
    quality?: number;
    signal?: AbortSignal;
    onProgress?: (ratio: number) => void;
  } = {}
): Promise<Blob[]> {
  ensurePdfWorker();
  const scale = opts.scale ?? 1.5;
  const mime = opts.mime ?? "image/jpeg";
  const quality = opts.quality ?? 0.85;
  const { doc, loadingTask } = await openPdfDocument(data);
  try {
    const blobs: Blob[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, quality)
      );
      blobs.push(blob);
      opts.onProgress?.(i / doc.numPages);
    }
    return blobs;
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}

export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  ensurePdfWorker();
  const { doc, loadingTask } = await openPdfDocument(data);
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    parts.push(text);
  }
  await doc.cleanup();
  await loadingTask.destroy();
  return parts.join("\n\n");
}

export async function compressPdfLossy(
  data: ArrayBuffer,
  quality = 0.6,
  scale = 1.2,
  opts?: { onProgress?: (ratio: number) => void; signal?: AbortSignal }
): Promise<Uint8Array> {
  ensurePdfWorker();
  const { PDFDocument } = await import("pdf-lib");
  const { doc: src, loadingTask } = await openPdfDocument(data);
  const out = await PDFDocument.create();

  await forEachJobIndex(
    src.numPages,
    async (i) => {
      const page = await src.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob failed"))), "image/jpeg", quality)
      );
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const img = await out.embedJpg(bytes);
      const p = out.addPage([viewport.width, viewport.height]);
      p.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    },
    { signal: opts?.signal, onProgress: opts?.onProgress }
  );
  await src.cleanup();
  await loadingTask.destroy();
  return out.save();
}
