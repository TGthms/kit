import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "../../../src/app/globals.css"), "utf8");
const floatingNav = readFileSync(join(here, "../ui/floating-nav.tsx"), "utf8");
const shell = readFileSync(join(here, "../layout/app-shell.tsx"), "utf8");
const tabBar = readFileSync(join(here, "../layout/tab-bar.tsx"), "utf8");
const pill = readFileSync(join(here, "../ui/gliding-pill.tsx"), "utf8");

/** The declaration block for an exact selector, so assertions cannot leak into a
 *  neighbouring rule that merely shares a prefix. */
function cssBlock(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`selector not found in globals.css: ${selector}`);
  return source.slice(start, source.indexOf("}", start) + 1);
}

describe("mobile PWA tab bar material", () => {
  it("uses a dedicated thinner fill and a stronger blur than other glass", () => {
    expect(css).toMatch(/--tabbar-blur:\s*52px/);
    expect(css).toMatch(/--tabbar-bg:\s*rgba\(255,\s*255,\s*255,\s*0\.48\)/);
    expect(css).toMatch(/blur\(var\(--tabbar-blur\)\)/);
    expect(floatingNav).not.toMatch(/glass-heavy/);
  });

  it("keeps the bar's own markup out of the shell", () => {
    expect(shell).toMatch(/from "\.\/tab-bar"/);
    expect(shell).toMatch(/<TabBar pathname=\{pathname\} \/>/);
    expect(shell).not.toMatch(/gliding-pill/);
  });

  it("springs the pill with a slight overshoot and pops the selected icon", () => {
    expect(css).toMatch(/--ease-tab-spring:\s*cubic-bezier\(0\.22,\s*1\.18,\s*0\.36,\s*1\)/);
    expect(css).toMatch(/gliding-pill-fast[\s\S]{0,180}ease-tab-spring/);
    expect(css).toMatch(/@keyframes tab-icon-spring/);
    expect(tabBar).toMatch(/tab-icon/);
    expect(tabBar).toMatch(/scrollActiveTabToTop/);
  });

  it("does not scale the tab hit target", () => {
    expect(tabBar).not.toMatch(/pressable-soft[^"]*scale-/);
  });

  it("hides the bar while the keyboard covers the bottom and removes it from focus", () => {
    expect(floatingNav).toMatch(/keyboardHidden/);
    expect(floatingNav).toMatch(/inert=\{keyboardHidden \|\| undefined\}/);
    expect(tabBar).toMatch(/tabIndex=\{keyboardHidden \? -1 : undefined\}/);
    expect(css).toMatch(/\.floating-nav\[data-keyboard\] \.floating-nav-shell/);
  });

  it("keeps the active pill visible through hydration", () => {
    expect(tabBar).toMatch(/fallbackIndex=\{Math\.max\(0, activeIndex\)\}/);
    expect(tabBar).toMatch(/fallbackCount=\{nav\.length\}/);
    expect(css).toMatch(/\.gliding-pill-fallback:not\(\[data-ready\]\)/);
    expect(css).toMatch(/\.gliding-pill:not\(\[data-hydrated\]\)/);
  });

  it("starts selection feedback before pathname changes", () => {
    expect(tabBar).toMatch(/pendingHref/);
    expect(tabBar).toMatch(/setPendingHref\(href\)/);
    expect(tabBar).toMatch(/selectedHref/);
    expect(tabBar).toMatch(/data-pop=\{selected && \(pending \|\| popHref === href\)/);
  });

  it("spends that early feedback on the route change that fulfils it", () => {
    // Without this the optimistic tab outlives the navigation, and going back
    // afterwards leaves the highlight on the tab that was left.
    expect(tabBar).toMatch(/setPendingHref\(null\)/);
  });

  it("measures before the first paint so the pill can animate immediately", () => {
    expect(pill).toMatch(/commit\(\);\n\s*const ro = new ResizeObserver\(scheduleUpdate\)/);
    expect(pill).toMatch(/window\.requestAnimationFrame\(commit\)/);
  });

  it("keeps the fallback geometry equal to the measured box", () => {
    expect(pill).toMatch(/container\.clientLeft \|\| 0/);
    expect(pill).toMatch(/container\.clientTop \|\| 0/);
    expect(css).toMatch(/--gliding-pill-inset:\s*0\.375rem/);
    expect(css).toMatch(/width: calc\(\(100% - 2 \* var\(--gliding-pill-inset\)\) \/ var\(--gliding-pill-count\)\)/);
  });

  it("moves the pill on the compositor instead of animating layout offsets", () => {
    const block = cssBlock(css, ".gliding-pill");
    expect(block).toMatch(/left: 0;/);
    expect(block).toMatch(/top: 0;/);
    expect(block).toMatch(/transition:\s*transform 0\.4s var\(--ease-glide\)/);
    expect(block).not.toMatch(/\bleft 0\.4s|\btop 0\.4s/);
    expect(pill).toMatch(/transform: pillTransform\(rect\)/);
  });

  it("expresses the fallback as the same transform the measured box produces", () => {
    const block = cssBlock(css, ".gliding-pill-fallback:not([data-ready])");
    expect(block).toMatch(/transform: translate3d\(/);
    expect(block).toMatch(/calc\(var\(--gliding-pill-inset\) \+ var\(--gliding-pill-index\) \* 100%\)/);
    // Both states must share one property, and neither may declare a layout offset.
    expect(block).not.toMatch(/\b(left|top):/);
  });

  it("marks navigation as client-ready after hydration", () => {
    expect(tabBar).toMatch(/useHydrated\(\)/);
    // An anchor already carries its navigation intent in `href`.
    expect(tabBar).not.toMatch(/data-navigation-intent/);
  });

  it("drops blur and spring when accessibility preferences ask", () => {
    expect(css).toMatch(/prefers-reduced-transparency: reduce[\s\S]*\.floating-nav-face/);
    expect(css).toMatch(/\.tab-icon\[data-pop\]\s*\{[\s\S]*animation:\s*none/);
  });

  it("sits 2px above the previous home-indicator inset", () => {
    expect(css).toMatch(/--floating-tabbar-offset:[^;]*\+ 2px/);
  });

  it("uses a stadium highlight that matches the bar ends", () => {
    expect(tabBar).toMatch(/gliding-pill-fast rounded-full/);
    expect(tabBar).toMatch(/absolute inset-0 rounded-full/);
    expect(tabBar).not.toMatch(/rounded-\[1\.5rem\]/);
  });
});
