import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const sw = readFileSync(join(here, "../../../public/sw.js"), "utf8");
const register = readFileSync(join(here, "sw-register.tsx"), "utf8");
const schedule = readFileSync(join(here, "../../lib/pwa/sw-schedule.ts"), "utf8");

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
    expect(sw).toMatch(/kit-shell-v13/);
    expect(sw).toMatch(/kit-rsc-v13/);
    expect(sw).toMatch(/PRECACHE_LOCALE/);
    expect(sw).toMatch(/PRECACHE_PAUSE/);
    expect(sw).toMatch(/priority:\s*["']low["']/);
    expect(sw).toMatch(/js\|mjs\|css\|woff2\?\|wasm\|gz/);
  });

  it("only evicts caches that belong to Kit", () => {
    expect(sw).toMatch(/CACHE_PREFIX\s*=\s*["']kit-["']/);
    const activate = sw.slice(sw.indexOf('addEventListener("activate"'), sw.indexOf("function isIconOrManifest"));
    expect(activate).toMatch(/startsWith\(CACHE_PREFIX\)/);
    expect(activate).toMatch(/key !== CACHE && key !== RSC_CACHE/);
  });

  it("refuses document and Flight responses it cannot vouch for", () => {
    const head = sw.slice(0, sw.indexOf("async function asDirectResponse"));
    expect(head).toMatch(/TRUSTED_TYPES\s*=\s*new Set\(\[["']basic["'],\s*["']default["']\]\)/);
    expect(sw).toMatch(/function isUsableHtml\(res\)\s*\{\s*return Boolean\(res\) && res\.ok && TRUSTED_TYPES\.has\(res\.type\)/);
    expect(sw).toMatch(/function isUsableRsc\(res\)\s*\{\s*return Boolean\(res\) && res\.ok && TRUSTED_TYPES\.has\(res\.type\)/);
  });

  it("skips the other-language precache on a metered or slow connection", () => {
    const fill = sw.slice(sw.indexOf("async function startLocaleFill"), sw.indexOf("function isTrustedMessage"));
    const gatedAt = fill.indexOf("if (!skipHeavy)");
    expect(gatedAt).toBeGreaterThan(-1);
    /* The open locale is always filled; every other language sits behind the guard. */
    const always = fill.slice(0, gatedAt);
    expect(always).toMatch(/enqueueFill\(chrome\[locale\]/);
    expect(always).toMatch(/enqueueFill\(rsc\[locale\]/);
    const gated = fill.slice(gatedAt);
    expect(gated).toMatch(/enqueueFill\(urls\)/);
    expect(gated).toMatch(/manifest\.engines/);
    expect(gated).not.toMatch(/chrome\[locale\]/);
  });

  it("releases the offline download on every exit path", () => {
    const download = sw.slice(sw.indexOf("async function downloadSelectedOffline"), sw.indexOf("async function startLocaleFill"));
    const finallyAt = download.indexOf("} finally {");
    expect(finallyAt).toBeGreaterThan(-1);
    const release = download.slice(finallyAt);
    expect(release).toMatch(/offlineBusy = false/);
    /* The first progress report must sit inside the try, so a failed report
       cannot leave offlineBusy stuck true. */
    expect(download.indexOf('await flush("running", true)')).toBeLessThan(finallyAt);
    expect(download.indexOf("try {")).toBeLessThan(download.indexOf('await flush("running", true)'));
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
    expect(schedule).toMatch(/UPDATE_EVERY_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
    expect(schedule).toMatch(/UPDATE_AFTER_VISIBLE_MS\s*=\s*4000/);
    expect(register).toMatch(/shouldCheckForUpdate\(/);
    expect(register).toMatch(/UPDATE_AFTER_VISIBLE_MS/);
  });

  it("supports selected offline downloads with progress and cancellation", () => {
    expect(sw).toMatch(/OFFLINE_DOWNLOAD/);
    expect(sw).toMatch(/OFFLINE_CANCEL/);
    expect(sw).toMatch(/OFFLINE_PROGRESS/);
    expect(sw).toMatch(/selectedOfflineUrls/);
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
