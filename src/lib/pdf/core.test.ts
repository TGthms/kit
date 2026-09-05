import { describe, expect, it } from "vitest";
import { PDFDocument, degrees } from "@cantoo/pdf-lib";
import {
  parsePageRange,
  formatPageLabel,
  numberPdfPages,
  flattenPdfForms,
  getPdfMetadata,
  setPdfMetadata,
  stripPdfMetadata,
  imagesToPdf,
  detectImageMime,
  splitPdf,
  organizePdf,
  watermarkPdf,
  stampPdfSignature,
  coverPdfContent,
  rotatedDrawOrigin,
} from "./core";
import { lockPdf, unlockPdf, isPdfEncrypted, inspectPdfReadability } from "./protect";
import { runSequentialBatch, stemmedName } from "@/lib/jobs/batch";

const TINY_PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0)
);

async function blankPdf(pages = 3): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]);
  return doc.save();
}

describe("parsePageRange", () => {
  it("parses lists and inclusive ranges, 1-based to 0-based", () => {
    expect(parsePageRange("1-3,5", 10)).toEqual([0, 1, 2, 4]);
    expect(parsePageRange(" 3 - 1 ", 5)).toEqual([0, 1, 2]);
    expect(parsePageRange("99", 3)).toEqual([]);
    expect(parsePageRange("2", 3)).toEqual([1]);
  });
});

describe("formatPageLabel", () => {
  it("substitutes page and pages tokens", () => {
    expect(formatPageLabel(2, 10, "{page} / {pages}")).toBe("2 / 10");
    expect(formatPageLabel(1, 1, "p.{page}")).toBe("p.1");
  });
});

describe("numberPdfPages", () => {
  it("keeps page count and produces a reloadable PDF", async () => {
    const src = await blankPdf(4);
    const numbered = await numberPdfPages(src, { template: "{page}/{pages}", position: "footer-center" });
    const doc = await PDFDocument.load(numbered);
    expect(doc.getPageCount()).toBe(4);
    expect(numbered.byteLength).toBeGreaterThan(src.byteLength);
  });
});

describe("splitPdf / page-range", () => {
  it("extracts the requested pages", async () => {
    const src = await blankPdf(5);
    const out = await splitPdf(src, "2-4");
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(3);
  });
});

describe("organizePdf", () => {
  it("keeps the requested page order while applying deletion", async () => {
    const src = await blankPdf(4);
    const out = await organizePdf(src, [3, 1, 0, 2], {}, new Set([1]));
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(3);
  });

  it("adds extra rotation onto the page's existing /Rotate", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    page.setRotation(degrees(90));
    const src = await doc.save();
    const out = await organizePdf(src, [0], { 0: 90 }, new Set());
    const next = await PDFDocument.load(out);
    expect(next.getPages()[0]?.getRotation().angle).toBe(180);
  });

  it("refuses to save a PDF with every page deleted", async () => {
    const src = await blankPdf(2);
    await expect(organizePdf(src, [0, 1], {}, new Set([0, 1]))).rejects.toThrow(/at least one page/i);
  });
});

describe("flattenPdfForms", () => {
  it("flattens form fields so they disappear", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 200]);
    const form = doc.getForm();
    const field = form.createTextField("fullName");
    field.setText("Kit");
    field.addToPage(page, { x: 40, y: 80, width: 160, height: 20 });
    const src = await doc.save();

    const before = await PDFDocument.load(src);
    expect(before.getForm().getFields()).toHaveLength(1);

    const { bytes, fieldCount } = await flattenPdfForms(src);
    expect(fieldCount).toBe(1);
    const after = await PDFDocument.load(bytes);
    expect(after.getForm().getFields()).toHaveLength(0);
  });
});

describe("PDF metadata", () => {
  it("writes, reads, and strips Info fields", async () => {
    const src = await blankPdf(1);
    const written = await setPdfMetadata(src, {
      title: "Field Notes",
      author: "Kit",
      subject: "Privacy",
      keywords: "pdf, meta",
      creator: "Kit tests",
      producer: "vitest",
    });
    const meta = await getPdfMetadata(written);
    expect(meta.title).toBe("Field Notes");
    expect(meta.author).toBe("Kit");
    expect(meta.subject).toBe("Privacy");
    expect(meta.keywords).toContain("pdf");
    expect(meta.creator).toBe("Kit tests");

    const stripped = await stripPdfMetadata(written);
    const empty = await getPdfMetadata(stripped);
    expect(empty.title).toBe("");
    expect(empty.author).toBe("");
    expect(empty.subject).toBe("");
    expect(empty.producer).toBe("");
  });
});

describe("rotatedDrawOrigin", () => {
  it("centers an unrotated box on (cx, cy)", () => {
    expect(rotatedDrawOrigin(100, 80, 40, 20, 0)).toEqual({ x: 80, y: 70 });
  });

  it("shifts origin so a 90° rotation stays centered", () => {
    const origin = rotatedDrawOrigin(100, 80, 40, 20, 90);
    expect(origin.x).toBeCloseTo(110);
    expect(origin.y).toBeCloseTo(60);
  });
});

describe("imagesToPdf", () => {
  it("embeds a PNG as a one-page PDF", async () => {
    expect(detectImageMime(TINY_PNG)).toBe("image/png");
    const pdf = await imagesToPdf([{ bytes: TINY_PNG, mime: "image/png" }]);
    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(1);
    const page = doc.getPages()[0];
    expect(page.getWidth()).toBe(1);
    expect(page.getHeight()).toBe(1);

    const fitted = await imagesToPdf([{ bytes: TINY_PNG, mime: "image/png" }], { pageSize: "a4", margin: 24 });
    const fittedDoc = await PDFDocument.load(fitted);
    expect(fittedDoc.getPages()[0]?.getWidth()).toBeCloseTo(595.28, 1);
    expect(fittedDoc.getPages()[0]?.getHeight()).toBeCloseTo(841.89, 1);
  });
});

describe("watermark batch", () => {
  it("watermarks each PDF in a sequential batch", async () => {
    const first = await blankPdf(1);
    const second = await blankPdf(2);
    const items = await runSequentialBatch([first, second], async (bytes, i) => {
      const out = await watermarkPdf(bytes, "DRAFT", "footer", 0.2);
      const doc = await PDFDocument.load(out);
      expect(doc.getPageCount()).toBe(i === 0 ? 1 : 2);
      const copy = new Uint8Array(out.byteLength);
      copy.set(out);
      return { blob: new Blob([copy]), name: stemmedName(`doc-${i}.pdf`, "-watermarked", "pdf") };
    });
    expect(items.map((x) => x.name)).toEqual(["doc-0-watermarked.pdf", "doc-1-watermarked.pdf"]);
  });
});

describe("stampPdfSignature", () => {
  it("stamps signed text and keeps the page count", async () => {
    const src = await blankPdf(2);
    const out = await stampPdfSignature(src, "Tim G", "all");
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    expect(out.byteLength).toBeGreaterThan(src.byteLength);
  });
});

describe("coverPdfContent", () => {
  it("draws a box and rejects an empty cover list", async () => {
    const src = await blankPdf(1);
    await expect(coverPdfContent(src, [])).rejects.toThrow(/cover box/i);
    const covered = await coverPdfContent(src, [{ page: 0, x: 10, y: 10, w: 40, h: 20 }]);
    const doc = await PDFDocument.load(covered);
    expect(doc.getPageCount()).toBe(1);
    expect(covered.byteLength).toBeGreaterThan(src.byteLength);
  });
});

describe("lock / unlock", () => {
  it("encrypts and decrypts with the user password", async () => {
    const src = await blankPdf(1);
    expect(await isPdfEncrypted(src)).toBe(false);
    const locked = await lockPdf(src, "correct-horse");
    expect(await isPdfEncrypted(locked)).toBe(true);
    const unlocked = await unlockPdf(locked, "correct-horse");
    const doc = await PDFDocument.load(unlocked);
    expect(doc.getPageCount()).toBe(1);
    expect(await isPdfEncrypted(unlocked)).toBe(false);
  });

  it("does not treat garbage bytes as an encrypted PDF", async () => {
    const junk = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(await inspectPdfReadability(junk)).toBe("unreadable");
    expect(await isPdfEncrypted(junk)).toBe(false);
  });
});
