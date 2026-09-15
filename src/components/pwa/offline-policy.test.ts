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
const navigationGuard = read("../layout/navigation-guard.tsx");

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

describe("what is saved", () => {
  it("reports the state from the cache keys rather than by probing each address", () => {
    expect(sw).toMatch(/async function cachedPathnames\(\)/);
    expect(sw).toMatch(/\(await caches\.open\(name\)\)\.keys\(\)/);
    expect(sw).toMatch(/async function offlineState\(\)/);
    expect(sw).toMatch(/function countPresent\(urls, present\)/);
    // A generation the page can compare against, so it can tell when a build
    // has replaced what was saved.
    expect(sw).toMatch(/generation: GENERATION/);
  });

  it("counts a language as ready only when its pages and payloads are all there", () => {
    const fn = sw.slice(sw.indexOf("async function offlineState"), sw.indexOf("async function removeOffline"));
    expect(fn).toMatch(/const pages = \[\.\.\.\(chrome\[locale\] \|\| \[\]\), \.\.\.\(toolsByLocale\[locale\] \|\| \[\]\)\]/);
    expect(fn).toMatch(/const done = countPresent\(pages, shell\) \+ countPresent\(payloads, rsc\)/);
    expect(fn).toMatch(/ready: total > 0 && done === total/);
    /* Compatibility addresses for old links are prefetched but never counted:
       Offline access cannot offer them, so counting them would leave every
       language permanently incomplete. */
    expect(fn).not.toMatch(/extrasByLocale/);
  });

  it("prefetches the compatibility addresses without promising them", () => {
    const fill = sw.slice(sw.indexOf("async function startLocaleFill"), sw.indexOf("function isTrustedMessage"));
    expect(fill).toMatch(/enqueueFill\(\(manifest\.extrasByLocale && manifest\.extrasByLocale\[locale\]\) \|\| \[\]\)/);
  });

  it("keeps the resource list on the device so the report works offline", () => {
    expect(sw).toMatch(/await cache\.add\(FILL_PRECACHE\)/);
    const read = sw.slice(sw.indexOf("async function readManifest"), sw.indexOf("async function cachedPathnames"));
    expect(read).toMatch(/await cache\.match\(FILL_PRECACHE\)/);
    expect(read).toMatch(/fetch\(FILL_PRECACHE, \{ cache: "no-store" \}\)/);
    /* Read out of this build's own cache. Matching across all of them could
       answer with another generation's list, which names content that is not
       here — the report would then count it as saved. */
    expect(read).toMatch(/caches\.open\(CACHE\)/);
    expect(read).not.toMatch(/^\s*const cached = await caches\.match\(/mu);
  });

  it("sends the report on its own message type so it cannot be read as progress", () => {
    expect(sw).toMatch(/async function sendOfflineState\(state\)/);
    expect(sw).toMatch(/postMessage\(\{ type: "OFFLINE_STATE", state \}\)/);
    expect(sw).not.toMatch(/sendOfflineProgress\(\{ status: "status"/);
  });

  it("answers a status request and reports again once a download finishes", () => {
    expect(sw).toMatch(/if \(data\.type === "OFFLINE_STATUS"\)/);
    const download = sw.slice(sw.indexOf("async function downloadSelectedOffline"), sw.indexOf("async function startLocaleFill"));
    expect(download).toMatch(/const state = await offlineState\(\);\n\s*if \(state\) await sendOfflineState\(state\)/);
  });
});

describe("removing downloads", () => {
  const fn = () =>
    sw.slice(sw.indexOf("async function removeOffline"), sw.indexOf("async function selectedOfflineUrls"));

  it("takes one scope for the whole chosen set, and only from Kit's own caches", () => {
    expect(sw).toMatch(/async function removeOffline\(scope\)/);
    expect(sw).toMatch(/if \(data\.type === "OFFLINE_REMOVE"\)/);
    expect(fn()).toMatch(/if \(scope\.all\)/);
    expect(fn()).toMatch(/for \(const locale of scope\.locales \|\| \[\]\) addLocale\(locale\)/);
    expect(fn()).toMatch(/for \(const tool of scope\.tools \|\| \[\]\) addTool\(tool\)/);
    expect(fn()).toMatch(/await caches\.open\(CACHE\)/);
    expect(fn()).toMatch(/await caches\.open\(RSC_CACHE\)/);
  });

  it("reads a message as a selection, never as a request for everything", () => {
    const handler = sw.slice(
      sw.indexOf('if (data.type === "OFFLINE_REMOVE")'),
      sw.indexOf('if (data.type === "OFFLINE_DOWNLOAD")')
    );
    expect(handler).toMatch(/all: data\.all === true/);
    expect(handler).toMatch(/engines: data\.engines === true/);
    // Bounded like every other message the worker accepts.
    expect(handler).toMatch(/\.slice\(0, MAX_OFFLINE_LOCALES\)/);
    expect(handler).toMatch(/\.slice\(0, MAX_OFFLINE_TOOLS\)/);
  });

  it("leaves the application's own files alone", () => {
    // The shell's scripts, styles and icons are the app itself, not something
    // chosen on the Offline access page.
    expect(fn()).not.toMatch(/manifest\.core/);
  });

  it("can drop the media engines without the pages that use them", () => {
    expect(fn()).toMatch(
      /if \(scope\.engines\) for \(const url of manifest\.engines \|\| \[\]\) targets\.add\(url\)/
    );
  });

  it("takes both the page and its payload for a removed tool", () => {
    const tool = sw.slice(sw.indexOf("const addTool = (tool)"), sw.indexOf("if (scope.all)"));
    expect(tool).toMatch(/targets\.add\(url\)/);
    expect(tool).toMatch(/targets\.add\(`\$\{url\}index\.txt`\)/);
  });

  it("resolves a tool id to its route segment before removing it", () => {
    /* The two differ for a tool that was renamed, so the id has to be resolved
       before it can be matched against a stored address. */
    const tool = sw.slice(sw.indexOf("const addTool = (tool)"), sw.indexOf("if (scope.all)"));
    expect(tool).toMatch(/const segment = toolPathSegment\(tool\)/);
    expect(tool).toMatch(/segmentOfToolUrl\(url\) !== segment/);
    expect(tool).not.toMatch(/segmentOfToolUrl\(url\) !== tool/);
  });

  it("takes a language's compatibility addresses with it", () => {
    const addLocale = sw.slice(sw.indexOf("const addLocale = (locale)"), sw.indexOf("const addTool = (tool)"));
    expect(addLocale).toMatch(/for \(const url of extrasByLocale\[locale\] \|\| \[\]\) targets\.add\(url\)/);
  });

  it("leaves nothing behind when everything is removed", () => {
    // A compatibility language owns addresses but is not one of the counted
    // languages, so removing everything has to reach it separately.
    expect(fn()).toMatch(/for \(const locale of Object\.keys\(extrasByLocale\)\) addLocale\(locale\)/);
  });
});

describe("download concurrency", () => {
  it("fetches several at once only while the visitor is waiting", () => {
    expect(sw).toMatch(/const OFFLINE_CONCURRENCY = 6/);
    const download = sw.slice(sw.indexOf("async function downloadSelectedOffline"), sw.indexOf("async function startLocaleFill"));
    expect(download).toMatch(/const lanes = Math\.max\(1, Math\.min\(OFFLINE_CONCURRENCY, urls\.length\)\)/);
    expect(download).toMatch(/await Promise\.all\(Array\.from\(\{ length: lanes \}, takeNext\)\)/);
    expect(download).not.toMatch(/for \(const href of urls\)/);
  });

  it("leaves the background fill fetching one at a time", () => {
    const fill = sw.slice(sw.indexOf("async function pumpFill"), sw.indexOf("async function sendOfflineProgress"));
    expect(fill).toMatch(/const href = fillQueue\.shift\(\)/);
    expect(fill).not.toMatch(/Promise\.all/);
    expect(fill).not.toMatch(/OFFLINE_CONCURRENCY/);
  });

  it("runs the visitor's download ahead of the background fill", () => {
    const download = sw.slice(sw.indexOf("async function downloadSelectedOffline"), sw.indexOf("async function startLocaleFill"));
    expect(download).toMatch(/offlineBusy = true/);
    expect(download).toMatch(/if \(fillAbort\) fillAbort\.abort\(\)/);
  });
});

describe("offline page state", () => {
  it("asks the worker what is saved when the page opens", () => {
    expect(offlineAccess).toMatch(/postMessage\(\{ type: "OFFLINE_STATUS" \}\)/);
  });

  it("reads the record of what was downloaded from storage rather than copying it", () => {
    expect(offlineAccess).toMatch(/useSyncExternalStore\(subscribePlan, getPlanSnapshot, getPlanServerSnapshot\)/);
    expect(offlineAccess).not.toMatch(/setPlan\(loadPlan\(\)\)/);
  });

  it("records only a download that reported completion", () => {
    const handler = offlineAccess.slice(offlineAccess.indexOf('data.type === "OFFLINE_STATE"'));
    expect(handler).toMatch(/status === "done" && request\.current/);
    expect(handler).toMatch(/savePlan\(\{/);
  });

  it("forgets the record when the visitor removes everything", () => {
    expect(offlineAccess).toMatch(/clearPlan\(\)/);
    expect(offlineAccess).toMatch(/confirm\(t\("offlineRemoveConfirm"\)\)/);
  });

  it("gives every picker its own select-all and clear", () => {
    const languages = offlineAccess.slice(
      offlineAccess.indexOf('t("offlineLanguagesDesc")'),
      offlineAccess.indexOf('t("offlinePagesDesc")')
    );
    expect(languages).toMatch(/setSelectedLocales\(\[\.\.\.locales\]\)/);
    expect(languages).toMatch(/setSelectedLocales\(\[\]\)/);

    const pages = offlineAccess.slice(
      offlineAccess.indexOf('t("offlinePagesDesc")'),
      offlineAccess.indexOf('t("offlineToolsDesc")')
    );
    expect(pages).toMatch(/setSelectedPages\(\[\.\.\.APP_PAGE_IDS\]\)/);
    expect(pages).toMatch(/setSelectedPages\(\[\]\)/);

    const tools = offlineAccess.slice(offlineAccess.indexOf('t("offlineToolsDesc")'));
    expect(tools).toMatch(/setSelectedTools\(new Set\(tools\.map\(\(tool\) => tool\.id\)\)\)/);
    expect(tools).toMatch(/setSelectedTools\(new Set\(\)\)/);
  });

  it("starts every tool category closed rather than nine lists at once", () => {
    expect(offlineAccess).toMatch(/useState<Set<ToolCategory>>\(new Set\(\)\)/);
  });

  it("keeps the pickers free of any remove control", () => {
    // Choosing and removing are separate jobs: a row in either picker holds one
    // control, and removal lives in the menu below.
    expect(offlineAccess).not.toMatch(/aria-label=\{`\$\{tc\("remove"\)\}/);
    expect(offlineAccess).not.toMatch(/remove\(\{ mode:/);
  });

  it("gives removal its own menu, closed until asked for", () => {
    expect(offlineAccess).toMatch(/t\("offlineManage"\)/);
    expect(offlineAccess).toMatch(/aria-expanded=\{manageOpen\}/);
    expect(offlineAccess).toMatch(/aria-controls=\{MANAGE_ID\}/);
    // The menu describes the device, so it lists what is saved, not everything
    // the app offers.
    expect(offlineAccess).toMatch(/const savedLocaleList = useMemo\(\(\) => locales\.filter/);
    expect(offlineAccess).toMatch(/const savedToolList = useMemo\(\(\) => tools\.filter/);
  });

  it("takes the whole ticked set in one message, and offers everything at once", () => {
    expect(offlineAccess).toMatch(/type: "OFFLINE_REMOVE",\n\s*locales: removalLocales,/);
    expect(offlineAccess).toMatch(/\{t\("offlineRemoveSelected"\)\}/);
    expect(offlineAccess).toMatch(/\{removalCount \? \(/);
    expect(offlineAccess).toMatch(/postMessage\(\{ type: "OFFLINE_REMOVE", all: true \}\)/);
  });

  it("waits for the worker's report instead of claiming nothing is saved", () => {
    expect(offlineAccess).toMatch(/const waitingForReport = !hydrated \|\| !reportLoaded/);
    expect(offlineAccess).toMatch(/\{waitingForReport \? \(/);
    /* The worker answers even when it has nothing to report, so the page can
       tell "there is nothing here" apart from "no answer yet". */
    expect(sw).toMatch(/await sendOfflineState\(await offlineState\(\)\)/);
    // And a worker that never answers must not leave the page waiting for ever.
    expect(offlineAccess).toMatch(/window\.setTimeout\(\(\) => setReportLoaded\(true\), STATUS_WAIT_MS\)/);
  });

  it("shows a wait rather than a figure it has not measured, and never the selection", () => {
    expect(offlineAccess).toMatch(/function Figure\(\{ label, value, waiting \}/);
    expect(offlineAccess).toMatch(/\{value \?\? <Waiting label=\{waiting\} \/>\}/);
    expect(offlineAccess).toMatch(/const waitingForStorage = !hydrated \|\| \(canEstimateStorage && !storageRead\)/);
    const card = offlineAccess.slice(
      offlineAccess.indexOf("<Figure"),
      offlineAccess.indexOf('{planState === "saved"')
    );
    // Four figures, each of which waits for its own source.
    expect(card.match(/<Figure /g)).toHaveLength(4);
    /* Every figure describes the device. The selection belongs to the pickers,
       so a figure is never a selection count. */
    expect(card).not.toMatch(/selectedLocales\.length/);
    expect(card).not.toMatch(/selectedTools\.size/);
  });

  it("reports saved content that belongs to an earlier release and re-runs that selection", () => {
    expect(offlineAccess).toMatch(/planState === "stale" \|\| planState === "cleared"/);
    expect(offlineAccess).toMatch(/t\("offlineOutdated", \{ version: APP_VERSION \}\)/);
    expect(offlineAccess).toMatch(/t\("offlineCleared"\)/);
    expect(offlineAccess).toMatch(/t\("offlineStoredVersion", \{ version: plan\.version \}\)/);
  });
});

describe("the app's own pages", () => {
  it("are offered like anything else that can be downloaded, one row each", () => {
    expect(offlineAccess).toMatch(/APP_PAGES\.map\(\(page\) =>/);
    expect(offlineAccess).toMatch(/t\("offlinePages"\)/);
    expect(offlineAccess).toMatch(/t\("offlinePagesDesc"\)/);
    /* Every one of them starts ticked: Kit cannot open with no connection
       without them, and the page that manages all of this is one of them. */
    expect(offlineAccess).toMatch(/useState<AppPageId\[\]>\(\[\.\.\.APP_PAGE_IDS\]\)/);
  });

  it("carry the selection through the download and into the record", () => {
    expect(offlineAccess).toMatch(/pages: selectedPages, engines \}/);
    expect(offlineAccess).toMatch(/pages: request\.current\.pages,/);
    expect(offlineAccess).toMatch(/setSelectedPages\(plan\.pages\)/);
    // A download with no tools at all is a legitimate one, so tools are not
    // required — but something has to be asked for.
    expect(offlineAccess).toMatch(/\(!selection\.tools\.length && !selection\.pages\.length\)/);
  });

  it("are resolved by id from the manifest the build wrote", () => {
    const fn = sw.slice(
      sw.indexOf("async function selectedOfflineUrls"),
      sw.indexOf("async function downloadSelectedOffline")
    );
    expect(fn).toMatch(/const pagesByLocale = manifest\.pagesByLocale \|\| \{\}/);
    expect(fn).toMatch(/for \(const id of chosenPages\) for \(const url of offered\[id\] \|\| \[\]\) pages\.add\(url\)/);
    expect(fn).toMatch(/\.slice\(0, MAX_OFFLINE_PAGES\)/);
  });

  it("fetch the whole app for a message that predates the list, and nothing for an empty one", () => {
    const fn = sw.slice(
      sw.indexOf("async function selectedOfflineUrls"),
      sw.indexOf("async function downloadSelectedOffline")
    );
    /* The field is optional in one direction only: a message that never carried
       it was written before pages could be chosen, and asked for the whole app;
       an empty list is a visitor who un-ticked every page. */
    expect(fn).toMatch(/Array\.isArray\(data\.pages\)/);
    expect(fn).toMatch(/\? new Set\(/);
    expect(fn).toMatch(/: null;/);
  });

  it("go to the front of the background fill, which pauses while you read", () => {
    const fill = sw.slice(sw.indexOf("async function startLocaleFill"), sw.indexOf("function isTrustedMessage"));
    expect(fill.indexOf("enqueueFill(chrome[locale] || [])")).toBeGreaterThan(-1);
    expect(fill.indexOf("enqueueFill(chrome[locale] || [])")).toBeLessThan(
      fill.indexOf("enqueueFill(manifest.core || [])")
    );
  });
});

describe("navigating in the app with the network off", () => {
  it("stays a route change while the destination is held, and only reloads when it is not", () => {
    /* A document load is a reload: the tab bar loses its glide, the page
       flashes, and the tap feels like a different app. It is only worth it when
       there is nothing to route to. */
    expect(navigationGuard).toMatch(/isHeldOffline\(link\.href, window\.location\.origin\)/);
    expect(navigationGuard).toMatch(/if \(held\) router\.push\(next\)/);
    expect(navigationGuard).toMatch(/else window\.location\.assign\(next\)/);
    expect(navigationGuard).toMatch(/event\.preventDefault\(\)/);
  });

  it("needs both the page and the payload its route asks for", () => {
    expect(navigationGuard).toMatch(/const HANG_MS = 8000/);
    expect(navigationGuard).toMatch(/isRscDocumentPath\(window\.location\.pathname\)/);
  });
});

describe("How Kit works offline copy", () => {
  it("describes the explicit offline preparation", () => {
    for (const key of ["whyOfflineBody", "exceptionOffline"] as const) {
      expect(en.how[key]).toMatch(/Offline access/);
    }
  });
});
