/* Kit service worker — app shell only; never cache user files or RSC payloads.
   A new worker must wait for existing tabs to close. Taking over mid-navigation
   (skipWaiting + clients.claim) can orphan a navigate fetch and wedge the page.
   Safari rejects a document response from a worker if it followed HTTP redirects
   ("Response served by service worker has redirections"). Never return a
   redirect Response or a fetch() result with redirected === true. */
const CACHE = "kit-shell-v9";
const LAST_HOME = "./last-home";
const NAV_FETCH_MS = 8000;
const NAV_CACHE_MS = 2500;
const FILL_PRECACHE = "./sw-precache.json";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        await cache.add("./manifest.webmanifest");
      } catch {
        /* offline install */
      }
      try {
        const res = asDirectResponse(await fetch("./", { headers: { Accept: "text/html" } }));
        if (isUsableHtml(res)) await cache.put("./", res);
      } catch {
        /* ignore */
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
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
  return Boolean(res) && res.ok && res.type !== "error" && isHtmlResponse(res);
}

/** Safari cannot consume a SW navigation response that followed redirects. */
function asDirectResponse(res) {
  if (!res || res.redirected !== true) return res;
  const headers = new Headers(res.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

function htmlPathFromTxt(pathname) {
  return pathname.replace(/\/index\.txt$/i, "/").replace(/\.txt$/i, "/");
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

async function cachedNavigation(req) {
  const cache = await caches.open(CACHE);
  const exact = await cache.match(req);
  if (isUsableHtml(exact)) return asDirectResponse(exact);
  try {
    const url = new URL(typeof req === "string" ? req : req.url);
    if (url.search) {
      url.search = "";
      const noSearch = await cache.match(url.href);
      if (isUsableHtml(noSearch)) return asDirectResponse(noSearch);
    }
  } catch {
    /* ignore */
  }
  const lastHome = await cache.match(LAST_HOME);
  if (isUsableHtml(lastHome)) return asDirectResponse(lastHome);
  const shell = await cache.match("./");
  if (isUsableHtml(shell)) return asDirectResponse(shell);
  return Response.error();
}

async function networkHtml(resource) {
  const res = asDirectResponse(await deadlineFetch(resource));
  if (isUsableHtml(res)) {
    const cache = await caches.open(CACHE);
    await cache.put(resource, res.clone());
    return res;
  }
  if (res && !isHtmlResponse(res)) {
    const url = typeof resource === "string" ? resource : resource.url;
    const retry = asDirectResponse(await deadlineFetch(url, { headers: { Accept: "text/html" }, cache: "no-store" }));
    if (isUsableHtml(retry)) return retry;
  }
  return res;
}

/** Network first, but if the socket hangs after idle, serve cached HTML at 2.5s. */
async function navigateDocument(req, dest) {
  const target = dest || req;
  const cachedP = cachedNavigation(req);

  return await new Promise((resolve) => {
    let settled = false;
    const settle = (res) => {
      if (settled || !res) return;
      settled = true;
      resolve(asDirectResponse(res));
    };

    networkHtml(target).then(
      (res) => {
        if (isUsableHtml(res)) settle(res);
        else {
          cachedP.then((cached) => settle(isUsableHtml(cached) ? cached : res || Response.error()));
        }
      },
      () => {
        cachedP.then((cached) => settle(isUsableHtml(cached) ? cached : Response.error()));
      }
    );

    setTimeout(() => {
      cachedP.then((cached) => {
        if (isUsableHtml(cached)) settle(cached);
      });
    }, NAV_CACHE_MS);

    setTimeout(() => {
      cachedP.then((cached) => settle(isUsableHtml(cached) ? cached : Response.error()));
    }, NAV_FETCH_MS);
  });
}

let fillPaused = false;
let fillBusy = false;
const fillQueue = [];
const fillSeen = new Set();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueueFill(urls) {
  for (const raw of urls) {
    if (typeof raw !== "string" || !raw) continue;
    let href;
    try {
      href = new URL(raw, self.location.origin).href;
    } catch {
      continue;
    }
    if (!href.startsWith(self.location.origin)) continue;
    if (fillSeen.has(href)) continue;
    fillSeen.add(href);
    fillQueue.push(href);
  }
}

async function cacheFillUrl(href) {
  const cache = await caches.open(CACHE);
  if (await cache.match(href)) return;
  const init = { cache: "no-store", priority: "low" };
  if (href.endsWith("/") || href.endsWith(".html")) init.headers = { Accept: "text/html" };
  const res = asDirectResponse(await fetch(href, init));
  if (!res || !res.ok || res.type === "error") return;
  await cache.put(href, res);
}

async function pumpFill() {
  if (fillBusy) return;
  fillBusy = true;
  try {
    while (fillQueue.length) {
      while (fillPaused) await sleep(400);
      const href = fillQueue.shift();
      if (!href) continue;
      try {
        await cacheFillUrl(href);
      } catch {
        /* quota / network — skip */
      }
    }
  } finally {
    fillBusy = false;
  }
}

async function startLocaleFill(locale, skipHeavy) {
  if (typeof locale !== "string" || !/^[A-Za-z0-9-]+$/.test(locale)) return;
  let manifest;
  try {
    manifest = await (await fetch(FILL_PRECACHE, { cache: "no-store" })).json();
  } catch {
    return;
  }
  enqueueFill(manifest.core || []);
  const chrome = manifest.chromeByLocale || {};
  enqueueFill(chrome[locale] || []);
  for (const [other, urls] of Object.entries(chrome)) {
    if (other === locale) continue;
    enqueueFill(urls);
  }
  enqueueFill((manifest.toolsByLocale && manifest.toolsByLocale[locale]) || []);
  if (!skipHeavy) enqueueFill(manifest.engines || []);
  await pumpFill();
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "PRECACHE_PAUSE") {
    fillPaused = true;
    return;
  }
  if (data.type === "PRECACHE_RESUME") {
    fillPaused = false;
    event.waitUntil(pumpFill());
    return;
  }

  if (data.type === "PRECACHE_LOCALE" && typeof data.locale === "string") {
    event.waitUntil(startLocaleFill(data.locale, Boolean(data.skipHeavy)));
    return;
  }

  if (data.type !== "PRECACHE_HOME" || typeof data.url !== "string") return;
  let url;
  try {
    url = new URL(data.url, self.location.origin);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.endsWith("/")) return;
  event.waitUntil(
    (async () => {
      const res = asDirectResponse(await fetch(url.href, { headers: { Accept: "text/html" }, cache: "no-store" }));
      if (!isUsableHtml(res)) return;
      const cache = await caches.open(CACHE);
      await cache.put(url.href, res.clone());
      await cache.put(LAST_HOME, res);
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (!url.protocol.startsWith("http")) return;
  if (url.origin !== self.location.origin) return;
  // Next client navigations/prefetches must hit the network as-is. Caching or
  // replaying them as documents is how a Flight payload can paint as the page.
  if (isRscRequest(req)) return;

  if (req.mode === "navigate" || req.destination === "document") {
    if (/\.txt$/i.test(url.pathname)) {
      const dest = new URL(htmlPathFromTxt(url.pathname) + url.search, url.origin).href;
      event.respondWith(navigateDocument(req, dest));
      return;
    }
    event.respondWith(navigateDocument(req));
    return;
  }

  if (isIconOrManifest(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const direct = asDirectResponse(res);
          if (direct.ok) {
            const copy = direct.clone();
            event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
          }
          return direct;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const direct = asDirectResponse(res);
            if (direct.ok) {
              const copy = direct.clone();
              event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
            }
            return direct;
          })
      )
    );
  }
});
