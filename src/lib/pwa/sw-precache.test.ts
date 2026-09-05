import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPrecacheManifest } from "../../../scripts/sw-precache.mjs";

describe("sw-precache manifest", () => {
  it("lists core assets, chrome for every locale, and tools only under that locale", () => {
    const root = mkdtempSync(join(tmpdir(), "kit-precache-"));
    mkdirSync(join(root, "_next/static/chunks"), { recursive: true });
    writeFileSync(join(root, "_next/static/chunks/app.js"), "js");
    mkdirSync(join(root, "boot"), { recursive: true });
    writeFileSync(join(root, "boot/theme.js"), "js");
    mkdirSync(join(root, "vendor/ffmpeg"), { recursive: true });
    writeFileSync(join(root, "vendor/ffmpeg/ffmpeg-core.wasm.gz"), "gz");
    mkdirSync(join(root, "vendor/pdfjs"), { recursive: true });
    writeFileSync(join(root, "vendor/pdfjs/pdf.worker.min.mjs"), "mjs");
    mkdirSync(join(root, "en/tools/pdf-merge"), { recursive: true });
    mkdirSync(join(root, "en/c/pdf"), { recursive: true });
    writeFileSync(join(root, "en/index.html"), "<html>");
    writeFileSync(join(root, "en/tools/pdf-merge/index.html"), "<html>");
    writeFileSync(join(root, "en/c/pdf/index.html"), "<html>");
    mkdirSync(join(root, "ar"), { recursive: true });
    writeFileSync(join(root, "ar/index.html"), "<html>");
    mkdirSync(join(root, "404"), { recursive: true });
    writeFileSync(join(root, "404/index.html"), "<html>");
    mkdirSync(join(root, "_not-found"), { recursive: true });
    writeFileSync(join(root, "_not-found/index.html"), "<html>");

    const manifest = buildPrecacheManifest(root) as {
      core: string[];
      engines: string[];
      chromeByLocale: Record<string, string[]>;
      toolsByLocale: Record<string, string[]>;
    };
    expect(manifest.core).toContain("/_next/static/chunks/app.js");
    expect(manifest.core).toContain("/boot/theme.js");
    expect(manifest.engines.some((url) => url.includes("ffmpeg-core.wasm.gz"))).toBe(true);
    expect(manifest.engines.some((url) => url.includes("pdf.worker.min.mjs"))).toBe(true);
    expect(manifest.chromeByLocale.en).toContain("/en/");
    expect(manifest.chromeByLocale.en).toContain("/en/how/");
    expect(manifest.chromeByLocale.en).toContain("/en/c/pdf/");
    expect(manifest.chromeByLocale.ar).toContain("/ar/settings/");
    expect(manifest.toolsByLocale.en).toContain("/en/tools/pdf-merge/");
    expect(manifest.toolsByLocale.ar ?? []).toEqual([]);
    expect(manifest.chromeByLocale["404"]).toBeUndefined();
    expect(manifest.chromeByLocale["_not-found"]).toBeUndefined();
    expect(Object.keys(manifest.chromeByLocale).sort()).toEqual(["ar", "en"]);
  });
});
