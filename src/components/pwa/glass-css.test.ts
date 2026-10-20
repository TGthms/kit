import { readFileSync } from "node:fs";
import { transform, browserslistToTargets } from "lightningcss";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
// Run the real optimizer: source-text checks missed the vendor-only output.
const optimized = transform({
  filename: "globals.css",
  code: Buffer.from(source.replace('@import "tailwindcss";', "")),
  minify: true,
  targets: browserslistToTargets(["Chrome 111", "Safari 16.4", "Firefox 128"]),
}).code.toString();

describe("production glass CSS", () => {
  it("preserves both Safari and standard backdrop filters through minification", () => {
    expect(optimized).toContain("-webkit-backdrop-filter:blur(var(--tabbar-blur))");
    expect(optimized).toMatch(/@supports\s*\(backdrop-filter:blur\(1px\)\).*?\.floating-nav-face\{backdrop-filter:blur\(var\(--tabbar-blur\)\)/);
  });

  it("disables both blur forms for reduced transparency", () => {
    const reduced = optimized.slice(optimized.indexOf("@media (prefers-reduced-transparency:reduce)"));
    expect(reduced).toContain("-webkit-backdrop-filter:none");
    expect(reduced).toContain("backdrop-filter:none");
  });
});
