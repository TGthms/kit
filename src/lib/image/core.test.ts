import { describe, expect, it } from "vitest";
import {
  canvasOutputMime,
  clampImageSize,
  compressOutputMime,
  MAX_IMAGE_CANVAS_EDGE,
  MAX_IMAGE_CANVAS_PIXELS,
} from "./core";

describe("clampImageSize", () => {
  it("leaves small images alone", () => {
    expect(clampImageSize(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("caps a long edge at 8192", () => {
    const out = clampImageSize(16384, 100);
    expect(out.width).toBe(MAX_IMAGE_CANVAS_EDGE);
    expect(out.height).toBe(50);
  });

  it("caps total pixels at 16,777,216", () => {
    const out = clampImageSize(8000, 8000);
    expect(out.width * out.height).toBeLessThanOrEqual(MAX_IMAGE_CANVAS_PIXELS);
    expect(out.width).toBeLessThanOrEqual(MAX_IMAGE_CANVAS_EDGE);
  });
});

describe("canvasOutputMime", () => {
  it("keeps JPEG, PNG, and WebP", () => {
    expect(canvasOutputMime("image/jpeg")).toBe("image/jpeg");
    expect(canvasOutputMime("image/png")).toBe("image/png");
    expect(canvasOutputMime("image/webp; charset=binary")).toBe("image/webp");
  });

  it("maps GIF and BMP onto types canvas can encode", () => {
    expect(canvasOutputMime("image/gif")).toBe("image/png");
    expect(canvasOutputMime("image/bmp")).toBe("image/png");
    expect(canvasOutputMime("")).toBe("image/png");
  });

  it("does not change compress’s JPEG default for photos", () => {
    expect(compressOutputMime("image/gif")).toBe("image/png");
    expect(compressOutputMime("image/bmp")).toBe("image/jpeg");
  });
});
