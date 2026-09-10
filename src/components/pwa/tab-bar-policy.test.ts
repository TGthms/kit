import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "../../../src/app/globals.css"), "utf8");
const floatingNav = readFileSync(join(here, "../ui/floating-nav.tsx"), "utf8");
const shell = readFileSync(join(here, "../layout/app-shell.tsx"), "utf8");

describe("mobile PWA tab bar material", () => {
  it("uses a dedicated thinner fill and a stronger blur than other glass", () => {
    expect(css).toMatch(/--tabbar-blur:\s*52px/);
    expect(css).toMatch(/--tabbar-bg:\s*rgba\(255,\s*255,\s*255,\s*0\.48\)/);
    expect(css).toMatch(/blur\(var\(--tabbar-blur\)\)/);
    expect(floatingNav).not.toMatch(/glass-heavy/);
  });

  it("springs the pill with a slight overshoot and pops the selected icon", () => {
    expect(css).toMatch(/--ease-tab-spring:\s*cubic-bezier\(0\.22,\s*1\.18,\s*0\.36,\s*1\)/);
    expect(css).toMatch(/gliding-pill-fast[\s\S]{0,180}ease-tab-spring/);
    expect(css).toMatch(/@keyframes tab-icon-spring/);
    expect(shell).toMatch(/tab-icon/);
    expect(shell).toMatch(/scrollActiveTabToTop/);
  });

  it("does not scale the tab hit target", () => {
    expect(shell).not.toMatch(/pressable-soft[^"]*scale-/);
  });

  it("hides the bar while the keyboard covers the bottom and removes it from focus", () => {
    expect(floatingNav).toMatch(/keyboardHidden/);
    expect(floatingNav).toMatch(/inert=\{keyboardHidden \|\| undefined\}/);
    expect(shell).toMatch(/tabIndex=\{keyboardHidden \? -1 : undefined\}/);
    expect(css).toMatch(/\.floating-nav\[data-keyboard\] \.floating-nav-shell/);
  });

  it("keeps the active pill visible through hydration", () => {
    expect(shell).toMatch(/fallbackIndex=\{Math\.max\(0, activeIndex\)\}/);
    expect(shell).toMatch(/fallbackCount=\{nav\.length\}/);
    expect(css).toMatch(/\.gliding-pill-fallback:not\(\[data-ready\]\)/);
    expect(css).toMatch(/\.gliding-pill:not\(\[data-hydrated\]\)/);
  });

  it("marks navigation as client-ready after hydration", () => {
    expect(shell).toMatch(/useHydrated\(\)/);
    expect(shell).toMatch(/data-navigation-intent=\{hydrated \? "client" : undefined\}/);
  });

  it("drops blur and spring when accessibility preferences ask", () => {
    expect(css).toMatch(/prefers-reduced-transparency: reduce[\s\S]*\.floating-nav-face/);
    expect(css).toMatch(/\.tab-icon\[data-pop\]\s*\{[\s\S]*animation:\s*none/);
  });

  it("sits 2px above the previous home-indicator inset", () => {
    expect(css).toMatch(/--floating-tabbar-offset:[^;]*\+ 2px/);
  });

  it("uses a stadium highlight that matches the bar ends", () => {
    expect(shell).toMatch(/gliding-pill-fast rounded-full/);
    expect(shell).toMatch(/absolute inset-0 rounded-full/);
    expect(shell).not.toMatch(/rounded-\[1\.5rem\]/);
  });
});
