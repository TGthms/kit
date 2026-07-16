import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";

export async function mergePdfs(files: ArrayBuffer[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const buf of files) {
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save();
}

export function parsePageRange(range: string, pageCount: number): number[] {
  const set = new Set<number>();
  for (const part of range.split(",")) {
    const t = part.trim();
    if (!t) continue;
    if (t.includes("-")) {
      const [a, b] = t.split("-").map((x) => parseInt(x.trim(), 10));
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const start = Math.max(1, Math.min(a, b));
      const end = Math.min(pageCount, Math.max(a, b));
      for (let i = start; i <= end; i++) set.add(i - 1);
    } else {
      const n = parseInt(t, 10);
      if (Number.isFinite(n) && n >= 1 && n <= pageCount) set.add(n - 1);
    }
  }
  return [...set].sort((a, b) => a - b);
}

export async function splitPdf(buf: ArrayBuffer, range: string): Promise<Uint8Array> {
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const indices = parsePageRange(range, src.getPageCount());
  if (!indices.length) throw new Error("No valid pages in range");
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

export async function organizePdf(
  buf: ArrayBuffer,
  order: number[],
  rotations: Record<number, number>,
  deleted: Set<number>
): Promise<Uint8Array> {
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const kept = order.filter((i) => !deleted.has(i));
  const pages = await out.copyPages(src, kept);
  pages.forEach((p, idx) => {
    const srcIndex = kept[idx];
    const rot = rotations[srcIndex] || 0;
    if (rot) p.setRotation(degrees(rot));
    out.addPage(p);
  });
  return out.save();
}

export async function watermarkPdf(
  buf: ArrayBuffer,
  text: string,
  position: "header" | "footer" | "center",
  opacity: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    const size = position === "center" ? 36 : 12;
    const tw = font.widthOfTextAtSize(text, size);
    const x = (width - tw) / 2;
    let y = height - 28;
    if (position === "footer") y = 20;
    if (position === "center") y = height / 2;
    page.drawText(text, {
      x,
      y,
      size,
      font,
      color: rgb(0.4, 0.4, 0.4),
      opacity: Math.min(1, Math.max(0.05, opacity)),
      rotate: position === "center" ? degrees(-30) : undefined,
    });
  }
  return doc.save();
}

export async function redactPdf(
  buf: ArrayBuffer,
  boxes: Array<{ page: number; x: number; y: number; w: number; h: number }>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const pages = doc.getPages();
  for (const box of boxes) {
    const page = pages[box.page];
    if (!page) continue;
    page.drawRectangle({
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      color: rgb(0, 0, 0),
    });
  }
  return doc.save();
}

export async function getPdfPageCount(buf: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  return doc.getPageCount();
}
