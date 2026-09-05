export type ViewportTransform = [number, number, number, number, number, number];

export type PdfBox = { x: number; y: number; w: number; h: number };

export function applyViewportTransform(transform: ViewportTransform, x: number, y: number): [number, number] {
  return [transform[0] * x + transform[2] * y + transform[4], transform[1] * x + transform[3] * y + transform[5]];
}

export function applyInverseViewportTransform(transform: ViewportTransform, x: number, y: number): [number, number] {
  const det = transform[0] * transform[3] - transform[1] * transform[2];
  return [
    (transform[3] * (x - transform[4]) - transform[2] * (y - transform[5])) / det,
    (transform[0] * (y - transform[5]) - transform[1] * (x - transform[4])) / det,
  ];
}

function aabb(points: ReadonlyArray<readonly [number, number]>): PdfBox {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

/** Canvas-pixel rectangle → pdf-lib user-space AABB (handles /Rotate via viewport.transform). */
export function canvasRectToPdfBox(transform: ViewportTransform, x1: number, y1: number, x2: number, y2: number): PdfBox {
  return aabb([
    applyInverseViewportTransform(transform, x1, y1),
    applyInverseViewportTransform(transform, x2, y1),
    applyInverseViewportTransform(transform, x1, y2),
    applyInverseViewportTransform(transform, x2, y2),
  ]);
}

/** pdf-lib user-space box → canvas-pixel AABB for the cover overlay. */
export function pdfBoxToCanvasRect(transform: ViewportTransform, box: PdfBox): PdfBox {
  return aabb([
    applyViewportTransform(transform, box.x, box.y),
    applyViewportTransform(transform, box.x + box.w, box.y),
    applyViewportTransform(transform, box.x, box.y + box.h),
    applyViewportTransform(transform, box.x + box.w, box.y + box.h),
  ]);
}
