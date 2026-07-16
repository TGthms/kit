import * as pdfjs from "pdfjs-dist";

let workerReady = false;

export function ensurePdfWorker() {
  if (workerReady) return;
  // Use CDN worker compatible with pdfjs-dist version for static export simplicity
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  workerReady = true;
}

export async function renderPdfThumbnail(
  data: ArrayBuffer,
  pageNum = 1,
  scale = 0.35
): Promise<string> {
  ensurePdfWorker();
  const doc = await pdfjs.getDocument({ data: data.slice(0) }).promise;
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const url = canvas.toDataURL("image/jpeg", 0.7);
  await doc.cleanup();
  return url;
}

export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  ensurePdfWorker();
  const doc = await pdfjs.getDocument({ data: data.slice(0) }).promise;
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
  return parts.join("\n\n");
}

export async function compressPdfLossy(
  data: ArrayBuffer,
  quality = 0.6,
  scale = 1.2
): Promise<Uint8Array> {
  ensurePdfWorker();
  const { PDFDocument } = await import("pdf-lib");
  const src = await pdfjs.getDocument({ data: data.slice(0) }).promise;
  const out = await PDFDocument.create();

  for (let i = 1; i <= src.numPages; i++) {
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
  }
  await src.cleanup();
  return out.save();
}
