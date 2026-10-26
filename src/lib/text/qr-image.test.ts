// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { readQrImage } from "./qr";
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("bounds the canvas for a high-resolution image and releases its bitmap even if allocation fails", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 16000, height: 12000, close }));
  let dimensions: number[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    dimensions = [this.width, this.height];
    return null;
  });
  await expect(readQrImage(new Blob())).rejects.toThrow(/2D canvas/);
  expect(dimensions[0] * dimensions[1]).toBeLessThanOrEqual(16_777_216);
  expect(close).toHaveBeenCalledOnce();
});
