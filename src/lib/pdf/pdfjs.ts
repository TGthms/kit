import * as pdfjs from "pdfjs-dist";
import { forEachJobIndex } from "@/lib/jobs/batch";
import { withBasePath, withVendor } from "@/lib/base-path";
import { integerCanvasSize, pdfPageWindow, type PdfPageBatch } from "./limits";
import type { ViewportTransform } from "./viewport";

export type { ViewportTransform } from "./viewport";
export {
  applyInverseViewportTransform,
  applyViewportTransform,
  canvasRectToPdfBox,
  pdfBoxToCanvasRect,
} from "./viewport";

export { MAX_PDF_RASTER_PAGES, pdfPageWindow } from "./limits";
export type { PdfPageBatch } from "./limits";

let workerReady = false;

export function ensurePdfWorker() {
  if (workerReady) return;
  // Self-hosted, not loaded from a third-party CDN at runtime: this worker
  // parses untrusted, user-supplied PDF files, so we don't want its code to
  // depend on a live third-party origin we don't control. The file is kept
  // in sync with the installed pdfjs-dist version by `scripts/sync-vendor.mjs`
  // (wired into `postinstall`/`prebuild`) rather than fetched at request time.
  // The URL carries that version so an upgrade replaces the cached worker.
  pdfjs.GlobalWorkerOptions.workerSrc = withVendor("/vendor/pdfjs/pdf.worker.min.mjs");
  workerReady = true;
}

function pdfjsAssetUrl(path: string): string {
  /* pdf.js appends each file name to these directory URLs itself, so they must
     end in "/" and cannot carry a version query. They hold static CMaps,
     standard fonts, WASM and ICC profiles that change only with a pdf.js
     upgrade — and that upgrade already changes the versioned worker URL above,
     which is the file that must match the library. */
  const prefix = withBasePath("/vendor/pdfjs/");
  return `${prefix}${path}`;
}

export const MAX_PDF_CANVAS_EDGE = 8192;
export const MAX_PDF_CANVAS_PIXELS = 16_777_216;

export function clampPdfScale(width: number, height: number, scale: number): number {
  if (!(width > 0) || !(height > 0) || !(scale > 0)) return 0.1;
  const edgeLimit = MAX_PDF_CANVAS_EDGE / Math.max(width, height);
  const pixelLimit = Math.sqrt(MAX_PDF_CANVAS_PIXELS / (width * height));
  return Math.max(0.05, Math.min(scale, edgeLimit, pixelLimit));
}

async function openPdfDocument(data: ArrayBuffer) {
  const loadingTask = pdfjs.getDocument({
    data: data.slice(0),
    cMapUrl: pdfjsAssetUrl("cmaps/"),
    cMapPacked: true,
    standardFontDataUrl: pdfjsAssetUrl("standard_fonts/"),
    wasmUrl: pdfjsAssetUrl("wasm/"),
    iccUrl: pdfjsAssetUrl("iccs/"),
    disableAutoFetch: true,
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

/** The pdf.js document handle produced by openPdfDocument. */
type PdfJsDocument = Awaited<ReturnType<typeof openPdfDocument>>["doc"];

export async function renderPdfPagePreview(
  data: ArrayBuffer,
  pageNum = 1,
  scale = 1.35
): Promise<{ url: string; scale: number; width: number; height: number; pageCount: number; transform: ViewportTransform }> {
  ensurePdfWorker();
  const { doc, loadingTask } = await openPdfDocument(data);
  try {
    const pageCount = doc.numPages;
    const index = Math.min(pageCount, Math.max(1, pageNum));
    const page = await doc.getPage(index);
    const base = page.getViewport({ scale: 1 });
    const applied = clampPdfScale(base.width, base.height, scale);
    const viewport = page.getViewport({ scale: applied });
    const canvas = document.createElement("canvas");
    const size = integerCanvasSize(viewport.width, viewport.height);
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a 2D canvas context");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("toBlob failed"))), "image/jpeg", 0.85)
    );
    return {
      url: URL.createObjectURL(blob),
      scale: applied,
      width: viewport.width,
      height: viewport.height,
      pageCount,
      transform: viewport.transform as ViewportTransform,
    };
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}

/** Render one page of an open document to a JPEG blob URL. */
async function renderPageThumbnailUrl(doc: PdfJsDocument, pageNum: number, scale: number): Promise<string> {
  const page = await doc.getPage(pageNum);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: clampPdfScale(base.width, base.height, scale) });
  const canvas = document.createElement("canvas");
  const size = integerCanvasSize(viewport.width, viewport.height);
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a 2D canvas context");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("toBlob failed"))), "image/jpeg", 0.7)
  );
  return URL.createObjectURL(blob);
}

/** Blob object URL. Callers must revoke it. */
export async function renderPdfThumbnail(
  data: ArrayBuffer,
  pageNum = 1,
  scale = 0.35
): Promise<string> {
  ensurePdfWorker();
  const { doc, loadingTask } = await openPdfDocument(data);
  try {
    return await renderPageThumbnailUrl(doc, pageNum, scale);
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}

/**
 * Blob object URLs for several pages of one file, in the order requested, with
 * `null` where a page could not be rendered. Callers must revoke what they
 * receive. The file is copied and parsed once for the whole set rather than
 * once per page, so a long document stays within reach of low-memory devices.
 */
export async function renderPdfThumbnails(
  data: ArrayBuffer,
  pageNums: number[],
  scale = 0.35
): Promise<Array<string | null>> {
  if (!pageNums.length) return [];
  ensurePdfWorker();
  const { doc, loadingTask } = await openPdfDocument(data);
  const urls: Array<string | null> = [];
  try {
    for (const pageNum of pageNums) {
      try {
        urls.push(await renderPageThumbnailUrl(doc, pageNum, scale));
      } catch {
        urls.push(null);
      }
    }
    return urls;
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
): Promise<PdfPageBatch & { blobs: Blob[] }> {
  ensurePdfWorker();
  const scale = opts.scale ?? 1.5;
  const mime = opts.mime ?? "image/jpeg";
  const quality = opts.quality ?? 0.85;
  const { doc, loadingTask } = await openPdfDocument(data);
  try {
    const window = pdfPageWindow(doc.numPages);
    const blobs: Blob[] = [];
    for (let i = 1; i <= window.processedPages; i++) {
      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: clampPdfScale(base.width, base.height, scale) });
      const canvas = document.createElement("canvas");
      const size = integerCanvasSize(viewport.width, viewport.height);
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create a 2D canvas context");
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, quality)
      );
      blobs.push(blob);
      opts.onProgress?.(i / window.processedPages);
    }
    return { blobs, ...window };
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}

export async function extractPdfText(
  data: ArrayBuffer,
  opts: { signal?: AbortSignal } = {}
): Promise<PdfPageBatch & { text: string }> {
  ensurePdfWorker();
  const { doc, loadingTask } = await openPdfDocument(data);
  try {
    const window = pdfPageWindow(doc.numPages);
    const parts: string[] = [];
    for (let i = 1; i <= window.processedPages; i++) {
      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
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
    return { text: parts.join("\n\n"), ...window };
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
): Promise<PdfPageBatch & { bytes: Uint8Array }> {
  ensurePdfWorker();
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const { doc: src, loadingTask } = await openPdfDocument(data);
  try {
    const window = pdfPageWindow(src.numPages);
    const out = await PDFDocument.create();

    await forEachJobIndex(
      window.processedPages,
      async (i) => {
        const page = await src.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: clampPdfScale(base.width, base.height, scale) });
        const canvas = document.createElement("canvas");
        const size = integerCanvasSize(viewport.width, viewport.height);
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not create a 2D canvas context");
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob: Blob = await new Promise((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob failed"))), "image/jpeg", quality)
        );
        const pageBytes = new Uint8Array(await blob.arrayBuffer());
        const img = await out.embedJpg(pageBytes);
        const p = out.addPage([size.width, size.height]);
        p.drawImage(img, { x: 0, y: 0, width: size.width, height: size.height });
      },
      { signal: opts?.signal, onProgress: opts?.onProgress }
    );
    return { bytes: await out.save(), ...window };
  } finally {
    await src.cleanup();
    await loadingTask.destroy();
  }
}
