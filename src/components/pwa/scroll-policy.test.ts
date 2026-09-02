import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "../../../src/app/globals.css"), "utf8");

describe("PWA scroll bounce policy", () => {
  it("does not lock vertical overscroll on the document", () => {
    expect(css).not.toMatch(/overscroll-behavior:\s*none/);
    expect(css).not.toMatch(/overscroll-behavior-y:\s*none/);
  });
});
