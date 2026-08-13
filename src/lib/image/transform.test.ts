import { describe, expect, it } from "vitest";
import { applyFilterPixels, flipPixels, rotatePixels, type PixelBuffer } from "./transform";

function px(r: number, g: number, b: number, a = 255): number[] {
  return [r, g, b, a];
}

function buf(width: number, height: number, pixels: number[][]): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  pixels.flat().forEach((v, i) => {
    data[i] = v;
  });
  return { data, width, height };
}

function colorAt(b: PixelBuffer, x: number, y: number) {
  const i = (y * b.width + x) * 4;
  return [b.data[i], b.data[i + 1], b.data[i + 2], b.data[i + 3]];
}

describe("rotatePixels / flipPixels", () => {
  it("rotates 90° clockwise (2×1 → 1×2)", () => {
    const src = buf(2, 1, [px(255, 0, 0), px(0, 0, 255)]);
    const out = rotatePixels(src, 90);
    expect(out.width).toBe(1);
    expect(out.height).toBe(2);
    expect(colorAt(out, 0, 0)).toEqual(px(255, 0, 0));
    expect(colorAt(out, 0, 1)).toEqual(px(0, 0, 255));
  });

  it("rotates 180°", () => {
    const src = buf(2, 1, [px(255, 0, 0), px(0, 0, 255)]);
    const out = rotatePixels(src, 180);
    expect(out.width).toBe(2);
    expect(colorAt(out, 0, 0)).toEqual(px(0, 0, 255));
    expect(colorAt(out, 1, 0)).toEqual(px(255, 0, 0));
  });

  it("flips horizontally and vertically", () => {
    const src = buf(2, 1, [px(255, 0, 0), px(0, 0, 255)]);
    const h = flipPixels(src, "h");
    expect(colorAt(h, 0, 0)).toEqual(px(0, 0, 255));
    expect(colorAt(h, 1, 0)).toEqual(px(255, 0, 0));
    const square = buf(1, 2, [px(1, 0, 0), px(0, 1, 0)]);
    const v = flipPixels(square, "v");
    expect(colorAt(v, 0, 0)).toEqual(px(0, 1, 0));
    expect(colorAt(v, 0, 1)).toEqual(px(1, 0, 0));
  });
});

describe("applyFilterPixels", () => {
  it("grayscale, invert, and sepia change pixels", () => {
    const src = buf(1, 1, [px(200, 10, 10)]);
    const gray = applyFilterPixels(src, "grayscale");
    expect(gray.data[0]).toBe(gray.data[1]);
    expect(gray.data[1]).toBe(gray.data[2]);
    const inv = applyFilterPixels(src, "invert");
    expect(inv.data[0]).toBe(55);
    expect(inv.data[1]).toBe(245);
    const sepia = applyFilterPixels(src, "sepia");
    expect(sepia.data[0]).toBeGreaterThan(sepia.data[2]);
  });
});
