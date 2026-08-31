import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "../../../src/app/globals.css"), "utf8");
const press = readFileSync(join(here, "../layout/press-feedback.tsx"), "utf8");
const button = readFileSync(join(here, "../ui/button.tsx"), "utf8");

describe("first-tap press policy", () => {
  it("does not scale pressable targets (iOS drops the click when the hit box shrinks)", () => {
    expect(css).not.toMatch(/\[data-pressed\][^{]*\{[^}]*transform:\s*scale/);
    expect(css).not.toMatch(/\.pressable:active\s*\{[^}]*transform:\s*scale/);
    expect(button).not.toMatch(/active:scale-/);
    expect(press).toMatch(/Do not scale the target/);
  });

  it("limits :hover styles to devices that can hover", () => {
    expect(css).toMatch(/@custom-variant hover/);
    expect(css).toMatch(/@media \(hover:\s*hover\)/);
  });
});
