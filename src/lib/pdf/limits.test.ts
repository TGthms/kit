import { describe, expect, it } from "vitest";
import { integerCanvasSize, MAX_PDF_RASTER_PAGES, pdfPageWindow } from "./limits";

describe("pdfPageWindow", () => {
  it("passes through documents at or under the cap", () => {
    expect(pdfPageWindow(3)).toEqual({ totalPages: 3, processedPages: 3, truncated: false });
    expect(pdfPageWindow(MAX_PDF_RASTER_PAGES)).toEqual({
      totalPages: MAX_PDF_RASTER_PAGES,
      processedPages: MAX_PDF_RASTER_PAGES,
      truncated: false,
    });
  });

  it("caps processing at 200 pages and flags truncation", () => {
    expect(pdfPageWindow(201)).toEqual({ totalPages: 201, processedPages: 200, truncated: true });
    expect(pdfPageWindow(1000).processedPages).toBe(MAX_PDF_RASTER_PAGES);
  });
});

describe("integerCanvasSize", () => {
  it("floors fractional pdf.js viewports", () => {
    expect(integerCanvasSize(412.7, 18.2)).toEqual({ width: 412, height: 18 });
    expect(integerCanvasSize(0.4, 0)).toEqual({ width: 1, height: 1 });
  });
});
