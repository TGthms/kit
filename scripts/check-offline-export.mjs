/** Exercise the shipped worker against the real static export, including cold
 * slashless Next route requests. No server, browser profile or network needed.
 * This checks worker/storage protocol behavior, not a physical WebKit launch. */
import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import vm from "node:vm";

const directory = resolve(process.argv[2] || "out");
const originalManifest = JSON.parse(readFileSync(resolve(directory, "sw-precache.json"), "utf8"));
const source = readFileSync(resolve(directory, "sw.js"), "utf8");
const root = originalManifest.core.find((url) => url.endsWith("/"));
assert(root, "The export must include its startup route");
const origin = "https://offline-export.test";
const scope = `${origin}${root}`;
const stores = new Map();
const events = [];
let online = true;
let networkAttempts = 0;
let currentManifest = originalManifest;
const changedFiles = new Map();
const key = (input) => new URL(typeof input === "string" || input instanceof URL ? input : input.url, scope).href;

function diskFile(pathname) {
  assert(pathname.startsWith(root), `Outside app scope: ${pathname}`);
  const relative = pathname.slice(root.length);
  const path = resolve(directory, relative.endsWith("/") || !relative ? `${relative}index.html` : relative);
  assert(path.startsWith(`${directory}${sep}`), `Outside export: ${pathname}`);
  return path;
}
function bytes(pathname) { return changedFiles.get(pathname) || readFileSync(diskFile(pathname)); }
function contentType(path) {
  if (path.endsWith("/") || path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (/\.(?:js|mjs)$/u.test(path)) return "text/javascript";
  if (path.endsWith(".css")) return "text/css";
  return "application/octet-stream";
}
const caches = {
  async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async match(input, options) {
        const wanted = key(input);
        const held = options?.ignoreSearch
          ? [...store].find(([url]) => url.split("?")[0] === wanted.split("?")[0])?.[1]
          : store.get(wanted);
        return held ? new Response(held.body, held.init) : undefined;
      },
      async put(input, response) {
        store.set(key(input), { body: new Uint8Array(await response.arrayBuffer()),
          init: { status: response.status, statusText: response.statusText, headers: Object.fromEntries(response.headers) } });
      },
      async delete(input) { return store.delete(key(input)); },
      async keys() { return [...store.keys()].map((url) => new Request(url)); },
    };
  },
  async keys() { return [...stores.keys()]; },
  async delete(name) { return stores.delete(name); },
};

function worker(build = originalManifest.generation) {
  const handlers = {};
  const client = { id: "app-window", url: `${scope}en/settings/offline/`, postMessage: (data) => events.push(data) };
  const context = vm.createContext({
    self: { location: { origin }, registration: { scope, active: { state: "activated" } },
      clients: { matchAll: async () => [client] }, skipWaiting: async () => {},
      addEventListener: (type, handler) => { handlers[type] = handler; } },
    caches, URL, Request, Response, Headers, AbortController, AbortSignal, DOMException, Uint8Array,
    crypto: webcrypto, console, setTimeout, clearTimeout, setInterval, clearInterval,
    fetch: async (input) => {
      networkAttempts++;
      if (!online) throw new TypeError("Network disabled by offline export check");
      const path = new URL(key(input)).pathname;
      if (path === `${root}sw-precache.json`) return Response.json(currentManifest);
      try { return new Response(bytes(path), { headers: { "content-type": contentType(path) } }); }
      catch { return new Response("Missing", { status: 404 }); }
    },
  });
  vm.runInContext(source.replace(`const BUILD = "${originalManifest.generation}";`, `const BUILD = "${build}";`), context);
  return {
    api: context,
    async lifecycle(type) {
      let pending;
      handlers[type]({ waitUntil: (value) => { pending = value; } });
      await pending;
    },
    async request(path, { method = "GET", rsc = false, document = false } = {}) {
      let response;
      const pending = [];
      const request = { url: `${origin}${path}`, method, headers: new Headers(rsc ? { RSC: "1" } : {}),
        mode: document ? "navigate" : "cors", destination: document ? "document" : "" };
      handlers.fetch({ request, clientId: client.id, resultingClientId: client.id,
        respondWith: (value) => { response = value; }, waitUntil: (value) => pending.push(value) });
      const result = await response;
      await Promise.all(pending);
      assert(result, `No worker response for ${method} ${path}`);
      return result;
    },
  };
}

const languages = ["en", "ar"].filter((locale) => originalManifest.chromeByLocale[locale]);
const toolSegments = originalManifest.toolsByLocale.en.map((url) => url.split("/tools/")[1].replace(/\/$/u, ""));
const selection = { requestId: "export-check", locales: languages, tools: toolSegments,
  pages: Object.keys(originalManifest.pagesByLocale.en), engines: true };
const initial = worker();
await initial.lifecycle("install");
await initial.lifecycle("activate");
await initial.api.downloadSelectedOffline(selection);
assert(events.some((event) => event.status === "complete"), "All-tool download failed");
assert((await initial.api.offlineState()).plan.ready, "Downloaded selection is not verified");

async function checkColdRoutes() {
  online = false;
  const cold = worker(currentManifest.generation);
  const attempts = networkAttempts;
  let count = 0;
  for (const locale of languages) {
    for (const route of currentManifest.toolsByLocale[locale]) {
      const slashless = route.replace(/\/$/u, "");
      const suffix = "?from=%2F&_rsc=unvisited";
      const flight = await cold.request(`${slashless}.txt${suffix}`, { rsc: true });
      assert.equal(flight.status, 200, `Cold Flight failed: ${route}`);
      assert.deepEqual(Buffer.from(await flight.arrayBuffer()), Buffer.from(bytes(`${route}index.txt`)), `Wrong Flight: ${route}`);
      const document = await cold.request(`${slashless}${suffix}`, { document: true });
      assert.equal(document.status, 200, `Cold document failed: ${route}`);
      assert.deepEqual(Buffer.from(await document.arrayBuffer()), Buffer.from(bytes(route)), `Wrong document: ${route}`);
      const head = await cold.request(slashless, { method: "HEAD" });
      assert.equal(head.status, 200, `Cold HEAD failed: ${route}`);
      assert.equal(await head.text(), "");
      count++;
    }
  }
  for (const path of [...currentManifest.core, ...currentManifest.engines].filter((path) => /\.(?:js|mjs|css|woff2?|gz|wasm)$/u.test(path))) {
    const response = await cold.request(path);
    assert.equal(response.status, 200, `Missing runtime: ${path}`);
    const hash = createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex");
    assert.equal(hash, currentManifest.integrity[path], `Wrong runtime: ${path}`);
  }
  assert.equal(networkAttempts, attempts, "A saved cold route or runtime still needed the network");
  return count;
}
const initialRoutes = await checkColdRoutes();

// Stage a second release with genuinely changed HTML, Flight and JavaScript
// bodies. Every integrity hash is updated; old caches must not mask a miss.
online = true;
const build = createHash("sha256").update(`${originalManifest.generation}:offline-check`).digest("hex").slice(0, 12);
currentManifest = structuredClone(originalManifest);
currentManifest.generation = build;
for (const path of Object.keys(currentManifest.integrity)) {
  if (path.endsWith("/")) changedFiles.set(path, Buffer.concat([Buffer.from("<!-- next release -->"), bytes(path)]));
  else if (path.endsWith(".txt")) changedFiles.set(path, Buffer.concat([bytes(path), Buffer.from("\n")]));
  else if (path.endsWith(".js")) changedFiles.set(path, Buffer.concat([bytes(path), Buffer.from("\n/* next release */\n")]));
  if (changedFiles.has(path)) currentManifest.integrity[path] = createHash("sha256").update(changedFiles.get(path)).digest("hex");
}
const update = worker(build);
await update.lifecycle("install");
await update.lifecycle("activate");
assert.equal((await update.api.offlineState()).generation, build);
assert((await update.api.offlineState()).plan.ready, "Updated collection is incomplete");
const updatedRoutes = await checkColdRoutes();
const damaged = currentManifest.toolsByLocale[languages.at(-1)][0];
await (await caches.open(`kit-shell-${build}`)).delete(damaged);
const fallback = await worker(build).request(damaged.replace(/\/$/u, ""), { document: true });
assert.equal(fallback.status, 503, "An evicted tool must not silently show Home");
const recovery = await fallback.text();
assert(recovery.includes(`${root}${languages.at(-1)}/settings/offline/`), "Recovery must link to the local offline manager");
assert(recovery.includes(currentManifest.offlineCopy[languages.at(-1)].title), "Recovery must retain the app language");
console.log(`[offline-export] ${initialRoutes} cold tool routes before update, ${updatedRoutes} after update; ${languages.join("/")}; HTML, Flight, HEAD and all runtimes passed with network disabled`);
