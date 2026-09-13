import { describe, expect, it } from "vitest";
import { blobFromDataUrl, downloadRevokeDelayMs, uniqueArchiveNames } from "./utils";

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

describe("uniqueArchiveNames", () => {
  it("keeps every file when two inputs share a name", () => {
    expect(uniqueArchiveNames(["photo.jpg", "photo.jpg", "photo.jpg"])).toEqual([
      "photo.jpg",
      "photo (2).jpg",
      "photo (3).jpg",
    ]);
  });

  it("does not collide with a name that already ends in a counter", () => {
    expect(uniqueArchiveNames(["a.jpg", "a (2).jpg", "a.jpg"])).toEqual(["a.jpg", "a (2).jpg", "a (3).jpg"]);
  });

  it("keeps every entry inside the archive", () => {
    expect(uniqueArchiveNames(["../escape.jpg"])).toEqual(["escape.jpg"]);
    expect(uniqueArchiveNames(["a/b/c.png"])).toEqual(["a-b-c.png"]);
    expect(uniqueArchiveNames([".hidden"])).toEqual(["hidden"]);
    expect(uniqueArchiveNames([""])).toEqual(["file"]);
  });
});
