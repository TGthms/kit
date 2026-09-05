import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const sw = readFileSync(join(here, "../../../public/sw.js"), "utf8");
const register = readFileSync(join(here, "sw-register.tsx"), "utf8");

describe("service worker update policy", () => {
  it("does not seize open tabs on install or activate", () => {
    expect(sw).not.toMatch(/skipWaiting\s*\(/);
    expect(sw).not.toMatch(/clients\.claim\s*\(/);
  });

  it("times out hung navigations instead of waiting forever", () => {
    expect(sw).toMatch(/NAV_FETCH_MS\s*=\s*8000/);
    expect(sw).toMatch(/NAV_CACHE_MS\s*=\s*400/);
    expect(sw).toMatch(/cachedNavigation\s*\(/);
  });

  it("never returns a redirected response for navigations", () => {
    expect(sw).not.toMatch(/Response\.redirect\s*\(/);
    expect(sw).toMatch(/async function asDirectResponse\s*\(/);
    expect(sw).toMatch(/res\.redirected\s*!==\s*true/);
    expect(sw).toMatch(/await res\.arrayBuffer\s*\(/);
  });

  it("does not serve last-home at the hung-nav cache timeout", () => {
    const navStart = sw.indexOf("async function navigateDocument");
    const navEnd = sw.indexOf("\nlet fillPaused");
    expect(navStart).toBeGreaterThan(-1);
    expect(navEnd).toBeGreaterThan(navStart);
    const navFn = sw.slice(navStart, navEnd);
    const cacheMsAt = navFn.indexOf(", NAV_CACHE_MS)");
    const cacheMsStart = navFn.lastIndexOf("setTimeout", cacheMsAt);
    const navCache = navFn.slice(cacheMsStart, cacheMsAt);
    expect(navCache).toMatch(/exactP/);
    expect(navCache).not.toMatch(/LAST_HOME/);
    expect(navCache).not.toMatch(/cachedNavigation\s*\(/);
    expect(navFn).toMatch(/cachedExactNavigation\s*\(/);
  });

  it("busts the shell cache when navigation policy changes", () => {
    expect(sw).toMatch(/kit-shell-v11/);
    expect(sw).toMatch(/kit-rsc-v11/);
    expect(sw).toMatch(/PRECACHE_LOCALE/);
    expect(sw).toMatch(/PRECACHE_PAUSE/);
    expect(sw).toMatch(/priority:\s*["']low["']/);
    expect(sw).toMatch(/js\|mjs\|css\|woff2\?\|wasm\|gz/);
  });

  it("serves Flight payloads from a separate cache, never as HTML", () => {
    expect(sw).toMatch(/async function respondRsc\s*\(/);
    expect(sw).toMatch(/isRscRequest\(req\)/);
    expect(sw).toMatch(/RSC_CACHE/);
    const rscFn = sw.slice(sw.indexOf("async function respondRsc"), sw.indexOf("\nlet fillPaused"));
    expect(rscFn).toMatch(/caches\.open\(RSC_CACHE\)/);
    expect(rscFn).not.toMatch(/caches\.open\(CACHE\)/);
  });

  it("does not reload the tab when the controller changes", () => {
    expect(register).not.toMatch(/addEventListener\(\s*["']controllerchange["']/);
    expect(register).not.toMatch(/location\.reload\s*\(/);
  });

  it("throttles update checks after the tab becomes visible", () => {
    expect(register).toMatch(/UPDATE_EVERY_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
    expect(register).toMatch(/UPDATE_AFTER_VISIBLE_MS/);
  });

  it("starts the idle fill only after first paint and pauses on interaction", () => {
    expect(register).toMatch(/FILL_AFTER_IDLE_MS/);
    expect(register).toMatch(/PRECACHE_PAUSE/);
    expect(register).toMatch(/PRECACHE_RESUME/);
    expect(register).toMatch(/PING/);
    expect(register).not.toMatch(/skipWaiting/);
  });

  it("does not seize a slow in-app click with a full document load", () => {
    const guard = readFileSync(join(here, "../layout/navigation-guard.tsx"), "utf8");
    expect(guard).toMatch(/HANG_MS\s*=\s*8000/);
    expect(guard).toMatch(/isRscDocumentPath/);
    const hangBlock = guard.slice(guard.indexOf("hangTimer = window.setTimeout"), guard.indexOf("document.addEventListener(\"click\""));
    expect(hangBlock).not.toMatch(/location\.assign/);
  });
});
