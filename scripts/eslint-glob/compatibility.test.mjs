import { createRequire } from "node:module";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { globSync } from "./index.cjs";

const require = createRequire(import.meta.url);
const { getRootDirs } = require("@next/eslint-plugin-next/dist/utils/get-root-dirs");

it("keeps the Next lint plugin's exact and globbed directory behavior", () => {
  const root = mkdtempSync(join(tmpdir(), "kit-lint-glob-"));
  try {
    mkdirSync(join(root, "a/nested"), { recursive: true });
    mkdirSync(join(root, "b"));
    writeFileSync(join(root, "file.txt"), "file");
    const context = (rootDir) => ({ cwd: root, settings: { next: { rootDir } } });
    expect(getRootDirs(context(undefined))).toEqual([root]);
    expect(getRootDirs(context(root))).toEqual([root]);
    expect(getRootDirs(context(`${root}/*`)).sort()).toEqual([join(root, "a"), join(root, "b")]);
    expect(getRootDirs(context([`${root}/a`, `${root}/b`])).sort()).toEqual([join(root, "a"), join(root, "b")]);
    expect(globSync("*/", { cwd: root, onlyDirectories: true }).sort()).toEqual(["a", "b"]);
    expect(getRootDirs(context(process.cwd()))).toEqual([process.cwd()]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

it("rejects oversized or deeply recursive configuration patterns", () => {
  expect(() => globSync("{".repeat(50), {})).toThrow(RangeError);
  expect(() => globSync("x".repeat(5000), {})).toThrow(RangeError);
});
