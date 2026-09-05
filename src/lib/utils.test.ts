import { describe, expect, it } from "vitest";
import { blobFromDataUrl } from "./utils";

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
