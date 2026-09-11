import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";

const here = dirname(fileURLToPath(import.meta.url));
const read = (relative: string) => readFileSync(join(here, relative), "utf8");

const sw = read("../../../public/sw.js");
const offlinePage = read("../../app/[locale]/settings/offline/page.tsx");
const settingsPage = read("../../app/[locale]/settings/page.tsx");
const offlineAccess = read("../settings/offline-access.tsx");
const appShell = read("../layout/app-shell.tsx");

describe("offline settings route", () => {
  it("stays a client page with no route-level metadata so static export can prerender it", () => {
    expect(offlinePage).toMatch(/^"use client";/);
    expect(offlinePage).not.toMatch(/generateMetadata/);
    expect(offlinePage).not.toMatch(/buildSectionMetadata/);
  });

  it("is reachable from Settings and renders the shared offline UI", () => {
    expect(settingsPage).toMatch(/href="\/settings\/offline"/);
    expect(offlinePage).toMatch(/OfflineAccess/);
    expect(offlinePage).toMatch(/backHref="\/settings"/);
  });

  it("keeps a single page heading instead of repeating the title", () => {
    expect(offlineAccess).not.toMatch(/<h2 className="type-title">/);
    expect(offlineAccess).toMatch(/<dt className="type-caption text-muted-foreground">/);
  });
});

describe("service worker offline selection", () => {
  it("resolves a tool id to its public route segment before matching", () => {
    expect(sw).toMatch(/const TOOL_PATH_SEGMENT = \{ "timezone-converter": "world-clock" \}/);
    expect(sw).toMatch(/function toolPathSegment\(toolId\)/);
    const fn = sw.slice(sw.indexOf("async function selectedOfflineUrls"), sw.indexOf("async function downloadSelectedOffline"));
    expect(fn).toMatch(/\.map\(toolPathSegment\)/);
    expect(fn).not.toMatch(/selectedTools\.has\(url\.split/);
  });

  it("gives a user-requested download priority over the background fill", () => {
    expect(sw).toMatch(/let offlineBusy = false/);
    expect(sw).toMatch(/while \(fillPaused \|\| offlineBusy\) await sleep\(400\)/);
    const fn = sw.slice(sw.indexOf("async function downloadSelectedOffline"), sw.indexOf("async function startLocaleFill"));
    expect(fn).toMatch(/offlineBusy = true/);
    expect(fn).toMatch(/offlineBusy = false/);
    expect(fn).toMatch(/if \(fillAbort\) fillAbort\.abort\(\)/);
  });

  it("batches progress instead of posting once per URL", () => {
    expect(sw).toMatch(/const OFFLINE_PROGRESS_MS = 250/);
    const fn = sw.slice(sw.indexOf("async function downloadSelectedOffline"), sw.indexOf("async function startLocaleFill"));
    expect(fn).toMatch(/const flush = async \(status, force\)/);
    expect(fn).toMatch(/now - lastSentAt < OFFLINE_PROGRESS_MS/);
    expect(fn).toMatch(/total: urls\.length, logs \}/);
    expect(fn).not.toMatch(/sendOfflineProgress\(\{ status: "running", done, total: urls\.length, log:/);
  });

  it("accepts batched logs and a single log line on the client", () => {
    expect(offlineAccess).toMatch(/function readLogs\(message: ProgressMessage\)/);
    expect(offlineAccess).toMatch(/Array\.isArray\(message\.logs\)/);
    expect(offlineAccess).toMatch(/typeof message\.log === "string"/);
  });
});

describe("offline indicator placement", () => {
  it("is a sibling of the brand link so it does not join its accessible name", () => {
    expect(appShell).toMatch(/<\/Link>\s*<OfflineIndicator \/>/);
    expect(appShell).not.toMatch(/\{tb\("name"\)\}<\/span>\s*<OfflineIndicator \/>/);
  });
});

describe("How Kit works offline copy", () => {
  it("describes the explicit offline preparation", () => {
    for (const key of ["whyOfflineBody", "exceptionOffline"] as const) {
      expect(en.how[key]).toMatch(/Offline access/);
    }
  });
});
