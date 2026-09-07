import { describe, expect, it } from "vitest";
import { generateQrDataUrl, qrToPixels, readQrFromImageData } from "./qr";

describe("generateQrDataUrl", () => {
  it("produces a PNG data URL", async () => {
    const url = await generateQrDataUrl("https://kit.example");
    expect(url).toMatch(/^data:image\/png;base64,/);
  });

  it("rejects empty text", async () => {
    await expect(generateQrDataUrl("")).rejects.toThrow("Text is empty");
  });
});

describe("qr round-trip", () => {
  it("decodes its own rendered matrix", async () => {
    const text = "Hello, Kit! 123";
    const { data, width, height } = await qrToPixels(text);
    expect(width).toBe(height);
    expect(readQrFromImageData(data, width, height)).toBe(text);
  });

  it("decodes unicode text", async () => {
    const text = "你好 Kit";
    const { data, width, height } = await qrToPixels(text);
    expect(readQrFromImageData(data, width, height)).toBe(text);
  });
});
