import { describe, expect, it } from "vitest";
import {
  applyInverseViewportTransform,
  applyViewportTransform,
  canvasRectToPdfBox,
  pdfBoxToCanvasRect,
  type ViewportTransform,
} from "./viewport";

/** pdf.js unrotated page: Y-flip, origin at top-left of the canvas. */
const UNROTATED: ViewportTransform = [2, 0, 0, -2, 0, 200];

describe("viewport transform", () => {
  it("inverts a Y-flip scale matrix", () => {
    const canvas = applyViewportTransform(UNROTATED, 10, 20);
    expect(canvas).toEqual([20, 160]);
    expect(applyInverseViewportTransform(UNROTATED, canvas[0], canvas[1])).toEqual([10, 20]);
  });

  it("maps a canvas cover box into pdf-lib user space", () => {
    const box = canvasRectToPdfBox(UNROTATED, 20, 40, 60, 80);
    expect(box.x).toBeCloseTo(10);
    expect(box.y).toBeCloseTo(60);
    expect(box.w).toBeCloseTo(20);
    expect(box.h).toBeCloseTo(20);
    const back = pdfBoxToCanvasRect(UNROTATED, box);
    expect(back.x).toBeCloseTo(20);
    expect(back.y).toBeCloseTo(40);
    expect(back.w).toBeCloseTo(40);
    expect(back.h).toBeCloseTo(40);
  });

  it("keeps an AABB after a 90° viewport (swap axes)", () => {
    const rotated: ViewportTransform = [0, 1, 1, 0, 0, 0];
    const box = canvasRectToPdfBox(rotated, 0, 10, 40, 30);
    expect(box.x).toBeCloseTo(10);
    expect(box.y).toBeCloseTo(0);
    expect(box.w).toBeCloseTo(20);
    expect(box.h).toBeCloseTo(40);
  });
});
