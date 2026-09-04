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
    expect(sw).toMatch(/NAV_CACHE_MS\s*=\s*2500/);
    expect(sw).toMatch(/cachedNavigation\s*\(/);
  });

  it("never returns a redirected response for navigations", () => {
    expect(sw).not.toMatch(/Response\.redirect\s*\(/);
    expect(sw).toMatch(/function asDirectResponse\s*\(/);
    expect(sw).toMatch(/res\.redirected\s*!==\s*true/);
  });

  it("busts the shell cache when navigation policy changes", () => {
    expect(sw).toMatch(/kit-shell-v9/);
    expect(sw).toMatch(/PRECACHE_LOCALE/);
    expect(sw).toMatch(/PRECACHE_PAUSE/);
    expect(sw).toMatch(/priority:\s*["']low["']/);
    expect(sw).toMatch(/js\|mjs\|css\|woff2\?\|wasm\|gz/);
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
    expect(register).not.toMatch(/skipWaiting/);
  });
});
