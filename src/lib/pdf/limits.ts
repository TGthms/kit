export const MAX_PDF_RASTER_PAGES = 200;

export type PdfPageBatch = {
  totalPages: number;
  processedPages: number;
  truncated: boolean;
};

export function pdfPageWindow(totalPages: number): PdfPageBatch {
  const total = Number.isFinite(totalPages) ? Math.max(0, Math.floor(totalPages)) : 0;
  const processedPages = Math.min(total, MAX_PDF_RASTER_PAGES);
  return {
    totalPages: total,
    processedPages,
    truncated: total > MAX_PDF_RASTER_PAGES,
  };
}

/** pdf.js viewports can be fractional; canvas buffers must be integers. */
export function integerCanvasSize(width: number, height: number): { width: number; height: number } {
  return {
    width: Math.max(1, Math.floor(width)),
    height: Math.max(1, Math.floor(height)),
  };
}
