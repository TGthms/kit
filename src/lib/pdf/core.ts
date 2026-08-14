import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";

export type PdfInput = ArrayBuffer | Uint8Array;

export function asPdfBytes(buf: PdfInput): Uint8Array {
  return buf instanceof Uint8Array ? buf : new Uint8Array(buf);
}

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

export async function splitPdf(buf: PdfInput, range: string): Promise<Uint8Array> {
  const src = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
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
  buf: PdfInput,
  text: string,
  position: "header" | "footer" | "center",
  opacity: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
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

export async function getPdfPageCount(buf: PdfInput): Promise<number> {
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  return doc.getPageCount();
}

export function formatPageLabel(page: number, total: number, template: string): string {
  return template.replaceAll("{page}", String(page)).replaceAll("{pages}", String(total));
}

export type PageNumberPosition =
  | "header-left"
  | "header-center"
  | "header-right"
  | "footer-left"
  | "footer-center"
  | "footer-right";

export async function numberPdfPages(
  buf: PdfInput,
  opts: {
    template?: string;
    position?: PageNumberPosition;
    start?: number;
  } = {}
): Promise<Uint8Array> {
  const template = opts.template || "{page} / {pages}";
  const position = opts.position || "footer-center";
  const start = opts.start ?? 1;
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;
  const size = 10;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const text = formatPageLabel(start + i, start + total - 1, template);
    const tw = font.widthOfTextAtSize(text, size);
    const margin = 28;
    const header = position.startsWith("header");
    const y = header ? height - 22 : 16;
    let x = (width - tw) / 2;
    if (position.endsWith("left")) x = margin;
    if (position.endsWith("right")) x = Math.max(margin, width - tw - margin);
    page.drawText(text, { x, y, size, font, color: rgb(0.25, 0.25, 0.25) });
  }
  return doc.save();
}

export type EmbeddableImage = {
  bytes: Uint8Array;
  mime: "image/jpeg" | "image/png";
};

export function detectImageMime(bytes: Uint8Array): EmbeddableImage["mime"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  return null;
}

export async function imagesToPdf(images: EmbeddableImage[]): Promise<Uint8Array> {
  if (!images.length) throw new Error("No images");
  const doc = await PDFDocument.create();
  for (const img of images) {
    const embedded =
      img.mime === "image/png" ? await doc.embedPng(img.bytes) : await doc.embedJpg(img.bytes);
    const page = doc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }
  return doc.save();
}

export async function flattenPdfForms(
  buf: PdfInput
): Promise<{ bytes: Uint8Array; fieldCount: number }> {
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  const form = doc.getForm();
  const fieldCount = form.getFields().length;
  if (fieldCount > 0) form.flatten();
  return { bytes: await doc.save(), fieldCount };
}

export type PdfMeta = {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
};

export async function getPdfMetadata(buf: PdfInput): Promise<PdfMeta> {
  const doc = await PDFDocument.load(asPdfBytes(buf), {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: doc.getKeywords() ?? "",
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
  };
}

export async function setPdfMetadata(buf: PdfInput, meta: Partial<PdfMeta>): Promise<Uint8Array> {
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  if (meta.title !== undefined) doc.setTitle(meta.title);
  if (meta.author !== undefined) doc.setAuthor(meta.author);
  if (meta.subject !== undefined) doc.setSubject(meta.subject);
  if (meta.keywords !== undefined) {
    doc.setKeywords(
      meta.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    );
  }
  if (meta.creator !== undefined) doc.setCreator(meta.creator);
  if (meta.producer !== undefined) doc.setProducer(meta.producer);
  return doc.save();
}

export async function stampPdfSignature(
  buf: PdfInput,
  text: string,
  where: "all" | number = "all"
): Promise<Uint8Array> {
  if (!text.trim()) throw new Error("Signature is empty");
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaOblique);
  const pages = doc.getPages();
  const targets =
    where === "all" ? pages : pages[Math.max(0, where - 1)] ? [pages[Math.max(0, where - 1)]] : [];
  if (!targets.length) throw new Error("Page not found");
  for (const page of targets) {
    const { width } = page.getSize();
    const size = 14;
    const tw = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: Math.max(28, width - tw - 36),
      y: 28,
      size,
      font,
      color: rgb(0.12, 0.12, 0.16),
    });
  }
  return doc.save();
}

export async function stripPdfMetadata(buf: PdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("Kit");
  return doc.save();
}
