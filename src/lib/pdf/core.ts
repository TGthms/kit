import { PDFDocument, PDFName, degrees, rgb, StandardFonts } from "@cantoo/pdf-lib";
import { inspectPdfReadability } from "./protect";

export type PdfInput = ArrayBuffer | Uint8Array;

export function asPdfBytes(buf: PdfInput): Uint8Array {
  return buf instanceof Uint8Array ? buf : new Uint8Array(buf);
}

/**
 * Structure tools use `@cantoo/pdf-lib` with `{ ignoreEncryption: true }`.
 * That option only skips the password check; it does not decrypt content
 * streams. Encrypted input still yields parser errors or garbage, so we
 * fail fast via inspectPdfReadability (protect.ts) and send the user to
 * Unlock first.
 */
async function assertNotEncrypted(buf: PdfInput): Promise<void> {
  const state = await inspectPdfReadability(asPdfBytes(buf));
  if (state === "encrypted") {
    throw new Error("This PDF is password-protected. Unlock it first, then try again.");
  }
  if (state === "unreadable") {
    throw new Error("This file could not be read as a PDF.");
  }
}

export async function mergePdfs(files: ArrayBuffer[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const buf of files) {
    await assertNotEncrypted(buf);
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save();
}

/** pdf-lib rotates around (x, y). Shift so the box center stays on (cx, cy). */
export function rotatedDrawOrigin(cx: number, cy: number, width: number, height: number, degreesAngle: number): { x: number; y: number } {
  const radians = (degreesAngle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = -width / 2;
  const dy = -height / 2;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

function needsBrowserUnicodeFont(text: string): boolean {
  return /[^\x00-\x7F]/u.test(text);
}

async function embedBrowserText(
  doc: PDFDocument,
  text: string,
  size: number,
  color: [number, number, number],
  opacity = 1,
  italic = false
) {
  if (typeof document === "undefined" || !needsBrowserUnicodeFont(text)) return null;
  const scale = 3;
  const fontSize = Math.max(1, Math.round(size * scale));
  const canvas = document.createElement("canvas");
  const measure = canvas.getContext("2d");
  if (!measure) throw new Error("Canvas is unavailable");
  measure.font = `${italic ? "italic " : ""}600 ${fontSize}px system-ui, sans-serif`;
  const metrics = measure.measureText(text);
  const pad = Math.ceil(fontSize * 0.35);
  canvas.width = Math.max(1, Math.ceil(metrics.width + pad * 2));
  canvas.height = Math.max(1, Math.ceil(fontSize * 1.6));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  ctx.font = measure.font;
  ctx.textBaseline = "middle";
  const alpha = Math.min(1, Math.max(0, opacity));
  ctx.fillStyle = `rgba(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(
    color[2] * 255
  )}, ${alpha})`;
  ctx.fillText(text, pad, canvas.height / 2);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Text rendering failed"))), "image/png")
  );
  const image = await doc.embedPng(new Uint8Array(await blob.arrayBuffer()));
  return { image, width: canvas.width / scale, height: canvas.height / scale };
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
  await assertNotEncrypted(buf);
  const src = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  const indices = parsePageRange(range, src.getPageCount());
  if (!indices.length) throw new Error("No valid pages in range");
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

export async function organizePdf(
  buf: PdfInput,
  order: number[],
  rotations: Record<number, number>,
  deleted: Set<number>
): Promise<Uint8Array> {
  await assertNotEncrypted(buf);
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const kept = order.filter((i) => !deleted.has(i));
  if (!kept.length) throw new Error("Keep at least one page.");
  const srcPages = src.getPages();
  const pages = await out.copyPages(src, kept);
  pages.forEach((p, idx) => {
    const srcIndex = kept[idx];
    const extra = rotations[srcIndex] || 0;
    if (extra) {
      const existing = srcPages[srcIndex]?.getRotation().angle ?? 0;
      p.setRotation(degrees(((existing + extra) % 360 + 360) % 360));
    }
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
  await assertNotEncrypted(buf);
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  const font = needsBrowserUnicodeFont(text) ? null : await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const alpha = Math.min(1, Math.max(0.05, opacity));
  for (const page of pages) {
    const { width, height } = page.getSize();
    const size = position === "center" ? 36 : 12;
    const rendered = await embedBrowserText(doc, text, size, [0.4, 0.4, 0.4], alpha);
    if (rendered) {
      const x = (width - rendered.width) / 2;
      let y = height - rendered.height - 16;
      if (position === "footer") y = 12;
      if (position === "center") {
        const origin = rotatedDrawOrigin(width / 2, height / 2, rendered.width, rendered.height, -30);
        page.drawImage(rendered.image, {
          x: origin.x,
          y: origin.y,
          width: rendered.width,
          height: rendered.height,
          rotate: degrees(-30),
        });
        continue;
      }
      page.drawImage(rendered.image, { x, y, width: rendered.width, height: rendered.height });
      continue;
    }
    if (!font) throw new Error("PDF font is unavailable");
    const tw = font.widthOfTextAtSize(text, size);
    const x = (width - tw) / 2;
    let y = height - 28;
    if (position === "footer") y = 20;
    if (position === "center") {
      const origin = rotatedDrawOrigin(width / 2, height / 2, tw, size, -30);
      page.drawText(text, {
        x: origin.x,
        y: origin.y,
        size,
        font,
        color: rgb(0.4, 0.4, 0.4),
        opacity: alpha,
        rotate: degrees(-30),
      });
      continue;
    }
    page.drawText(text, {
      x,
      y,
      size,
      font,
      color: rgb(0.4, 0.4, 0.4),
      opacity: alpha,
    });
  }
  return doc.save();
}

/**
 * Draws opaque black boxes over the given regions. This is a VISUAL COVER
 * ONLY — it does not remove, rewrite, or touch the underlying text/image
 * objects in the page's content stream, which remain fully present and can
 * still be recovered (e.g. by selecting/copying "through" the box, deleting
 * the box in a PDF editor, or running text extraction). True redaction
 * would require parsing and rewriting each page's content stream to delete
 * the objects under the covered region, which pdf-lib does not support and
 * which this function intentionally does not attempt.
 *
 * Named `coverPdfContent` (not `redactPdf`) specifically so this limitation
 * is obvious from the call site, matching what the UI already discloses to
 * users (see messages/*.json → tools.pdf-redact.note). Do not rename this
 * back to "redact" without actually implementing content removal.
 */
export async function coverPdfContent(
  buf: PdfInput,
  boxes: Array<{ page: number; x: number; y: number; w: number; h: number }>
): Promise<Uint8Array> {
  await assertNotEncrypted(buf);
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  const pages = doc.getPages();
  let applied = 0;
  for (const box of boxes) {
    const page = pages[box.page];
    if (!page) continue;
    if (!(box.w > 0 && box.h > 0)) continue;
    page.drawRectangle({
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      color: rgb(0, 0, 0),
    });
    applied += 1;
  }
  if (!applied) throw new Error("Draw at least one cover box on a valid page.");
  return doc.save();
}

export async function getPdfPageCount(buf: PdfInput): Promise<number> {
  await assertNotEncrypted(buf);
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
  await assertNotEncrypted(buf);
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  const font = needsBrowserUnicodeFont(template) ? null : await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;
  const size = 10;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const text = formatPageLabel(start + i, start + total - 1, template);
    const rendered = await embedBrowserText(doc, text, size, [0.25, 0.25, 0.25]);
    const margin = 28;
    const header = position.startsWith("header");
    const y = header ? height - 22 : 16;
    if (rendered) {
      let x = (width - rendered.width) / 2;
      if (position.endsWith("left")) x = margin;
      if (position.endsWith("right")) x = Math.max(margin, width - rendered.width - margin);
      page.drawImage(rendered.image, { x, y, width: rendered.width, height: rendered.height });
      continue;
    }
    if (!font) throw new Error("PDF font is unavailable");
    const tw = font.widthOfTextAtSize(text, size);
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

export type ImagesToPdfOptions = {
  pageSize?: "image" | "a4";
  margin?: number;
};

const A4_PORTRAIT: [number, number] = [595.28, 841.89];

export async function imagesToPdf(
  images: EmbeddableImage[],
  opts: ImagesToPdfOptions = {}
): Promise<Uint8Array> {
  if (!images.length) throw new Error("No images");
  const doc = await PDFDocument.create();
  const pageSize = opts.pageSize ?? "image";
  const margin = Math.max(0, opts.margin ?? 24);

  for (const img of images) {
    const embedded =
      img.mime === "image/png" ? await doc.embedPng(img.bytes) : await doc.embedJpg(img.bytes);
    if (pageSize === "image") {
      const page = doc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      continue;
    }

    const [portraitWidth, portraitHeight] = A4_PORTRAIT;
    const [pageWidth, pageHeight] = embedded.width > embedded.height
      ? [portraitHeight, portraitWidth]
      : [portraitWidth, portraitHeight];
    const availableWidth = Math.max(1, pageWidth - margin * 2);
    const availableHeight = Math.max(1, pageHeight - margin * 2);
    const scale = Math.min(availableWidth / embedded.width, availableHeight / embedded.height, 1);
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    const page = doc.addPage([pageWidth, pageHeight]);
    page.drawImage(embedded, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    });
  }
  return doc.save();
}

export async function flattenPdfForms(
  buf: PdfInput
): Promise<{ bytes: Uint8Array; fieldCount: number }> {
  await assertNotEncrypted(buf);
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
  await assertNotEncrypted(buf);
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
  await assertNotEncrypted(buf);
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
  await assertNotEncrypted(buf);
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  const font = needsBrowserUnicodeFont(text) ? null : await doc.embedFont(StandardFonts.HelveticaOblique);
  const pages = doc.getPages();
  const targets =
    where === "all" ? pages : pages[Math.max(0, where - 1)] ? [pages[Math.max(0, where - 1)]] : [];
  if (!targets.length) throw new Error("Page not found");
  for (const page of targets) {
    const { width } = page.getSize();
    const size = 14;
    const rendered = await embedBrowserText(doc, text, size, [0.12, 0.12, 0.16], 1, true);
    if (rendered) {
      page.drawImage(rendered.image, {
        x: Math.max(28, width - rendered.width - 36),
        y: 20,
        width: rendered.width,
        height: rendered.height,
      });
      continue;
    }
    if (!font) throw new Error("PDF font is unavailable");
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
  await assertNotEncrypted(buf);
  const doc = await PDFDocument.load(asPdfBytes(buf), { ignoreEncryption: true });
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("");
  // The standard Info-dict fields above aren't the only place metadata can
  // live: reset the dates (they otherwise keep leaking the original
  // authoring time) and drop any XMP metadata stream, which can duplicate
  // author/title/timestamps outside the Info dict and survive the calls
  // above untouched. This is not a forensic wipe; other object streams can
  // still hold identifying data.
  const now = new Date();
  doc.setCreationDate(now);
  doc.setModificationDate(now);
  doc.catalog.delete(PDFName.of("Metadata"));
  return doc.save();
}
