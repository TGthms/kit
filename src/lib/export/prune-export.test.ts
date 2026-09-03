import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLOUDFLARE_PAGES_FREE_FILE_LIMIT,
  isSegmentPrefetchFile,
  pruneExportDir,
} from "../../../scripts/prune-export.mjs";

describe("isSegmentPrefetchFile", () => {
  it("matches Next.js 16 static-export segment files only", () => {
    expect(isSegmentPrefetchFile("__next._tree.txt")).toBe(true);
    expect(isSegmentPrefetchFile("__next._full.txt")).toBe(true);
    expect(isSegmentPrefetchFile("__next.$d$locale.tools.$d$toolId.__PAGE__.txt")).toBe(true);
    expect(isSegmentPrefetchFile("index.txt")).toBe(false);
    expect(isSegmentPrefetchFile("index.html")).toBe(false);
    expect(isSegmentPrefetchFile("robots.txt")).toBe(false);
  });
});

describe("pruneExportDir", () => {
  it("deletes __next.*.txt and keeps HTML plus index.txt", () => {
    const root = mkdtempSync(join(tmpdir(), "kit-prune-"));
    const tool = join(root, "en", "tools", "pdf-merge");
    mkdirSync(tool, { recursive: true });
    writeFileSync(join(tool, "index.html"), "<html></html>");
    writeFileSync(join(tool, "index.txt"), "rsc");
    writeFileSync(join(tool, "__next._tree.txt"), "tree");
    writeFileSync(join(tool, "__next._full.txt"), "full");
    writeFileSync(join(root, "robots.txt"), "User-agent: *");

    const result = pruneExportDir(root);
    expect(result.removed).toBe(2);
    expect(result.remaining).toBe(3);
    expect(existsSync(join(tool, "index.html"))).toBe(true);
    expect(existsSync(join(tool, "index.txt"))).toBe(true);
    expect(existsSync(join(tool, "__next._tree.txt"))).toBe(false);
    expect(existsSync(join(root, "robots.txt"))).toBe(true);
  });

  it("uses the Cloudflare Free file cap", () => {
    expect(CLOUDFLARE_PAGES_FREE_FILE_LIMIT).toBe(20_000);
  });
});
