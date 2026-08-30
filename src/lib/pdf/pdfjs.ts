import * as pdfjs from "pdfjs-dist";
import { forEachJobIndex } from "@/lib/jobs/batch";
import { withBasePath } from "@/lib/base-path";

let workerReady = false;

export function ensurePdfWorker() {
  if (workerReady) return;
  // Self-hosted, not loaded from a third-party CDN at runtime: this worker
  // parses untrusted, user-supplied PDF files, so we don't want its code to
  // depend on a live third-party origin we don't control. The file is kept
  // in sync with the installed pdfjs-dist version by `scripts/sync-vendor.mjs`
  // (wired into `postinstall`/`prebuild`) rather than fetched at request time.
  pdfjs.GlobalWorkerOptions.workerSrc = withBasePath("/vendor/pdfjs/pdf.worker.min.mjs");
  workerReady = true;
}

function pdfjsAssetUrl(path: string): string {
  const prefix = withBasePath("/vendor/pdfjs/");
  return `${prefix}${path}`;
}

async function openPdfDocument(data: ArrayBuffer) {
  const loadingTask = pdfjs.getDocument({
    data: data.slice(0),
    cMapUrl: pdfjsAssetUrl("cmaps/"),
    cMapPacked: true,
    standardFontDataUrl: pdfjsAssetUrl("standard_fonts/"),
    wasmUrl: pdfjsAssetUrl("wasm/"),
    iccUrl: pdfjsAssetUrl("iccs/"),
  });
  try {
    return { loadingTask, doc: await loadingTask.promise };
  } catch (error) {
    await loadingTask.destroy().catch(() => undefined);
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    if (name === "PasswordException") {
      throw new Error("This PDF is password-protected. Unlock it first, then try again.");
    }
    throw error;
  }
}

export async function renderPdfPagePreview(
  data: ArrayBuffer,
  pageNum = 1,
  scale = 1.35
): Promise<{ url: string; scale: number; width: number; height: number; pageCount: number }> {
  ensurePdfWorker();
  const { doc, loadingTask } = await openPdfDocument(data);
  try {
    const pageCount = doc.numPages;
    const index = Math.min(pageCount, Math.max(1, pageNum));
    const page = await doc.getPage(index);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a 2D canvas context");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("toBlob failed"))), "image/jpeg", 0.85)
    );
    return {
      url: URL.createObjectURL(blob),
      scale,
      width: viewport.width,
      height: viewport.height,
      pageCount,
    };
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}

export async function renderPdfThumbnail(
  data: ArrayBuffer,
  pageNum = 1,
  scale = 0.35
): Promise<string> {
  ensurePdfWorker();
  const { doc, loadingTask } = await openPdfDocument(data);
  try {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a 2D canvas context");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    return canvas.toDataURL("image/jpeg", 0.7);
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
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
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create a 2D canvas context");
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
  try {
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // pdf.js reports each text run with its own transform matrix but does
      // not group runs into visual lines, so we approximate line breaks by
      // watching for a drop in the vertical (y) position between runs.
      let text = "";
      let lastY: number | null = null;
      for (const it of content.items) {
        if (!("str" in it)) continue;
        const y = "transform" in it ? (it.transform?.[5] as number | undefined) ?? null : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 1) {
          text += "\n";
        } else if (text) {
          text += " ";
        }
        text += it.str;
        lastY = y;
      }
      parts.push(text);
    }
    return parts.join("\n\n");
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
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
  try {
    const out = await PDFDocument.create();

    await forEachJobIndex(
      src.numPages,
      async (i) => {
        const page = await src.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not create a 2D canvas context");
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
    return await out.save();
  } finally {
    await src.cleanup();
    await loadingTask.destroy();
  }
}
