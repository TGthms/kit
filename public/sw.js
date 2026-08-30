/* Kit service worker — app shell only; never cache user files or RSC payloads.
   A new worker must wait for existing tabs to close. Taking over mid-navigation
   (skipWaiting + clients.claim) can orphan a navigate fetch and wedge the page. */
const CACHE = "kit-shell-v6";
const PRECACHE = ["./", "./manifest.webmanifest"];
const NAV_FETCH_MS = 8000;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
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
  return /\.(js|css|woff2?)$/u.test(url.pathname);
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
  const cached = await caches.match(req);
  if (cached && isHtmlResponse(cached)) return cached;
  const shell = await caches.match("./");
  if (shell && isHtmlResponse(shell)) return shell;
  return cached || Response.error();
}

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
      const dest = htmlPathFromTxt(url.pathname) + url.search;
      event.respondWith(Response.redirect(new URL(dest, url.origin), 303));
      return;
    }
    event.respondWith(
      (async () => {
        try {
          const res = await deadlineFetch(req);
          if (res.ok && isHtmlResponse(res)) {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
            return res;
          }
          if (!isHtmlResponse(res)) {
            const retry = await deadlineFetch(req.url, { headers: { Accept: "text/html" }, cache: "no-store" });
            if (retry.ok && isHtmlResponse(retry)) return retry;
          }
          return res;
        } catch {
          return cachedNavigation(req);
        }
      })()
    );
    return;
  }

  if (isIconOrManifest(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
          }
          return res;
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
            if (res.ok) {
              const copy = res.clone();
              event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
            }
            return res;
          })
      )
    );
  }
});
