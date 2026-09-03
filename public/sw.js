/* Kit service worker — app shell only; never cache user files or RSC payloads.
   A new worker must wait for existing tabs to close. Taking over mid-navigation
   (skipWaiting + clients.claim) can orphan a navigate fetch and wedge the page.
   Safari rejects a document response from a worker if it followed HTTP redirects
   ("Response served by service worker has redirections"). Never return a
   redirect Response or a fetch() result with redirected === true. */
const CACHE = "kit-shell-v8";
const LAST_HOME = "./last-home";
const NAV_FETCH_MS = 8000;
const NAV_CACHE_MS = 2500;

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

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "PRECACHE_HOME" || typeof data.url !== "string") return;
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
