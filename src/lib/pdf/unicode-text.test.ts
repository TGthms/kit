import { afterEach, expect, it, vi } from "vitest";
import { PDFDocument } from "@cantoo/pdf-lib";
import { watermarkPdf, stampPdfSignature, numberPdfPages } from "./core";

afterEach(() => vi.unstubAllGlobals());

it("restores the Unicode font after canvas resize and produces readable PDF images", async () => {
  const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), (ch) => ch.charCodeAt(0));
  const fonts: string[] = [];
  const ctx = { font: "10px sans-serif", measureText: () => ({ width: 150 }), fillText: () => fonts.push(ctx.font) };
  const canvas = {
    set width(_: number) { ctx.font = "10px sans-serif"; },
    get width() { return 200; },
    set height(_: number) { ctx.font = "10px sans-serif"; },
    get height() { return 200; },
    getContext: () => ctx,
    toBlob: (done: (blob: Blob) => void) => done(new Blob([png], { type: "image/png" })),
  };
  vi.stubGlobal("document", { createElement: () => canvas });
  const pdf = await PDFDocument.create(); pdf.addPage([300, 200]);
  const input = await pdf.save();
  for (const output of [await watermarkPdf(input, "测试", "center", .5), await stampPdfSignature(input, "签名"), await numberPdfPages(input, { template: "第{page}页" })]) {
    expect((await PDFDocument.load(output)).getPageCount()).toBe(1);
  }
  expect(fonts).toEqual(["600 108px system-ui, sans-serif", "italic 600 42px system-ui, sans-serif", "600 30px system-ui, sans-serif"]);
});
