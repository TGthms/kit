import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { aliasToolSegments, buildPrecacheManifest } from "../../../scripts/sw-precache.mjs";

type Manifest = {
  core: string[];
  engines: string[];
  chromeByLocale: Record<string, string[]>;
  toolsByLocale: Record<string, string[]>;
  rscByLocale: Record<string, string[]>;
  extrasByLocale: Record<string, string[]>;
};

const INDEXABLE = '<!DOCTYPE html><html><head><title>T</title></head><body></body></html>';
const ALIAS = '<!DOCTYPE html><html><head><meta name="robots" content="noindex, follow"/></head><body></body></html>';

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

    const manifest = buildPrecacheManifest(root) as Manifest;
    expect(manifest.core).toContain("/_next/static/chunks/app.js");
    expect(manifest.core).toContain("/boot/theme.js");
    expect(manifest.engines.some((url) => url.includes("ffmpeg-core.wasm.gz"))).toBe(true);
    expect(manifest.engines.some((url) => url.includes("pdf.worker.min.mjs"))).toBe(true);
    expect(manifest.chromeByLocale.en).toContain("/en/");
    expect(manifest.chromeByLocale.en).toContain("/en/how/");
    expect(manifest.chromeByLocale.en).toContain("/en/c/pdf/");
    expect(manifest.chromeByLocale.ar).toContain("/ar/settings/");
    expect(manifest.toolsByLocale.en).toContain("/en/tools/pdf-merge/");
    expect(manifest.rscByLocale.en).toContain("/en/index.txt");
    expect(manifest.rscByLocale.en).toContain("/en/how/index.txt");
    expect(manifest.rscByLocale.en).toContain("/en/tools/pdf-merge/index.txt");
    expect(manifest.toolsByLocale.ar ?? []).toEqual([]);
    expect(manifest.chromeByLocale["404"]).toBeUndefined();
    expect(manifest.chromeByLocale["_not-found"]).toBeUndefined();
    expect(Object.keys(manifest.chromeByLocale).sort()).toEqual(["ar", "en"]);
  });
});

describe("compatibility addresses", () => {
  const root = mkdtempSync(join(tmpdir(), "kit-precache-alias-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  for (const locale of ["en", "fr"]) {
    mkdirSync(join(root, locale), { recursive: true });
    writeFileSync(join(root, locale, "index.html"), INDEXABLE);
    for (const [segment, html] of [["real-tool", INDEXABLE], ["old-alias", ALIAS]] as const) {
      mkdirSync(join(root, locale, "tools", segment), { recursive: true });
      writeFileSync(join(root, locale, "tools", segment, "index.html"), html);
      writeFileSync(join(root, locale, "tools", segment, "index.txt"), "flight payload");
    }
  }

  it("is recognised from the page asking not to be indexed", () => {
    expect([...aliasToolSegments(root, ["en", "fr"])]).toEqual(["old-alias"]);
  });

  it("reads one language, since the set is the same everywhere", () => {
    const onlyFr = mkdtempSync(join(tmpdir(), "kit-precache-fr-"));
    try {
      mkdirSync(join(onlyFr, "fr/tools/old-alias"), { recursive: true });
      writeFileSync(join(onlyFr, "fr/tools/old-alias/index.html"), ALIAS);
      mkdirSync(join(onlyFr, "fr/tools/real-tool"), { recursive: true });
      writeFileSync(join(onlyFr, "fr/tools/real-tool/index.html"), INDEXABLE);
      expect([...aliasToolSegments(onlyFr, ["fr"])]).toEqual(["old-alias"]);
    } finally {
      rmSync(onlyFr, { recursive: true, force: true });
    }
  });

  it("finds none when there is no export to read", () => {
    expect(aliasToolSegments(join(root, "nope"), ["en"]).size).toBe(0);
  });

  const manifest = buildPrecacheManifest(root, "") as Manifest;

  it("are left out of the lists that decide a language is ready", () => {
    // Offline access cannot offer them, so counting them would leave every
    // language permanently incomplete.
    expect(manifest.toolsByLocale.en).toEqual(["/en/tools/real-tool/"]);
    expect(manifest.rscByLocale.en.join()).not.toContain("old-alias");
  });

  it("are prefetched all the same, page and payload", () => {
    expect(manifest.extrasByLocale.en).toEqual([
      "/en/tools/old-alias/",
      "/en/tools/old-alias/index.txt",
    ]);
  });

  it("carry the base path like every other list", () => {
    const based = buildPrecacheManifest(root, "/kit") as Manifest;
    expect(based.toolsByLocale.en).toEqual(["/kit/en/tools/real-tool/"]);
    expect(based.extrasByLocale.en[0]).toBe("/kit/en/tools/old-alias/");
  });
});
