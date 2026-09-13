import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { VENDOR_VERSION, withVendor } from "./base-path";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, "../../package.json"), "utf8")) as {
  dependencies: Record<string, string>;
};

describe("vendored engine versions", () => {
  it("matches the engine dependencies the vendor sync copies", () => {
    expect(VENDOR_VERSION).toContain(`pdfjs-${pkg.dependencies["pdfjs-dist"]}`);
    expect(VENDOR_VERSION).toContain(`ffmpeg-${pkg.dependencies["@ffmpeg/core"]}`);
  });

  it("versions engine files that are addressed by their full URL", () => {
    expect(withVendor("/vendor/pdfjs/pdf.worker.min.mjs")).toBe(
      `/vendor/pdfjs/pdf.worker.min.mjs?v=${VENDOR_VERSION}`
    );
    expect(withVendor("/vendor/ffmpeg/ffmpeg-core.wasm.gz")).toBe(
      `/vendor/ffmpeg/ffmpeg-core.wasm.gz?v=${VENDOR_VERSION}`
    );
  });
});
