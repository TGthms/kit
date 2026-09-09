import { describe, expect, it } from "vitest";
import { blobFromDataUrl, downloadRevokeDelayMs } from "./utils";

describe("blobFromDataUrl", () => {
  it("decodes a base64 PNG data URL without fetch", async () => {
    const blob = blobFromDataUrl("data:image/png;base64,QQ==");
    expect(blob.type).toBe("image/png");
    expect(await blob.text()).toBe("A");
  });

  it("rejects a non-data URL", () => {
    expect(() => blobFromDataUrl("https://example.com/qr.png")).toThrow(/Invalid data URL/);
  });
});

describe("downloadRevokeDelayMs", () => {
  it("keeps the Safari-safe base for small downloads", () => {
    expect(downloadRevokeDelayMs(0)).toBe(1_000);
    expect(downloadRevokeDelayMs(512 * 1024)).toBe(1_105);
  });

  it("gives large blobs more time to be consumed", () => {
    expect(downloadRevokeDelayMs(4 * 1024 * 1024)).toBe(1_000 + Math.ceil((4 * 1024 * 1024) / 5_000));
  });

  it("caps the wait at ten seconds", () => {
    expect(downloadRevokeDelayMs(200 * 1024 * 1024)).toBe(10_000);
    expect(downloadRevokeDelayMs(Number.MAX_SAFE_INTEGER)).toBe(10_000);
  });
});
