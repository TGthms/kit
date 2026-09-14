/* Kit service worker — app shell only; never caches user files.
 *
 * Two caches, kept apart on purpose:
 *   kit-shell-v13  HTML documents, icons, scripts, styles and engines
 *   kit-rsc-v13    React Flight payloads used for in-app navigation
 * Because Flight bodies live in their own cache, a `.txt` body can never be
 * painted as the page.
 *
 * A new worker waits for existing tabs to close before taking over. Seizing
 * open tabs mid-navigation can orphan a navigate fetch and leave the page
 * stuck, so neither skipWaiting nor clients.claim is used.
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
const CACHE = "kit-shell-v13";
const RSC_CACHE = "kit-rsc-v13";
/* Cache Storage is shared by every app on the origin. Only names carrying this
   prefix belong to Kit, so activating a new worker never evicts another app. */
const CACHE_PREFIX = "kit-";
const LAST_HOME = "./last-home";
const NAV_FETCH_MS = 8000;
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
      try {
        await cache.add("./manifest.webmanifest");
      } catch {
        /* offline install */
      }
      /* Kept locally as well as fetched: this list is what lets the Offline
         access page report what is already saved while the device is offline. */
      try {
        await cache.add(FILL_PRECACHE);
      } catch {
        /* offline install */
      }
      try {
        const res = await asDirectResponse(await fetch("./", { headers: { Accept: "text/html" } }));
        if (isUsableHtml(res)) await cache.put("./", res);
      } catch {
        /* ignore */
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE && key !== RSC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
});

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
  const extra = init ? { ...init, signal: ctrl.signal } : { signal: ctrl.signal };
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

/** Exact URL, the same URL without the reload marker, or the path without search. */
async function cachedExactNavigation(req) {
  const cache = await caches.open(CACHE);
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
  const cache = await caches.open(CACHE);
  const lastHome = await cache.match(LAST_HOME);
  if (isUsableHtml(lastHome)) return await asDirectResponse(lastHome);
  const shell = await cache.match("./");
  if (isUsableHtml(shell)) return await asDirectResponse(shell);
  return Response.error();
}

async function networkHtml(resource) {
  const res = await asDirectResponse(await deadlineFetch(resource));
  if (isUsableHtml(res)) {
    const cache = await caches.open(CACHE);
    await cache.put(cacheKeyFor(resource), res.clone());
    return res;
  }
  if (res && !isHtmlResponse(res)) {
    const url = typeof resource === "string" ? resource : resource.url;
    const retry = await asDirectResponse(await deadlineFetch(url, { headers: { Accept: "text/html" }, cache: "no-store" }));
    if (isUsableHtml(retry)) return retry;
  }
  return res;
}

/**
 * Prefer the exact cached HTML immediately so an idle tab does not wait on a
 * cold socket. Revalidate in the background. Network-first only when this
 * URL has never been cached.
 */
async function navigateDocument(req, dest) {
  const target = dest || req;
  const exact = await cachedExactNavigation(target);
  if (isUsableHtml(exact)) {
    networkHtml(target).catch(() => {});
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
        if (isUsableHtml(res)) settle(res);
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
  const cache = await caches.open(RSC_CACHE);
  const cached = await cache.match(req.url);
  const revalidate = fetch(req).then(async (res) => {
    const direct = await asDirectResponse(res);
    if (isUsableRsc(direct)) await cache.put(req.url, direct.clone());
    return direct;
  });
  if (isUsableRsc(cached)) {
    event.waitUntil(revalidate.catch(() => {}));
    return cached;
  }
  try {
    const fresh = await revalidate;
    if (isUsableRsc(fresh)) return fresh;
  } catch {
    /* network idle / offline */
  }
  if (isUsableRsc(cached)) return cached;
  return Response.error();
}

let fillPaused = false;
let fillBusy = false;
let fillAbort = null;
const fillQueue = [];
const fillSeen = new Set();
let offlineAbort = null;
let offlineCancelRequested = false;
/* A user-requested offline download owns the connection; the background fill
   yields until it finishes so the two never compete for bandwidth. */
let offlineBusy = false;

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
  const cache = await caches.open(cacheNameFor(href));
  if (await cache.match(href)) {
    fillSeen.add(href);
    return;
  }
  const ctrl = new AbortController();
  fillAbort = ctrl;
  try {
    const init = { cache: "no-store", priority: "low", signal: ctrl.signal };
    if (href.endsWith("/") || href.endsWith(".html")) init.headers = { Accept: "text/html" };
    const res = await asDirectResponse(await fetch(href, init));
    if (!res || !res.ok || !TRUSTED_TYPES.has(res.type)) return;
    if (fillPaused) return;
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
    while (fillQueue.length) {
      while (fillPaused || offlineBusy) await sleep(400);
      const href = fillQueue.shift();
      if (!href) continue;
      try {
        await cacheFillUrl(href);
      } catch (err) {
        if (err && err.name === "AbortError") fillQueue.unshift(href);
      }
      await sleep(0);
    }
  } finally {
    fillBusy = false;
  }
}

async function sendOfflineProgress(data) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => client.postMessage({ type: "OFFLINE_PROGRESS", ...data }));
}

/**
 * A report of what is saved, on its own message type so it cannot be mistaken
 * for download progress.
 */
async function sendOfflineState(state) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => client.postMessage({ type: "OFFLINE_STATE", state }));
}

/**
 * The build's list of offline-able resources.
 *
 * The copy stored at install is read first so this still answers when the
 * device is offline; it is regenerated with each build, so it describes the
 * version of the app this worker belongs to.
 */
async function readManifest() {
  try {
    const cached = await caches.match(FILL_PRECACHE);
    if (cached) return await cached.json();
  } catch {
    /* fall through to the network */
  }
  try {
    return await (await fetch(FILL_PRECACHE, { cache: "no-store" })).json();
  } catch {
    return null;
  }
}

/** Every URL currently held, as pathnames, for each of the two caches. */
async function cachedPathnames() {
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
  return { shell: await paths(CACHE), rsc: await paths(RSC_CACHE) };
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
  const manifest = await readManifest();
  if (!manifest) return null;
  const { shell, rsc } = await cachedPathnames();
  const chrome = manifest.chromeByLocale || {};
  const toolsByLocale = manifest.toolsByLocale || {};
  const rscByLocale = manifest.rscByLocale || {};

  const locales = {};
  const toolLocales = {};
  for (const locale of Object.keys(chrome)) {
    const pages = [...(chrome[locale] || []), ...(toolsByLocale[locale] || [])];
    const payloads = rscByLocale[locale] || [];
    const done = countPresent(pages, shell) + countPresent(payloads, rsc);
    const total = pages.length + payloads.length;
    locales[locale] = { done, total, ready: total > 0 && done === total };
    for (const url of toolsByLocale[locale] || []) {
      const segment = segmentOfToolUrl(url);
      if (!segment || !shell.has(url)) continue;
      toolLocales[segment] = (toolLocales[segment] || 0) + 1;
    }
  }

  const core = manifest.core || [];
  const engines = manifest.engines || [];
  return {
    generation: CACHE.replace(/^kit-shell-/u, ""),
    core: { done: countPresent(core, shell), total: core.length },
    engines: { done: countPresent(engines, shell), total: engines.length },
    locales,
    tools: toolLocales,
    readyLocales: Object.values(locales).filter((entry) => entry.ready).length,
  };
}

/**
 * Remove saved offline copies: a chosen set of languages and tools, or
 * everything the Offline access page can add.
 *
 * The app's own scripts, styles and icons are left alone: those are the
 * application itself rather than something chosen on that page, they are
 * refilled as the visitor browses, and dropping them would leave the app unable
 * to open its own pages.
 */
async function removeOffline(scope) {
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

  const shellCache = await caches.open(CACHE);
  const rscCache = await caches.open(RSC_CACHE);
  let removed = 0;
  for (const url of targets) {
    const cache = /\.txt$/i.test(url) ? rscCache : shellCache;
    if (await cache.delete(url)) removed += 1;
  }
  return removed;
}

async function selectedOfflineUrls(data) {
  const manifest = await readManifest();
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
  if (offlineAbort) offlineAbort.abort();
  offlineCancelRequested = false;
  const ctrl = new AbortController();
  offlineAbort = ctrl;
  offlineBusy = true;
  /* Stop the background fill immediately; it waits on offlineBusy to resume. */
  if (fillAbort) fillAbort.abort();
  let done = 0;
  try {
    const urls = await selectedOfflineUrls(data);
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
      await sendOfflineProgress({ status, done, total: urls.length, logs });
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
      await sendOfflineProgress({ status: "error", done, total: 0, logs: ["No offline resources were available"] });
      return;
    }
    pendingLogs.push(`Preparing ${urls.length} items`);
    await flush("running", true);

    /* The visitor is waiting on this page and watching the bar, so several are
       fetched at once. The background fill, which runs while nobody is waiting,
       deliberately does not do this. */
    let cursor = 0;
    const takeNext = async () => {
      while (!offlineCancelRequested) {
        const href = urls[cursor];
        cursor += 1;
        if (href === undefined) return;
        const cache = await caches.open(cacheNameFor(href));
        if (await cache.match(href)) {
          done += 1;
          await note(`Already ready: ${pathOf(href)}`);
          continue;
        }
        try {
          const res = await asDirectResponse(await fetch(href, { cache: "no-store", priority: "low", signal: ctrl.signal }));
          if (res && res.ok && TRUSTED_TYPES.has(res.type)) {
            await cache.put(href, res);
            done += 1;
            await note(`Downloaded: ${pathOf(href)}`);
          } else {
            await note(`Skipped: ${pathOf(href)}`);
          }
        } catch (err) {
          if (err && err.name === "AbortError") return;
          await note(`Could not download: ${pathOf(href)}`);
        }
      }
    };
    const lanes = Math.max(1, Math.min(OFFLINE_CONCURRENCY, urls.length));
    await Promise.all(Array.from({ length: lanes }, takeNext));

    pendingLogs.push(offlineCancelRequested ? "Download canceled" : "Offline access is ready");
    await flush(offlineCancelRequested ? "canceled" : "complete", true);
    const state = await offlineState();
    if (state) await sendOfflineState(state);
  } finally {
    /* Released on every path, including a failed progress report, so the
       background fill is never left waiting on a download that has ended. */
    if (offlineAbort === ctrl) offlineAbort = null;
    offlineBusy = false;
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
  enqueueFill(rsc[locale] || []);
  enqueueFill(manifest.core || []);
  enqueueFill((manifest.toolsByLocale && manifest.toolsByLocale[locale]) || []);
  /* Compatibility addresses for old links, and the payloads that open them.
     Prefetched like the rest, but never counted towards what a language needs:
     they are not offered in Offline access, so counting them would mean no
     language could ever be reported as ready. */
  enqueueFill((manifest.extrasByLocale && manifest.extrasByLocale[locale]) || []);
  /* Every other language is a convenience for switching later. On a metered or
     slow connection only the language in use is filled, so the visitor keeps
     their data allowance and the connection stays usable. */
  if (!skipHeavy) {
    for (const [other, urls] of Object.entries(chrome)) {
      if (other === locale) continue;
      enqueueFill(urls);
    }
    for (const [other, urls] of Object.entries(rsc)) {
      if (other === locale) continue;
      enqueueFill(urls);
    }
    for (const [other, urls] of Object.entries(manifest.extrasByLocale || {})) {
      if (other === locale) continue;
      enqueueFill(urls);
    }
    enqueueFill(manifest.engines || []);
  }
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

  if (data.type === "PING") {
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
    offlineCancelRequested = true;
    offlineAbort?.abort();
    return;
  }
  if (data.type === "OFFLINE_STATUS") {
    event.waitUntil(
      (async () => {
        /* Always answered, even when there is nothing to report, so the page can
           tell "there is nothing here" apart from "no answer yet". */
        await sendOfflineState(await offlineState());
      })()
    );
    return;
  }
  if (data.type === "OFFLINE_REMOVE") {
    event.waitUntil(
      (async () => {
        /* One message for the whole chosen set, so several at once cost one
           round trip and one report back. */
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
      })()
    );
    return;
  }
  if (data.type === "OFFLINE_DOWNLOAD") {
    event.waitUntil(downloadSelectedOffline(data));
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
        const res = await asDirectResponse(await fetch(url.href, { headers: { Accept: "text/html" }, cache: "no-store" }));
        if (!isUsableHtml(res)) return;
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
    if (/\.txt$/i.test(url.pathname)) {
      /* A `.txt` navigation asks for the page it belongs to. The destination is
         re-resolved against this origin; anything that could leave it falls back
         to the request URL. */
      const dest = sameOriginUrl(htmlPathFromTxt(url.pathname) + url.search);
      event.respondWith(navigateDocument(req, dest ? dest.href : null));
      return;
    }
    event.respondWith(navigateDocument(req));
    return;
  }

  if (isIconOrManifest(url)) {
    event.respondWith(
      (async () => {
        try {
          const direct = await asDirectResponse(await fetch(req));
          if (direct.ok && TRUSTED_TYPES.has(direct.type)) {
            const copy = direct.clone();
            event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
          }
          return direct;
        } catch {
          return caches.match(req);
        }
      })()
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(async (cached) => {
        if (cached) return cached;
        const direct = await asDirectResponse(await fetch(req));
        if (direct.ok && TRUSTED_TYPES.has(direct.type)) {
          const copy = direct.clone();
          event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
        }
        return direct;
      })
    );
  }
});
