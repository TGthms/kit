/* Kit service worker — app shell only; never caches user files.
 *
 * Two caches, kept apart on purpose:
 *   kit-shell-<build>  HTML documents, icons, scripts, styles and engines
 *   kit-rsc-<build>    React Flight payloads used for in-app navigation
 * Because Flight bodies live in their own cache, a `.txt` body can never be
 * painted as the page.
 *
 * `<build>` is a digest of the content this worker serves, written into the
 * exported copy of this file by `scripts/sw-precache.mjs`. Naming the caches
 * after the content keeps releases separate. An update prepares fresh caches
 * and preserves saved choices. A complete previous release remains available
 * until its replacement is verified; HTML, Flight and runtime files always
 * come from the same serving release. A small scope-specific metadata cache
 * records that choice and remembers removals across worker restarts.
 *
 * A new worker waits for existing tabs to close before taking over. Seizing
 * open tabs mid-navigation can orphan a navigate fetch and leave the page
 * stuck. Only a verified, explicitly requested offline update can activate
 * early, and only with a single open app window.
 *
 * Safari refuses a document response served by a worker if that response
 * followed HTTP redirects, so a redirect response, or a fetch result with
 * redirected === true, is never handed back as-is.
 *
 * Responses are only stored or served as documents when this worker can vouch
 * for them: they must be same-origin ("basic") or have been rebuilt here
 * ("default"). Cross-origin, opaque and opaque-redirect responses are refused,
 * so a URL that resolves off-origin can never supply the page.
 */
const BUILD = "__KIT_BUILD__";
/* Postbuild embeds the standalone root entry so a cold launch can paint
   before iOS opens Cache Storage. No page content or user data is embedded. */
const ENTRY_HTML = "__KIT_ENTRY_HTML__";
const ENTRY_HEADERS = null;
/* Served straight out of `public/` during development, where the placeholder is
   still in place. Nothing ships from there, so the name only has to be stable. */
const GENERATION = /^[a-z0-9]+$/iu.test(BUILD) ? BUILD : "dev";
const CACHE = `kit-shell-${GENERATION}`;
const RSC_CACHE = `kit-rsc-${GENERATION}`;
/* Cache Storage is shared by every app on the origin. Only names carrying this
   prefix belong to Kit, so activating a new worker never evicts another app. */
const CACHE_PREFIX = "kit-";
const LAST_HOME = "./last-home";
const NAV_FETCH_MS = 8000;
const UPDATE_READY = "./offline-update-ready";
// Small durable records survive worker suspension and release replacement.
// A scope-specific cache keeps separate installations on the same origin apart.
const META_CACHE = `kit-offline-${encodeURIComponent(new URL(self.registration?.scope || "/", self.location.origin).pathname)}`;
const ACTIVE_RELEASE = "./active-release";
const RETIRED = "./retired-releases";
const REMOVED = "./removed-downloads";
const JOB = "./offline-job";
const VERIFIED = "./offline-verified";
const NAV_CACHE_MS = 400;
const FILL_PRECACHE = "./sw-precache.json";
const OFFLINE_PROGRESS_MS = 250;
/* Ceilings on a single offline-access request, so an oversized or malformed
   message cannot queue unbounded work. */
const MAX_OFFLINE_LOCALES = 40;
const MAX_OFFLINE_TOOLS = 200;
const MAX_OFFLINE_PAGES = 40;
/* How many resources a download the visitor asked for fetches at once. The
   optional background fill stays strictly one at a time, so this only applies
   while someone is waiting on the page and watching the progress bar. */
const OFFLINE_CONCURRENCY = 6;
const DOWNLOAD_FETCH_MS = 120_000;

async function readRecord(cacheName, key) {
  // An unreadable store is not an empty store. Propagate API failures so they
  // cannot erase a saved plan or authorize retiring the previous release.
  const response = await (await caches.open(cacheName)).match(key);
  if (!response) return null;
  try { return await response.json(); }
  catch (error) { if (error?.name === "SyntaxError") return null; throw error; }
}

async function writeRecord(cacheName, key, value) {
  await (await caches.open(cacheName)).put(key, new Response(JSON.stringify(value)));
}

let servingSnapshot = null;
async function servingRelease() {
  if (servingSnapshot) return servingSnapshot;
  const active = await readRecord(META_CACHE, ACTIVE_RELEASE);
  return (servingSnapshot = active?.workerGeneration === GENERATION
    ? active : { cache: CACHE, rsc: RSC_CACHE, generation: GENERATION });
}

async function servingManifest() {
  const release = await servingRelease();
  return release.cache === CACHE ? readManifest() : readRecord(release.cache, FILL_PRECACHE);
}

async function retireReleases() {
  // A fallback is retained in full until the replacement is verified. Never
  // clean a different Kit installation sharing this origin (e.g. /kit/).
  const root = new URL("./", self.registration.scope).pathname;
  const names = await caches.keys();
  const retired = await readRecord(META_CACHE, RETIRED);
  const candidates = new Set(retired?.names || []);
  const remove = new Set();
  for (const name of names) {
    if (!name.startsWith(`${CACHE_PREFIX}shell-`) || name === CACHE || !candidates.has(name)) continue;
    const manifest = await readRecord(name, FILL_PRECACHE);
    if (manifest?.core?.includes(root)) {
      remove.add(name);
      const rsc = name.replace("kit-shell-", "kit-rsc-");
      if (names.includes(rsc)) remove.add(rsc);
    }
  }
  await Promise.all([...remove].map((name) => caches.delete(name).catch(() => false)));
  await writeRecord(META_CACHE, RETIRED, { names: [...candidates].filter((name) => name !== CACHE && !remove.has(name)) });
}

async function rememberRetired(cache) {
  if (!cache || cache === CACHE) return;
  const retired = await readRecord(META_CACHE, RETIRED);
  await writeRecord(META_CACHE, RETIRED, { names: [...new Set([...(retired?.names || []), cache])] });
}

function mergeSelection(first, second) {
  const list = (key) => [...new Set([...(first?.[key] || []), ...(second?.[key] || [])])];
  return { locales: list("locales"), tools: list("tools"), pages: list("pages"), engines: Boolean(first?.engines || second?.engines) };
}

function normalizedSelection(data, manifest) {
  const strings = (value, limit) => (Array.isArray(value) ? value : []).filter((id) => typeof id === "string").slice(0, limit);
  const segments = new Set(Object.values(manifest.toolsByLocale || {}).flat().map(segmentOfToolUrl));
  const pages = new Set(Object.values(manifest.pagesByLocale || {}).flatMap((entry) => Object.keys(entry)));
  return {
    locales: strings(data?.locales, MAX_OFFLINE_LOCALES).filter((id) => Object.hasOwn(manifest.chromeByLocale || {}, id)),
    tools: strings(data?.tools, MAX_OFFLINE_TOOLS).filter((id) => segments.has(toolPathSegment(id))),
    pages: data && !Array.isArray(data.pages) ? [...pages] : strings(data?.pages, MAX_OFFLINE_PAGES).filter((id) => pages.has(id)),
    engines: data?.engines === true,
  };
}

async function pruneRemovedResources() {
  const removed = await readRecord(META_CACHE, REMOVED);
  if (!removed) return;
  for (const path of removed.paths || []) await (await caches.open(cacheNameFor(path))).delete(path);
  const ready = await readRecord(CACHE, UPDATE_READY);
  if (ready?.selection) {
    ready.selection.locales = (ready.selection.locales || []).filter((id) => !(removed.locales || []).includes(id));
    ready.selection.tools = (ready.selection.tools || []).filter((id) => !(removed.tools || []).includes(id));
    if (removed.engines) ready.selection.engines = false;
    if (!ready.selection.locales.length) await (await caches.open(CACHE)).delete(UPDATE_READY);
    else await writeRecord(CACHE, UPDATE_READY, ready);
  }
}

/* Mirrors toolPathSegment() in src/lib/navigation/routes.ts. A tool id is not
   always its public route segment, so selected ids must be resolved before
   they are matched against the precache manifest. */
const TOOL_PATH_SEGMENT = { "timezone-converter": "world-clock" };

function toolPathSegment(toolId) {
  return TOOL_PATH_SEGMENT[toolId] || toolId;
}

/* Response types worth trusting with a document or a Flight body. */
const TRUSTED_TYPES = new Set(["basic", "default"]);

/** Resolve a path against this origin, or null when it would leave it. */
function sameOriginUrl(path) {
  let url;
  try {
    url = new URL(path, self.location.origin);
  } catch {
    return null;
  }
  return url.origin === self.location.origin ? url : null;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Installation must keep the manifest that belongs to this worker. A
      // deployment changing mid-install must fail rather than mix releases.
      const response = await downloadResponse(FILL_PRECACHE);
      const manifest = await response.clone().json();
      if (!response.ok || manifest.generation !== GENERATION) throw new Error("Build changed during install");
      await cache.put(FILL_PRECACHE, response);
      await stageRelease(manifest);
    })()
  );
});

/** A new worker cannot replace a usable offline release with an empty shell.
 * Carry explicit saved choices forward; on first install, stage just the
 * current language's home and its actual startup dependencies. */
async function stageRelease(manifest) {
  const cache = await caches.open(CACHE);
  let previous = null;
  let previousCache = null;
  const active = await readRecord(META_CACHE, ACTIVE_RELEASE);
  for (const name of await caches.keys()) {
    if (!name.startsWith("kit-shell-") || name === CACHE || (active?.cache && name !== active.cache)) continue;
    const entry = await readRecord(name, UPDATE_READY);
    if (entry?.selection && (!previous || entry.at > previous.at)) { previous = entry; previousCache = name; }
  }
  if (!active && previousCache) {
    const generation = previousCache.slice("kit-shell-".length);
    await writeRecord(META_CACHE, ACTIVE_RELEASE, { cache: previousCache, rsc: previousCache.replace("kit-shell-", "kit-rsc-"), generation, workerGeneration: generation });
  }
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const locale = Object.keys(manifest.chromeByLocale).find((value) => windows.some((client) => new URL(client.url).pathname.startsWith(new URL(`${value}/`, self.registration.scope).pathname))) || "en";
  const home = manifest.chromeByLocale[locale]?.[0];
  const urls = new Set(previous ? await selectedOfflineUrls(previous.selection) : []);
  urls.add(new URL("./", self.registration.scope).pathname);
  if (home) { urls.add(home); urls.add(`${home}index.txt`); }
  // Inspect actual documents, rather than preloading every tool's JS on first
  // visit. These include CSS and runtime chunks needed before first paint.
  for (const page of [new URL("./", self.registration.scope).pathname, home].filter(Boolean)) {
    const response = await downloadResponse(page);
    if (!isUsableHtml(response) || !await matchesBuild(page, response)) throw new Error("Startup document changed during install");
    const html = await response.clone().text();
    await cache.put(page, response);
    for (const match of html.matchAll(/(?:src|href)="([^"<>]+)"/g)) {
      const url = new URL(match[1].replace(/&amp;/g, "&"), self.location.origin);
      if (url.origin === self.location.origin && /\/_next\/.*\.(?:js|css)$/.test(url.pathname)) urls.add(url.pathname);
    }
  }
  const pending = [...urls];
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(OFFLINE_CONCURRENCY, pending.length) }, async () => {
    while (cursor < pending.length) {
      const href = pending[cursor++];
      const destination = await caches.open(cacheNameFor(href));
      if (await destination.match(href)) continue;
      await saveOfflineResource(href);
    }
  }));
  const held = await cachedPathnames();
  if (pending.some((url) => !(/\.txt$/iu.test(url) ? held.rsc : held.shell).has(url))) throw new Error("Some prepared files were removed from storage");
  if (home) {
    const response = await cache.match(home);
    if (response) await cache.put(LAST_HOME, response);
  }
  if (previous) await writeRecord(CACHE, UPDATE_READY, { ...previous, selection: normalizedSelection(previous.selection, manifest), generation: GENERATION, version: manifest.version });
  await pruneRemovedResources();
}

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await pruneRemovedResources();
    const previous = await readRecord(META_CACHE, ACTIVE_RELEASE);
    const plan = previous?.cache && await readRecord(previous.cache, UPDATE_READY);
    const staged = await readRecord(CACHE, UPDATE_READY);
    const manifest = await readManifest();
    const selection = mergeSelection(normalizedSelection(plan?.selection, manifest || {}), normalizedSelection(staged?.selection, manifest || {}));
    const paths = await cachedPathnames();
    const needed = plan?.selection || staged?.selection ? await selectedOfflineUrls(selection) : [];
    const carried = needed.every((url) => (/\.txt$/iu.test(url) ? paths.rsc : paths.shell).has(url));
    // A user may add downloads after installation has already staged a newer
    // worker. If those choices are not yet in the new release, keep serving the
    // previous complete release. Activation never fetches or delays cold boot.
    const release = !carried && previous?.cache
      ? { ...previous, workerGeneration: GENERATION }
      : { cache: CACHE, rsc: RSC_CACHE, generation: GENERATION, workerGeneration: GENERATION };
    if (release.cache === CACHE) await rememberRetired(previous?.cache);
    await writeRecord(META_CACHE, ACTIVE_RELEASE, release);
    servingSnapshot = null;
    if (release.cache === CACHE) {
      if (plan?.selection || staged?.selection) await writeRecord(CACHE, UPDATE_READY, { ...(staged || plan), selection, generation: GENERATION, version: manifest?.version });
      const priorJob = previous?.cache !== CACHE && previous?.cache && await readRecord(previous.cache, JOB);
      if (priorJob && priorJob.status !== "complete" && !await readRecord(CACHE, JOB)) {
        await writeRecord(CACHE, JOB, { ...priorJob, status: priorJob.status === "running" ? "interrupted" : priorJob.status, generation: GENERATION });
      }
      await retireReleases();
    }
  })());
});

/** An older frontend may not understand activationRequired. A subsequent
 * document navigation can safely finish its prepared update, provided no
 * other app window is still using the previous release. The embedded root
 * entry remains immediate; this check happens on the following locale load. */
async function promotePreparedNavigation(event) {
  const serving = await servingRelease();
  if (serving.cache === CACHE) return;
  const ready = await readRecord(CACHE, UPDATE_READY);
  if (!ready?.selection || !await readRecord(CACHE, VERIFIED)) return;
  const previous = await readRecord(serving.cache, UPDATE_READY);
  const manifest = await readManifest();
  if (!manifest) return;
  const selection = mergeSelection(normalizedSelection(previous?.selection, manifest), normalizedSelection(ready.selection, manifest));
  const held = await cachedPathnames();
  if (!(await selectedOfflineUrls(selection)).every((url) => (/\.txt$/iu.test(url) ? held.rsc : held.shell).has(url))) return;
  const windows = (await self.clients.matchAll({ type: "window", includeUncontrolled: true })).filter((client) => client.url.startsWith(self.registration.scope));
  if (windows.some((client) => client.id !== event.clientId && client.id !== event.resultingClientId)) return;
  await writeRecord(CACHE, UPDATE_READY, { ...ready, selection });
  await rememberRetired(serving.cache);
  await writeRecord(META_CACHE, ACTIVE_RELEASE, { cache: CACHE, rsc: RSC_CACHE, generation: GENERATION, workerGeneration: GENERATION });
  servingSnapshot = null;
  await retireReleases();
}

function isIconOrManifest(url) {
  const p = url.pathname;
  return p.includes("/icons/") || p.endsWith("manifest.webmanifest") || p.endsWith("/sw.js");
}

function isStaticAsset(url) {
  return /\.(js|mjs|css|woff2?|wasm|gz)$/u.test(url.pathname);
}

function isRscRequest(req) {
  if (req.headers.get("RSC") === "1") return true;
  if (req.headers.has("Next-Router-Prefetch")) return true;
  if (req.headers.has("Next-Router-State-Tree")) return true;
  if (req.headers.has("Next-Url")) return true;
  const accept = req.headers.get("accept") || "";
  return accept.includes("text/x-component");
}

function isHtmlResponse(res) {
  const type = res.headers.get("content-type") || "";
  return type.includes("text/html");
}

function isUsableHtml(res) {
  return Boolean(res) && res.ok && TRUSTED_TYPES.has(res.type) && isHtmlResponse(res);
}

/**
 * The host's answer that this address does not exist.
 *
 * It is a document and it is the truthful answer, so it is handed back rather
 * than replaced by a cached page: a visitor who mistyped an address, followed a
 * link that no longer resolves or opened a stale bookmark is better told so
 * than shown a page whose address is not the one they asked for. It is never
 * stored, since an address can start existing again.
 */
function isMissingPage(res) {
  return Boolean(res) && res.status === 404 && TRUSTED_TYPES.has(res.type) && isHtmlResponse(res);
}

/* Static hosting serves Flight payloads as text/plain, so the content type
   cannot identify them: being same-origin and not HTML can. */
function isUsableRsc(res) {
  return Boolean(res) && res.ok && TRUSTED_TYPES.has(res.type) && !isHtmlResponse(res);
}

/** Safari cannot consume a SW navigation response that followed redirects. */
async function asDirectResponse(res) {
  if (!res || res.redirected !== true) return res;
  const buf = await res.arrayBuffer();
  const headers = new Headers(res.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  return new Response(buf, { status: res.status, statusText: res.statusText, headers });
}

/** The HTML route that documents the same page as a `.txt` request. */
function htmlPathFromTxt(pathname) {
  const html = pathname.replace(/\/index\.txt$/i, "/").replace(/\.txt$/i, "/");
  /* Exactly one leading slash. `//host` would be read as an authority and
     resolve to another origin, so the result stays a path on this origin. */
  return "/" + html.replace(/^\/+/, "");
}

/** Cache key without the stale-chunk reload marker, so recovery cannot grow the cache. */
function cacheKeyFor(resource) {
  const href = typeof resource === "string" ? resource : resource.url;
  try {
    const url = new URL(href, self.location.origin);
    if (!url.searchParams.has("_kitcb")) return href;
    url.searchParams.delete("_kitcb");
    return url.href;
  } catch {
    return href;
  }
}

function deadlineFetch(resource, init) {
  const ctrl = new AbortController();
  const signal = init?.signal ? AbortSignal.any([init.signal, ctrl.signal]) : ctrl.signal;
  const extra = init ? { ...init, signal } : { signal };
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ctrl.abort();
      reject(new DOMException("Timeout", "AbortError"));
    }, NAV_FETCH_MS);
    fetch(resource, extra).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** The deadline covers the response body as well as headers. Large engines get
 * a separate budget from navigation and cancellation interrupts their streams. */
async function downloadResponse(href, signal, timeout = DOWNLOAD_FETCH_MS) {
  const ctrl = new AbortController();
  const abort = () => ctrl.abort();
  if (signal?.aborted) ctrl.abort();
  signal?.addEventListener("abort", abort, { once: true });
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(new URL(href, self.registration.scope).href, { cache: "no-store", priority: "low", signal: ctrl.signal });
        if (!usableOfflineResource(href, response)) throw new Error(`Invalid response: ${href}`);
        const body = await response.arrayBuffer();
        const headers = new Headers(response.headers);
        headers.delete("content-encoding");
        headers.delete("content-length");
        return new Response(body, { status: response.status, statusText: response.statusText, headers });
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => { ctrl.abort(); reject(new Error(`Download timed out: ${href}`)); }, timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

/** Reuse an identical verified resource (not an obsolete page) across releases.
 * In particular, updating Kit should not redownload unchanged WASM engines. */
async function saveOfflineResource(href, signal) {
  const destination = await caches.open(cacheNameFor(href));
  if (await destination.match(href)) return;
  for (const name of await caches.keys()) {
    if (name === CACHE || name === RSC_CACHE || !(name.startsWith("kit-shell-") || name.startsWith("kit-rsc-"))) continue;
    const held = await (await caches.open(name)).match(href);
    if (held && usableOfflineResource(href, held) && await matchesBuild(href, held, undefined, signal)) {
      if (signal?.aborted) throw new DOMException("Canceled", "AbortError");
      await destination.put(href, held);
      return;
    }
  }
  const response = await downloadResponse(href, signal);
  if (!await matchesBuild(href, response)) throw new Error(`Release changed: ${href}`);
  if (signal?.aborted) throw new DOMException("Canceled", "AbortError");
  await destination.put(href, response);
}

/** Exact URL, the same URL without the reload marker, or the path without search. */
async function cachedExactNavigation(req) {
  const cache = await caches.open((await servingRelease()).cache);
  const exact = await cache.match(req);
  if (isUsableHtml(exact)) return await asDirectResponse(exact);
  const normalized = await cache.match(cacheKeyFor(req));
  if (isUsableHtml(normalized)) return await asDirectResponse(normalized);
  try {
    const url = new URL(typeof req === "string" ? req : req.url);
    if (url.search) {
      url.search = "";
      const noSearch = await cache.match(url.href);
      if (isUsableHtml(noSearch)) return await asDirectResponse(noSearch);
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function cachedNavigation(req) {
  const exact = await cachedExactNavigation(req);
  if (isUsableHtml(exact)) return exact;
  const cache = await caches.open((await servingRelease()).cache);
  const lastHome = await cache.match(LAST_HOME);
  if (isUsableHtml(lastHome)) return await asDirectResponse(lastHome);
  const shell = await cache.match("./");
  if (isUsableHtml(shell)) return await asDirectResponse(shell);
  return Response.error();
}

async function networkHtml(resource) {
  const manifest = await servingManifest();
  const release = await servingRelease();
  const res = await asDirectResponse(await deadlineFetch(resource));
  if (isUsableHtml(res) && await matchesBuild(resource, res, manifest)) {
    const cache = await caches.open(release.cache);
    await cache.put(cacheKeyFor(resource), res.clone());
    return res;
  }
  if (res && !isHtmlResponse(res)) {
    const url = typeof resource === "string" ? resource : resource.url;
    const retry = await asDirectResponse(await deadlineFetch(url, { headers: { Accept: "text/html" }, cache: "no-store" }));
    if (isUsableHtml(retry) && await matchesBuild(resource, retry, manifest)) return retry;
  }
  return isUsableHtml(res) ? Response.error() : res;
}

/**
 * Prefer the exact cached HTML immediately so an idle tab does not wait on a
 * cold socket. Keep this release pinned. Network-first only when this
 * URL has never been cached.
 */
async function navigateDocument(req, dest) {
  const target = dest || req;
  const exact = await cachedExactNavigation(target);
  if (isUsableHtml(exact)) {
    return exact;
  }

  const exactP = cachedExactNavigation(req);
  const cachedP = cachedNavigation(req);
  /* A cache read can fail. Treat that as "nothing cached" so the navigation
     always settles instead of waiting on a promise that never resolves. */
  const orNone = (promise) => promise.then((res) => res, () => null);

  return await new Promise((resolve) => {
    let settled = false;
    const settle = (res) => {
      if (settled || !res) return;
      settled = true;
      resolve(asDirectResponse(res));
    };
    const settleFromCache = (res) => settle(isUsableHtml(res) ? res : Response.error());

    networkHtml(target).then(
      (res) => {
        /* The host answered: either the page, or that there is no page. Both
           are answers, and only its silence falls back to what is cached. */
        if (isUsableHtml(res) || isMissingPage(res)) settle(res);
        else orNone(cachedP).then(settleFromCache);
      },
      () => {
        orNone(cachedP).then(settleFromCache);
      }
    );

    setTimeout(() => {
      orNone(exactP).then((cached) => {
        if (isUsableHtml(cached)) settle(cached);
      });
    }, NAV_CACHE_MS);

    setTimeout(() => {
      orNone(cachedP).then(settleFromCache);
    }, NAV_FETCH_MS);
  });
}

/** Cache-first Flight payloads. Never stored in the HTML shell cache. */
async function respondRsc(event, req) {
  const cache = await caches.open((await servingRelease()).rsc);
  const url = new URL(req.url);
  url.search = "";
  if (url.pathname.endsWith("/")) url.pathname += "index.txt";
  const key = url.href;
  const cached = await cache.match(key);
  if (isUsableRsc(cached)) return cached;
  try {
    const fresh = await asDirectResponse(await deadlineFetch(req));
    if (isUsableRsc(fresh) && await matchesBuild(key, fresh, await servingManifest())) {
      await cache.put(key, fresh.clone());
      return fresh;
    }
  } catch {
    /* offline or a different release: never replace a pinned payload */
  }
  return Response.error();
}

let fillPaused = false;
let fillBusy = false;
let fillAbort = null;
const fillQueue = [];
const fillSeen = new Set();
let offlineAbort = null;
let offlineCancelRequested = false;
let offlineRequestId = null;
/* A user-requested offline download owns the connection; the background fill
   yields until it finishes so the two never compete for bandwidth. */
let offlineBusy = false;
let offlineProgress = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueueFill(urls) {
  for (const raw of urls) {
    if (typeof raw !== "string" || !raw) continue;
    const resolved = sameOriginUrl(raw);
    if (!resolved) continue;
    const href = resolved.href;
    if (fillSeen.has(href)) continue;
    if (fillQueue.includes(href)) continue;
    fillQueue.push(href);
  }
}

function cacheNameFor(href) {
  return /\.txt$/i.test(href) ? RSC_CACHE : CACHE;
}

async function cacheFillUrl(href) {
  if (fillSeen.has(href)) return;
  const removed = await readRecord(META_CACHE, REMOVED);
  if (removed?.paths?.includes(new URL(href).pathname)) { fillSeen.add(href); return; }
  const cache = await caches.open(cacheNameFor(href));
  /* Held for this build, as the cache's own name guarantees. */
  if (await cache.match(href)) {
    fillSeen.add(href);
    return;
  }
  const ctrl = new AbortController();
  fillAbort = ctrl;
  try {
    const init = { cache: "no-store", priority: "low", signal: ctrl.signal };
    if (href.endsWith("/") || href.endsWith(".html")) init.headers = { Accept: "text/html" };
    const res = await downloadResponse(href, init.signal, NAV_FETCH_MS);
    if (!res || !res.ok || !TRUSTED_TYPES.has(res.type) || !await matchesBuild(href, res)) return;
    if (fillPaused || fillSeen.has(href)) return;
    if (/\.txt$/i.test(href)) {
      if (isHtmlResponse(res)) return;
      await cache.put(href, res);
    } else if (href.endsWith("/") || href.endsWith(".html")) {
      if (!isHtmlResponse(res)) return;
      await cache.put(href, res);
    } else {
      await cache.put(href, res);
    }
    fillSeen.add(href);
  } finally {
    if (fillAbort === ctrl) fillAbort = null;
  }
}

async function pumpFill() {
  if (fillBusy) return;
  fillBusy = true;
  try {
    // Pausing must settle this event, not leave an eternal waitUntil(). A
    // pending background event can prevent a waiting release from activating.
    while (fillQueue.length && !fillPaused && !offlineBusy) {
      const href = fillQueue.shift();
      if (!href) continue;
      try {
        await cacheFillUrl(href);
      } catch (err) {
        if (err && err.name === "AbortError" && (fillPaused || offlineBusy)) fillQueue.unshift(href);
      }
      await sleep(0);
    }
  } finally {
    fillBusy = false;
  }
}

async function sendOfflineProgress(data) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => { try { client.postMessage({ type: "OFFLINE_PROGRESS", ...data }); } catch { /* closed window */ } });
}

/**
 * A report of what is saved, on its own message type so it cannot be mistaken
 * for download progress.
 */
async function sendOfflineState(state) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => { try { client.postMessage({ type: "OFFLINE_STATE", state }); } catch { /* closed window */ } });
}

/**
 * The build's list of offline-able resources.
 *
 * The copy stored at install is read first so this still answers when the
 * device is offline; it is regenerated with each build, so it describes the
 * version of the app this worker belongs to. Read out of this build's own
 * cache rather than matched across all of them: another generation's list
 * would name content that is not here.
 */
let manifestSnapshot = null;
async function readManifest() {
  if (manifestSnapshot) return manifestSnapshot;
  try {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(FILL_PRECACHE);
    if (cached) {
      const manifest = await cached.json();
      if (!manifest.generation || manifest.generation === GENERATION) return (manifestSnapshot = manifest);
    }
  } catch {
    /* fall through to the network */
  }
  try {
    const response = await deadlineFetch(FILL_PRECACHE, { cache: "no-store" });
    const manifest = await response.clone().json();
    if (!response.ok || (manifest.generation && manifest.generation !== GENERATION)) return null;
    await (await caches.open(CACHE)).put(FILL_PRECACHE, response);
    return (manifestSnapshot = manifest);
  } catch {
    return null;
  }
}

/** Cloudflare Pages appends this precise analytics block after the build. Only
 * that known, inert configuration is excluded from the content comparison;
 * arbitrary scripts/attributes and every byte of the app remain verified. */
function deploymentHtml(html) {
  return html.replace(/<!-- Cloudflare Pages Analytics -->\s*<script\s+defer\s+src=(["'])https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js\1\s+data-cf-beacon=(["'])\{\s*"token"\s*:\s*"[a-f0-9]{32}"\s*\}\2\s*>\s*<\/script>\s*<!-- Cloudflare Pages Analytics -->/gu, "");
}

/** Validate mutable URLs against the release, including downloads during deploys. */
async function matchesBuild(resource, response, suppliedManifest, signal) {
  const manifest = suppliedManifest === undefined ? await readManifest() : suppliedManifest;
  if (!manifest) return false;
  // Legacy/test manifests have no integrity table. Shipped manifests always do.
  if (!manifest.integrity) return true;
  const url = new URL(typeof resource === "string" ? resource : resource.url, self.registration.scope);
  const expected = manifest.integrity[url.pathname];
  if (!expected) return false;
  if (signal?.aborted) throw new DOMException("Canceled", "AbortError");
  let timer;
  let abort;
  let body;
  try {
    const canceled = new Promise((_, reject) => {
      abort = () => reject(new DOMException("Canceled", "AbortError"));
      signal?.addEventListener("abort", abort, { once: true });
    });
    body = await Promise.race([response.clone().arrayBuffer(), canceled, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Cached file could not be read. Retry.")), 30_000);
    })]);
  } finally { clearTimeout(timer); if (abort) signal?.removeEventListener("abort", abort); }
  const digest = await crypto.subtle.digest("SHA-256", body);
  const actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (expected === actual) return true;
  if (!isHtmlResponse(response)) return false;
  const html = await new Response(body).text();
  const normalized = deploymentHtml(html);
  if (normalized === html) return false;
  const canonicalDigest = await crypto.subtle.digest("SHA-256", await new Response(normalized).arrayBuffer());
  return expected === Array.from(new Uint8Array(canonicalDigest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function usableOfflineResource(href, response) {
  if (!response || !response.ok || !TRUSTED_TYPES.has(response.type)) return false;
  const path = new URL(href, self.location.origin).pathname;
  if (path.endsWith("/") || path.endsWith(".html")) return isUsableHtml(response);
  if (path.endsWith(".txt")) return isUsableRsc(response);
  // Static hosts sometimes send a 200 HTML fallback for a missing JS/WASM file.
  return !isHtmlResponse(response);
}

/** Every URL currently held, as pathnames, for each of the two caches. */
async function cachedPathnames(shellName = CACHE, rscName = RSC_CACHE) {
  const paths = async (name) => {
    const requests = await (await caches.open(name)).keys();
    const set = new Set();
    for (const request of requests) {
      try {
        set.add(new URL(request.url).pathname);
      } catch {
        set.add(request.url);
      }
    }
    return set;
  };
  return { shell: await paths(shellName), rsc: await paths(rscName) };
}

function countPresent(urls, present) {
  let done = 0;
  for (const url of urls) if (present.has(url)) done += 1;
  return done;
}

/** The public route segment of a tool page URL. */
function segmentOfToolUrl(url) {
  return url.split("/tools/")[1]?.replace(/\/$/u, "") || null;
}

function essentialUrls(manifest, locale) {
  const pages = manifest.pagesByLocale?.[locale] || {};
  return new Set(["home", "settings", "offline"].flatMap((id) =>
    (pages[id] || []).flatMap((url) => [url, `${url}index.txt`])));
}

/**
 * What is saved right now, in the terms the Offline access page shows: per
 * language, per tool, for the media engines, and for the app's own files.
 *
 * Counted from the cache keys rather than by probing each URL, so reporting the
 * state of several thousand files costs one lookup per cache.
 *
 * `generation` identifies this build's cache. A page that saved content under a
 * different generation is looking at copies this worker has already replaced.
 */
async function offlineState() {
  const release = await servingRelease();
  const manifest = await servingManifest();
  if (!manifest) return null;
  const { shell, rsc } = await cachedPathnames(release.cache, release.rsc);
  const chrome = manifest.chromeByLocale || {};
  const toolsByLocale = manifest.toolsByLocale || {};
  const rscByLocale = manifest.rscByLocale || {};
  const runtime = manifest.runtime || (manifest.core || []).filter((url) => /\.(?:js|css|woff2?)$/u.test(url));
  const runtimeReady = countPresent(runtime, shell) === runtime.length;

  const locales = {};
  const essentialsByLocale = {};
  const pagesByLocale = {};
  const toolsByLanguage = {};
  const toolLocales = {};
  for (const locale of Object.keys(chrome)) {
    const pages = [...(chrome[locale] || []), ...(toolsByLocale[locale] || [])];
    const payloads = rscByLocale[locale] || [];
    const done = countPresent(pages, shell) + countPresent(payloads, rsc);
    const total = pages.length + payloads.length;
    const essentials = essentialUrls(manifest, locale);
    const essentialDone = [...essentials].filter((url) => (/\.txt$/iu.test(url) ? rsc : shell).has(url)).length;
    essentialsByLocale[locale] = { done: essentialDone, total: essentials.size, ready: runtimeReady && essentials.size >= 6 && essentialDone === essentials.size };
    pagesByLocale[locale] = Object.entries(manifest.pagesByLocale?.[locale] || {}).filter(([, urls]) => runtimeReady && urls.length > 0 && urls.every((url) => shell.has(url) && rsc.has(`${url}index.txt`))).map(([id]) => id);
    toolsByLanguage[locale] = [];
    const removable = pages.some((url) => !essentials.has(url) && shell.has(url)) || payloads.some((url) => !essentials.has(url) && rsc.has(url));
    locales[locale] = { done, total, ready: runtimeReady && total > 0 && done === total, removable };
    for (const url of toolsByLocale[locale] || []) {
      const segment = segmentOfToolUrl(url);
      if (!runtimeReady || !segment || !shell.has(url) || !rsc.has(`${url}index.txt`)) continue;
      toolLocales[segment] = (toolLocales[segment] || 0) + 1;
      toolsByLanguage[locale].push(segment);
    }
  }

  const core = manifest.core || [];
  const engines = manifest.engines || [];
  const marker = await readRecord(release.cache, UPDATE_READY);
  const plan = marker?.selection ? { ...normalizedSelection(marker.selection, manifest), generation: release.generation, version: manifest.version,
    at: new Date(marker.at || 0).toISOString(),
    ready: (await selectedOfflineUrls(marker.selection, manifest)).every((url) => (/\.txt$/iu.test(url) ? rsc : shell).has(url)),
  } : null;
  const progress = offlineProgress || await readRecord(CACHE, JOB);
  // iOS may kill a worker when the app is swiped away. Never show that dead job
  // as still running; a retry reuses every file already saved for this release.
  const job = progress?.status === "running" && !offlineBusy
    ? { ...progress, status: "interrupted", logs: ["Download interrupted. Retry to continue with the files already saved."] }
    : progress;
  return {
    generation: release.generation,
    version: manifest.version,
    pendingUpdate: release.generation !== GENERATION,
    verifiedAt: (await readRecord(release.cache, VERIFIED))?.at || null,
    essentials: essentialsByLocale,
    pages: pagesByLocale,
    toolPages: toolsByLanguage,
    plan,
    job,
    core: { done: countPresent(core, shell), total: core.length },
    engines: { done: countPresent(engines, shell), total: engines.length },
    locales,
    tools: toolLocales,
    readyLocales: Object.values(locales).filter((entry) => entry.ready).length,
  };
}

let verification = null;
let verificationEpoch = 0;
async function verifyOffline(locale, requested) {
  if (verification) return verification;
  const epoch = ++verificationEpoch;
  let timer;
  const task = (async () => {
    if (offlineBusy) return;
    const release = await servingRelease();
    const manifest = await readRecord(release.cache, FILL_PRECACHE);
    if (!manifest?.integrity || manifest.generation !== release.generation) throw new Error("Offline resources are unavailable.");
    const marker = await readRecord(release.cache, UPDATE_READY);
    const selection = mergeSelection(normalizedSelection(marker?.selection, manifest), normalizedSelection(requested || { locales: [locale], tools: [], pages: ["home", "settings", "offline"], engines: false }, manifest));
    const saved = await cachedPathnames(release.cache, release.rsc);
    const urls = [...new Set([...(await selectedOfflineUrls(selection, manifest)), ...saved.shell, ...saved.rsc])].filter((url) => Object.hasOwn(manifest.integrity, url));
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(OFFLINE_CONCURRENCY, urls.length) }, async () => {
      while (cursor < urls.length && epoch === verificationEpoch) {
        const url = urls[cursor++];
        const cache = await caches.open(/\.txt$/iu.test(url) ? release.rsc : release.cache);
        const response = await cache.match(url, { ignoreSearch: true });
        // Missing resources stay missing; damaged cached copies cannot be
        // advertised as ready simply because their keys are still present.
        const valid = !response || (usableOfflineResource(url, response) && await matchesBuild(url, response, manifest));
        if (epoch !== verificationEpoch) return;
        if (!valid) await cache.delete(url, { ignoreSearch: true });
      }
    }));
    if (epoch !== verificationEpoch) return;
    const held = await cachedPathnames(release.cache, release.rsc);
    if (!marker && requested && selection.locales.length && urls.every((url) => (/\.txt$/iu.test(url) ? held.rsc : held.shell).has(url))) {
      await writeRecord(release.cache, UPDATE_READY, { selection, generation: release.generation, version: manifest.version, at: Date.now() });
    }
    await writeRecord(release.cache, VERIFIED, { at: Date.now() });
  })();
  verification = Promise.race([task, new Promise((_, reject) => {
    timer = setTimeout(() => { verificationEpoch++; reject(new Error("Offline verification timed out. Retry.")); }, 30_000);
  })]);
  try { await verification; }
  finally { clearTimeout(timer); verificationEpoch++; verification = null; }
}

function waitForVerification(signal) {
  if (!verification) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener("abort", abort); reject(new DOMException("Canceled", "AbortError")); };
    signal.addEventListener("abort", abort, { once: true });
    verification.catch(() => undefined).then(() => { signal.removeEventListener("abort", abort); resolve(); });
    if (signal.aborted) abort();
  });
}

/**
 * Remove saved offline copies: a chosen set of languages and tools, or
 * everything the Offline access page can add.
 *
 * Runtime files and the minimal Home/Settings/Offline access documents remain
 * available. Optional content is removed from both the running and staged
 * releases, with persistent tombstones preventing automatic refill.
 */
async function removeOffline(scope) {
  if (verification) await verification;
  if (offlineBusy) throw new Error("Cancel the current download before removing files.");
  const manifest = await readManifest();
  if (!manifest) return null;
  const chrome = manifest.chromeByLocale || {};
  const toolsByLocale = manifest.toolsByLocale || {};
  const rscByLocale = manifest.rscByLocale || {};
  const extrasByLocale = manifest.extrasByLocale || {};
  const targets = new Set();

  /* A language is everything stored for it, including the compatibility
     addresses that live under it, so nothing is left behind. Removing a
     language that is not stored, or not a language at all, matches nothing. */
  const addLocale = (locale) => {
    for (const url of chrome[locale] || []) targets.add(url);
    for (const url of toolsByLocale[locale] || []) targets.add(url);
    for (const url of rscByLocale[locale] || []) targets.add(url);
    for (const url of extrasByLocale[locale] || []) targets.add(url);
  };

  /* A tool is stored once per language, as a page and as the payload that opens
     it. The id is resolved to the public route segment first, the same way the
     download resolves it, so both agree on which tool is meant. */
  const addTool = (tool) => {
    const segment = toolPathSegment(tool);
    for (const locale of Object.keys(chrome)) {
      for (const url of toolsByLocale[locale] || []) {
        if (segmentOfToolUrl(url) !== segment) continue;
        targets.add(url);
        targets.add(`${url}index.txt`);
      }
    }
  };

  if (scope.all) {
    for (const locale of Object.keys(chrome)) addLocale(locale);
    /* A compatibility language owns addresses but is not one of the languages
       listed above, so it is reached separately. */
    for (const locale of Object.keys(extrasByLocale)) addLocale(locale);
    for (const url of manifest.engines || []) targets.add(url);
  } else {
    /* Nothing named removes nothing: a message that selects no address must
       never be read as a request for everything. */
    for (const locale of scope.locales || []) addLocale(locale);
    for (const tool of scope.tools || []) addTool(tool);
    /* The engines are offered on the page like anything else in the list, so
       they can be dropped on their own without losing the pages that use them. */
    if (scope.engines) for (const url of manifest.engines || []) targets.add(url);
  }

  // Keep the minimal app usable after optional downloads are removed. These
  // documents let the visitor reopen Kit and return to Offline access.
  for (const locale of Object.keys(chrome)) for (const url of essentialUrls(manifest, locale)) targets.delete(url);

  // Persist the decision before deleting anything. A suspended background fill,
  // a staged update, or another worker restart cannot restore these addresses.
  const prior = await readRecord(META_CACHE, REMOVED);
  await writeRecord(META_CACHE, REMOVED, {
    paths: [...new Set([...(prior?.paths || []), ...targets])],
    locales: [...new Set([...(prior?.locales || []), ...(scope.all ? Object.keys(chrome) : scope.locales || [])])],
    tools: [...new Set([...(prior?.tools || []), ...(scope.all ? Object.values(toolsByLocale).flat().map(segmentOfToolUrl) : scope.tools || [])])],
    engines: Boolean(prior?.engines || scope.all || scope.engines),
    at: `${Date.now()}-${Math.random()}`,
  });
  for (const url of targets) fillSeen.add(new URL(url, self.location.origin).href);
  if (fillAbort) fillAbort.abort();
  let removed = 0;
  // Also remove from an already waiting release; otherwise the next update
  // would bring the files back after the current report said they were gone.
  const names = typeof caches.keys === "function" ? await caches.keys() : [CACHE, RSC_CACHE];
  for (const name of names) {
    if (!(name.startsWith("kit-shell-") || name.startsWith("kit-rsc-"))) continue;
    const cache = await caches.open(name);
    const ready = await readRecord(name, UPDATE_READY);
    if (ready?.selection) {
      const selection = ready.selection;
      selection.locales = (selection.locales || []).filter((locale) => !(scope.locales || []).includes(locale));
      selection.tools = (selection.tools || []).filter((tool) => !(scope.tools || []).includes(tool));
      if (scope.engines) selection.engines = false;
      if (scope.all || !selection.locales.length) await cache.delete(UPDATE_READY);
      else await writeRecord(name, UPDATE_READY, { ...ready, selection, requestId: null, at: Date.now() });
    }
    for (const url of targets) if (await cache.delete(url)) removed += 1;
  }
  await (await caches.open(CACHE)).delete(JOB);
  offlineProgress = null;
  return removed;
}

async function selectedOfflineUrls(data, suppliedManifest) {
  const manifest = suppliedManifest || await readManifest();
  if (!manifest) return [];
  const locales = (Array.isArray(data.locales) ? data.locales : [])
    .slice(0, MAX_OFFLINE_LOCALES)
    .filter((locale) => typeof locale === "string");
  /* Resolve ids to public route segments: a tool id is not always its path. */
  const segments = new Set(
    (Array.isArray(data.tools) ? data.tools : [])
      .slice(0, MAX_OFFLINE_TOOLS)
      .filter((tool) => typeof tool === "string")
      .map(toolPathSegment)
  );
  /* The app's own pages are chosen by id. A message that names no page asks for
     all of them; an empty list is a choice, and fetches none. */
  const chosenPages = Array.isArray(data.pages)
    ? new Set(
        data.pages
          .slice(0, MAX_OFFLINE_PAGES)
          .filter((id) => typeof id === "string")
      )
    : null;
  const pagesByLocale = manifest.pagesByLocale || {};
  const urls = new Set(manifest.core || []);
  const chrome = manifest.chromeByLocale || {};
  const toolsByLocale = manifest.toolsByLocale || {};
  for (const locale of locales) {
    const pages = new Set();
    const offered = pagesByLocale[locale] || {};
    if (chosenPages) {
      for (const id of chosenPages) for (const url of offered[id] || []) pages.add(url);
    } else {
      for (const url of chrome[locale] || []) pages.add(url);
    }
    for (const url of toolsByLocale[locale] || []) {
      if (segments.has(segmentOfToolUrl(url))) pages.add(url);
    }
    /* A page and the payload it navigates from are saved together, so every
       page included brings its payload: a language is counted complete only
       when both are present. */
    for (const url of pages) {
      urls.add(url);
      urls.add(`${url}index.txt`);
    }
  }
  if (data.engines) for (const url of manifest.engines || []) urls.add(url);
  return [...urls];
}

async function downloadSelectedOffline(data) {
  if (offlineBusy) {
    await sendOfflineProgress({ status: "error", requestId: data.requestId, logs: ["Another offline download is running. Wait for it to finish."] });
    return;
  }
  offlineRequestId = data.requestId;
  offlineCancelRequested = false;
  const ctrl = new AbortController();
  offlineAbort = ctrl;
  offlineBusy = true;
  /* Stop the background fill immediately; it waits on offlineBusy to resume. */
  if (fillAbort) fillAbort.abort();
  let done = 0;
  let manifest;
  let activationRequired = false;
  let heartbeat;
  let reporting = Promise.resolve();
  const report = (progress) => reporting = reporting.catch(() => undefined).then(async () => {
    offlineProgress = { ...progress, logs: (progress.logs || []).slice(-40), selection: { locales: data.locales, tools: data.tools, pages: data.pages, engines: data.engines }, requestId: data.requestId, generation: GENERATION, version: manifest?.version, activationRequired, at: Date.now() };
    try { await writeRecord(CACHE, JOB, offlineProgress); }
    finally { await sendOfflineProgress(offlineProgress); }
  });
  try {
    await waitForVerification(ctrl.signal);
    if (offlineCancelRequested) throw new DOMException("Canceled", "AbortError");
    manifest = await readManifest();
    const previous = await readRecord(CACHE, UPDATE_READY);
    const serving = await servingRelease();
    activationRequired = serving.cache !== CACHE;
    const prior = activationRequired ? await readRecord(serving.cache, UPDATE_READY) : null;
    data = { ...data, ...mergeSelection(mergeSelection(normalizedSelection(previous?.selection, manifest), normalizedSelection(prior?.selection, manifest)), normalizedSelection(data, manifest)) };
    const urls = await selectedOfflineUrls(data);
    const removed = await readRecord(META_CACHE, REMOVED);
    const requestedPaths = new Set(urls);
    for (const path of urls) fillSeen.delete(new URL(path, self.location.origin).href);
    await writeRecord(META_CACHE, REMOVED, {
      paths: (removed?.paths || []).filter((path) => !requestedPaths.has(path)),
      locales: (removed?.locales || []).filter((id) => !(data.locales || []).includes(id)),
      tools: (removed?.tools || []).filter((id) => !(data.tools || []).includes(id)),
      engines: Boolean(removed?.engines && !data.engines), at: `${Date.now()}-${Math.random()}`,
    });
    const mutationAt = (await readRecord(META_CACHE, REMOVED))?.at;
    /* One message per URL would mean thousands of postMessages and React renders.
       Coalesce log lines and flush at most every OFFLINE_PROGRESS_MS, always
       flushing the terminal state. */
    let lastSentAt = 0;
    let pendingLogs = [];
    const flush = async (status, force) => {
      const now = Date.now();
      if (!force && now - lastSentAt < OFFLINE_PROGRESS_MS) return;
      lastSentAt = now;
      const logs = pendingLogs;
      pendingLogs = [];
      await report({ status, done, total: urls.length, logs });
    };
    const note = async (line) => {
      pendingLogs.push(line);
      await flush("running", false);
    };
    const pathOf = (href) => {
      try {
        return new URL(href, self.location.origin).pathname;
      } catch {
        return href;
      }
    };

    if (!urls.length) {
      await report({ status: "error", done, total: 0, logs: ["No offline resources were available"] });
      return;
    }
    pendingLogs.push(`Preparing ${urls.length} items`);
    await flush("running", true);
    heartbeat = setInterval(() => { void report({ status: "running", done, total: urls.length, logs: [] }).catch(() => undefined); }, 5000);

    /* The visitor is waiting on this page and watching the bar, so several are
       fetched at once. The background fill, which runs while nobody is waiting,
       deliberately does not do this. */
    let cursor = 0;
    const takeNext = async () => {
      while (!offlineCancelRequested) {
        const href = urls[cursor];
        cursor += 1;
        if (href === undefined) return;
        try {
          const cache = await caches.open(cacheNameFor(href));
          // This release's own entries have already passed integrity checks.
          const held = await cache.match(href);
          let valid = false;
          if (held && usableOfflineResource(href, held)) {
            try { valid = await matchesBuild(href, held, undefined, ctrl.signal); }
            catch (error) { if (ctrl.signal.aborted) throw error; /* Repair unreadable cached copies. */ }
          }
          if (valid) {
            done += 1;
            await note(`Already ready: ${pathOf(href)}`);
            continue;
          }
          if (held) await cache.delete(href);
          await saveOfflineResource(href, ctrl.signal);
          done += 1;
          await note(`Downloaded: ${pathOf(href)}`);
        } catch (err) {
          if (offlineCancelRequested) return;
          await note(`${err?.name === "QuotaExceededError" ? "Storage is full" : "Could not download"}: ${pathOf(href)}`);
        }
      }
    };
    const lanes = Math.max(1, Math.min(OFFLINE_CONCURRENCY, urls.length));
    await Promise.all(Array.from({ length: lanes }, takeNext));

    clearInterval(heartbeat);
    const changed = (await readRecord(META_CACHE, REMOVED))?.at !== mutationAt;
    await pruneRemovedResources();
    const held = await cachedPathnames();
    done = urls.filter((url) => (/\.txt$/iu.test(url) ? held.rsc : held.shell).has(url)).length;
    const complete = !offlineCancelRequested && !changed && done === urls.length;
    if (complete) {
      const selection = normalizedSelection(data, manifest);
      await writeRecord(CACHE, UPDATE_READY, { generation: GENERATION, version: manifest?.version, requestId: data.requestId, selection, at: Date.now() });
      await writeRecord(CACHE, VERIFIED, { at: Date.now() });
    }
    pendingLogs.push(offlineCancelRequested ? "Download canceled" : complete ? "Offline access is ready" : "Some files could not be saved. Reconnect and retry.");
    await flush(offlineCancelRequested ? "canceled" : complete ? "complete" : "error", true);
    const state = await offlineState();
    if (state) await sendOfflineState(state);
  } catch (error) {
    await report({ status: offlineCancelRequested ? "canceled" : "error", done, total: offlineProgress?.total || 0,
      logs: [error?.name === "QuotaExceededError" ? "Storage is full. Remove some downloads and retry." : "Download interrupted. Retry to continue with the files already saved."] }).catch(() => undefined);
  } finally {
    /* Released on every path, including a failed progress report, so the
       background fill is never left waiting on a download that has ended. */
    clearInterval(heartbeat);
    if (offlineAbort === ctrl) offlineAbort = null;
    offlineBusy = false;
    offlineRequestId = null;
  }
}

async function startLocaleFill(locale, skipHeavy) {
  if (typeof locale !== "string" || !/^[A-Za-z0-9-]+$/.test(locale)) return;
  const manifest = await readManifest();
  if (!manifest) return;
  const chrome = manifest.chromeByLocale || {};
  const rsc = manifest.rscByLocale || {};
  /* The app's own pages go first. The fill pauses whenever someone is reading
     or scrolling, so on a first visit it may only get through a few dozen
     requests — and a visitor who then loses the network should still be able to
     open History, Favorites and the Offline access page itself. These are the
     smallest requests in the list and the ones the app's own navigation needs. */
  enqueueFill(chrome[locale] || []);
  const shellPayloads = new Set((chrome[locale] || []).map((url) => `${url}index.txt`));
  enqueueFill((rsc[locale] || []).filter((url) => shellPayloads.has(url)));
  enqueueFill((manifest.core || []).filter((url) => !url.includes("/_next/") && !url.includes("/startup/")));
  // Full tool sets, other languages, and media engines are deliberate Offline
  // access downloads. Filling them on every new device can transfer hundreds
  // of megabytes and compete with startup and an update the visitor requested.
  if (!skipHeavy) enqueueFill((manifest.extrasByLocale && manifest.extrasByLocale[locale]) || []);
  await pumpFill();
}

/** Messages arrive only from pages this worker controls, which are same-origin. */
function isTrustedMessage(event) {
  if (typeof event.origin === "string" && event.origin && event.origin !== self.location.origin) return false;
  const source = event.source;
  if (source && typeof source.url === "string" && source.url) {
    try {
      if (new URL(source.url).origin !== self.location.origin) return false;
    } catch {
      return false;
    }
  }
  return true;
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (!isTrustedMessage(event)) return;

  if (data.type === "OFFLINE_HAS") {
    event.waitUntil((async () => {
      const url = sameOriginUrl(data.url);
      if (!url) { event.ports[0]?.postMessage({ held: false }); return; }
      url.search = "";
      url.hash = "";
      const payload = url.pathname.endsWith(".txt");
      if (!payload && !url.pathname.endsWith("/")) url.pathname += "/";
      const release = await servingRelease();
      const cache = await caches.open(payload ? release.rsc : release.cache);
      event.ports[0]?.postMessage({ held: Boolean(await cache.match(url.href)) });
    })());
    return;
  }

  if (data.type === "ACTIVATE_UPDATE") {
    event.waitUntil((async () => {
      try {
        await pruneRemovedResources();
        const ready = await readRecord(CACHE, UPDATE_READY);
        const windows = (await self.clients.matchAll({ type: "window", includeUncontrolled: true }))
          .filter((client) => client.url.startsWith(self.registration.scope));
        if (!ready?.selection || typeof data.requestId !== "string" || ready.requestId !== data.requestId || !event.source?.id || windows.some((client) => client.id !== event.source.id)) {
          event.ports[0]?.postMessage({ ok: false, error: "Close other Kit windows, then retry the update." });
          return;
        }
        const { shell, rsc } = await cachedPathnames();
        const urls = await selectedOfflineUrls(ready.selection);
        if ((offlineBusy && offlineRequestId !== data.requestId) || !urls.length || !urls.every((url) => (/\.txt$/iu.test(url) ? rsc : shell).has(url))) {
          event.ports[0]?.postMessage({ ok: false, error: "Some downloads are missing. Retry the download before applying the update." });
          return;
        }
        const serving = await servingRelease();
        if (self.registration.active?.state === "activated" && serving.cache !== CACHE) {
          await rememberRetired(serving.cache);
          await writeRecord(META_CACHE, ACTIVE_RELEASE, { cache: CACHE, rsc: RSC_CACHE, generation: GENERATION, workerGeneration: GENERATION });
          servingSnapshot = null;
          await retireReleases();
          event.ports[0]?.postMessage({ ok: true, applied: true });
        } else {
          event.ports[0]?.postMessage({ ok: true });
          await self.skipWaiting();
        }
      } catch (error) {
        event.ports[0]?.postMessage({ ok: false, error: error?.message || "Could not apply the update. Retry." });
      }
    })());
    return;
  }

  if (data.type === "PING") {
    event.waitUntil((async () => {
      if ((await servingRelease()).generation !== GENERATION) event.source?.postMessage({ type: "OFFLINE_UPDATE_AVAILABLE" });
    })());
    return;
  }

  if (data.type === "PRECACHE_PAUSE") {
    fillPaused = true;
    if (fillAbort) fillAbort.abort();
    return;
  }
  if (data.type === "PRECACHE_RESUME") {
    fillPaused = false;
    event.waitUntil(pumpFill());
    return;
  }
  if (data.type === "OFFLINE_CANCEL") {
    if (data.requestId !== offlineRequestId) return;
    offlineCancelRequested = true;
    offlineAbort?.abort();
    return;
  }
  if (data.type === "OFFLINE_VERIFY") {
    event.waitUntil((async () => {
      try {
        await verifyOffline(data.locale, data.selection);
        event.source?.postMessage({ type: "OFFLINE_STATE", state: await offlineState(), verified: true });
      } catch {
        event.source?.postMessage({ type: "OFFLINE_STATE", state: null, verified: true, error: "Could not verify offline storage. Retry." });
      }
    })());
    return;
  }
  if (data.type === "OFFLINE_STATUS") {
    event.waitUntil(
      (async () => {
        /* Always answered, even when there is nothing to report, so the page can
           tell "there is nothing here" apart from "no answer yet". */
        try {
          const state = await offlineState();
          event.source?.postMessage({ type: "OFFLINE_STATE", state });
        } catch {
          event.source?.postMessage({ type: "OFFLINE_STATE", state: null, error: "Could not read offline storage. Retry." });
        }
      })()
    );
    return;
  }
  if (data.type === "OFFLINE_REMOVE") {
    event.waitUntil(
      (async () => {
        /* One message for the whole chosen set, so several at once cost one
           round trip and one report back. */
        try {
          await removeOffline({
            all: data.all === true,
            engines: data.engines === true,
            locales: (Array.isArray(data.locales) ? data.locales : [])
              .slice(0, MAX_OFFLINE_LOCALES)
              .filter((locale) => typeof locale === "string"),
            tools: (Array.isArray(data.tools) ? data.tools : [])
              .slice(0, MAX_OFFLINE_TOOLS)
              .filter((tool) => typeof tool === "string"),
          });
          const state = await offlineState();
          if (state) await sendOfflineState(state);
          event.ports[0]?.postMessage({ ok: true, state });
        } catch (error) {
          event.ports[0]?.postMessage({ ok: false, error: error?.message || "Could not remove downloads. Retry." });
        }
      })()
    );
    return;
  }
  if (data.type === "OFFLINE_DOWNLOAD") {
    event.waitUntil((async () => {
      if (!data.update) { await downloadSelectedOffline(data); return; }
      const manifest = await readManifest();
      if (!manifest) {
        await sendOfflineProgress({ status: "error", requestId: data.requestId, logs: ["Update resources are unavailable. Reconnect and retry."] });
        return;
      }
      const path = event.source?.url ? new URL(event.source.url).pathname : "";
      const locale = Object.keys(manifest.chromeByLocale || {}).find((id) => path.startsWith(new URL(`${id}/`, self.registration.scope).pathname)) || "en";
      const pages = ["home", "settings", "offline"];
      for (const [id, urls] of Object.entries(manifest.pagesByLocale?.[locale] || {})) if (urls.includes(path)) pages.push(id);
      const toolSegment = segmentOfToolUrl(path);
      const tool = Object.keys(TOOL_PATH_SEGMENT).find((id) => TOOL_PATH_SEGMENT[id] === toolSegment) || toolSegment;
      await downloadSelectedOffline({ ...data, locales: [locale], tools: tool ? [tool] : [], pages, engines: false });
    })());
    return;
  }

  if (data.type === "PRECACHE_LOCALE" && typeof data.locale === "string") {
    event.waitUntil(startLocaleFill(data.locale, Boolean(data.skipHeavy)));
    return;
  }

  if (data.type !== "PRECACHE_HOME" || typeof data.url !== "string") return;
  const url = sameOriginUrl(data.url);
  if (!url) return;
  if (!url.pathname.endsWith("/")) return;
  event.waitUntil(
    (async () => {
      try {
        const removed = await readRecord(META_CACHE, REMOVED);
        if (removed?.paths?.includes(url.pathname)) return;
        const res = await asDirectResponse(await deadlineFetch(url.href, { headers: { Accept: "text/html" }, cache: "no-store" }));
        if (!isUsableHtml(res) || !await matchesBuild(url.href, res)) return;
        const cache = await caches.open(CACHE);
        await cache.put(url.href, res.clone());
        await cache.put(LAST_HOME, res);
      } catch {
        /* registering while offline */
      }
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (!url.protocol.startsWith("http")) return;
  if (url.origin !== self.location.origin) return;

  if (isRscRequest(req)) {
    event.respondWith(respondRsc(event, req));
    return;
  }

  if (req.mode === "navigate" || req.destination === "document") {
    const root = new URL("./", self.registration.scope).pathname;
    if ((url.pathname === root || url.pathname === `${root}index.html`) && ENTRY_HTML !== "__KIT_ENTRY_HTML__") {
      event.respondWith(new Response(ENTRY_HTML, { headers: { ...ENTRY_HEADERS, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }));
      return;
    }

    if (/\.txt$/i.test(url.pathname)) {
      /* A `.txt` navigation asks for the page it belongs to. The destination is
         re-resolved against this origin; anything that could leave it falls back
         to the request URL. */
      const dest = sameOriginUrl(htmlPathFromTxt(url.pathname) + url.search);
      event.respondWith(promotePreparedNavigation(event).then(() => navigateDocument(req, dest ? dest.href : null)));
      return;
    }
    event.respondWith(promotePreparedNavigation(event).then(() => navigateDocument(req)));
    return;
  }

  if (isIconOrManifest(url) || isStaticAsset(url) || url.pathname.includes("/startup/") || url.pathname.includes("/vendor/")) {
    event.respondWith((async () => {
      const cache = await caches.open((await servingRelease()).cache);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      const direct = await asDirectResponse(await fetch(req));
      if (usableOfflineResource(req.url, direct) && await matchesBuild(req.url, direct, await servingManifest())) {
        event.waitUntil(cache.put(req, direct.clone()));
        return direct;
      }
      return Response.error();
    })());
  }
});
