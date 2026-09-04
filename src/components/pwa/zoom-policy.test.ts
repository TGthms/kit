import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "../../../src/app/globals.css"), "utf8");
const layout = readFileSync(join(here, "../../../src/app/layout.tsx"), "utf8");
const head = readFileSync(join(here, "../../../src/components/layout/document-head.tsx"), "utf8");
const boot = readFileSync(join(here, "../../../public/boot/viewport.js"), "utf8");

describe("PWA zoom policy", () => {
  it("does not lock pinch-zoom for every visitor in the Next viewport export", () => {
    const viewport = layout.slice(layout.indexOf("export const viewport"));
    expect(viewport).not.toMatch(/maximumScale:\s*1/);
    expect(viewport).not.toMatch(/userScalable:\s*false/);
  });

  it("locks page zoom only in the installed PWA boot script", () => {
    expect(head).toMatch(/boot\/viewport\.js/);
    expect(boot).toMatch(/display-mode:\s*standalone/);
    expect(boot).toMatch(/navigator\.standalone/);
    expect(boot).toMatch(/maximum-scale=1/);
    expect(boot).toMatch(/user-scalable=no/);
  });

  it("follows iOS Dynamic Type instead of pinch-zoom", () => {
    expect(css).toMatch(/font:\s*-apple-system-body/);
  });
});
