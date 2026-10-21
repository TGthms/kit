import { readFileSync } from "node:fs";
import { createHash, webcrypto } from "node:crypto";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const source = readFileSync("public/sw.js", "utf8").replace('__KIT_BUILD__', 'bbbbbbbbbbbb');
const origin = "https://kit.test";
const generation = "bbbbbbbbbbbb";
const shellName = `kit-shell-${generation}`;
const rscName = `kit-rsc-${generation}`;
const script = "/_next/static/app.js";
const html = `<!doctype html><html><head><script src="${script}"></script></head><body>New Kit</body></html>`;
const files: Record<string, [string, string]> = {
  "/": [html, "text/html"], "/en/": [html, "text/html"],
  "/en/index.txt": ["new flight", "text/plain"],
  [script]: ["new script", "text/javascript"],
  "/en/tools/pdf-merge/": [html, "text/html"],
  "/en/tools/pdf-merge/index.txt": ["new tool flight", "text/plain"],
};
const manifest = {
  generation, version: "2.0.0", core: ["/", script], engines: [],
  chromeByLocale: { en: ["/en/"] }, toolsByLocale: { en: ["/en/tools/pdf-merge/"] },
  rscByLocale: { en: ["/en/index.txt", "/en/tools/pdf-merge/index.txt"] },
  pagesByLocale: { en: { home: ["/en/"] } }, extrasByLocale: {},
  integrity: Object.fromEntries(Object.entries(files).map(([url, [body]]) => [url, createHash("sha256").update(body).digest("hex")])),
};
const selection = { requestId: "request-1", locales: ["en"], tools: ["pdf-merge"], pages: ["home"], engines: false };
function load() {
  const stores = new Map<string, Map<string, Response>>();
  const messages: Record<string, unknown>[] = [];
  const handlers: Record<string, (event: unknown) => void> = {};
  const overrides = new Map<string, Response | Error>();
  const windows = [{ id: "current", url: `${origin}/en/settings/offline/`, postMessage: (data: Record<string, unknown>) => messages.push(data) }];
  const key = (input: string | Request) => new URL(typeof input === "string" ? input : input.url, `${origin}/`).href;
  const open = async (name: string) => {
    let store = stores.get(name);
    if (!store) { store = new Map(); stores.set(name, store); }
    return {
      async match(input: string | Request, options?: { ignoreSearch?: boolean }) {
        const wanted = key(input);
        const value = options?.ignoreSearch ? [...store.entries()].find(([url]) => url.split("?")[0] === wanted.split("?")[0])?.[1] : store.get(wanted);
        return value?.clone();
      },
      async put(input: string | Request, response: Response) { store.set(key(input), response.clone()); },
      async delete(input: string | Request) { return store.delete(key(input)); },
      async keys() { return [...store.keys()].map((url) => new Request(url)); },
      async add() {},
    };
  };
  let activations = 0;
  const self = { location: { origin }, registration: { scope: `${origin}/` },
    clients: { matchAll: async () => windows },
    addEventListener: (type: string, handler: (event: unknown) => void) => { handlers[type] = handler; },
    skipWaiting: async () => { activations++; },
  };
  const context = vm.createContext({ self, URL, Response, Request, AbortController, AbortSignal, DOMException, Uint8Array, crypto: webcrypto, console, setTimeout, clearTimeout,
    caches: { open, keys: async () => [...stores.keys()], delete: async (name: string) => stores.delete(name) },
    fetch: async (input: string | Request) => {
      const url = new URL(key(input));
      const override = overrides.get(url.pathname);
      if (override instanceof Error) throw override;
      if (override) return override.clone();
      if (url.pathname === "/sw-precache.json") return Response.json(manifest);
      const file = files[url.pathname];
      return file ? new Response(file[0], { headers: { "content-type": file[1] } }) : new Response("Missing", { status: 404 });
    },
  });
  vm.runInContext(source, context);
  const worker = context as unknown as {
    downloadSelectedOffline(data: typeof selection): Promise<void>;
    matchesBuild(url: string, response: Response): Promise<boolean>;
    stageRelease(value: typeof manifest): Promise<void>;
    offlineState(): Promise<{ tools: Record<string, number> }>;
    removeOffline(scope: { all?: boolean; tools?: string[] }): Promise<void>;
    cachedExactNavigation(req: Request): Promise<Response>;
  };
  const message = async (data: Record<string, unknown>) => {
    let pending: Promise<unknown> | undefined;
    const replies: Record<string, unknown>[] = [];
    handlers.message({ data, source: windows[0], ports: [{ postMessage: (reply: Record<string, unknown>) => replies.push(reply) }], waitUntil: (promise: Promise<unknown>) => { pending = promise; } });
    await pending;
    return replies;
  };
  return { worker, stores, open, messages, overrides, windows, message, activations: () => activations };
}

describe("offline release transactions", () => {
  it("can serve the installed entry before Cache Storage or the network opens", async () => {
    const handlers: Record<string, (event: unknown) => void> = {};
    const cacheOpen = () => { throw new Error("cold cache must not be touched"); };
    const entry = "<!doctype html><html><body>Kit loading</body></html>";
    const embedded = source.replace('const ENTRY_HTML = "__KIT_ENTRY_HTML__";', `const ENTRY_HTML = ${JSON.stringify(entry)};`);
    vm.runInNewContext(embedded, {
      self: { location: { origin }, registration: { scope: `${origin}/kit/` }, addEventListener: (type: string, handler: (event: unknown) => void) => { handlers[type] = handler; } },
      caches: { open: cacheOpen }, URL, Response,
    });
    let response: Response | undefined;
    handlers.fetch({ request: { method: "GET", url: `${origin}/kit/?preview=1`, headers: new Headers(), mode: "navigate" }, respondWith: (value: Response) => { response = value; } });
    expect(await response?.text()).toBe(entry);
    expect(response?.headers.get("content-type")).toBe("text/html; charset=utf-8");
  });

  it("saves one verified release and reports its actual version and request", async () => {
    const run = load();
    await run.worker.downloadSelectedOffline(selection);
    expect(run.messages.find((m) => m.status === "complete")).toMatchObject({ generation, version: "2.0.0", requestId: "request-1", done: 6, total: 6 });
    expect(await (await run.open(shellName)).match("/offline-update-ready")).toBeTruthy();
    expect(await (await run.open(rscName)).match("/en/tools/pdf-merge/index.txt")).toBeTruthy();
  });
  it.each(["missing", "wrong build", "html fallback", "offline"])("does not claim readiness when a resource is %s", async (kind) => {
    const run = load();
    run.overrides.set(script, kind === "offline" ? new Error("offline") : kind === "missing" ? new Response("missing", { status: 404 }) : new Response(kind === "html fallback" ? html : "old script", { headers: { "content-type": kind === "html fallback" ? "text/html" : "text/javascript" } }));
    await run.worker.downloadSelectedOffline(selection);
    expect(run.messages.some((m) => m.status === "complete")).toBe(false);
    expect(run.messages.some((m) => m.status === "error")).toBe(true);
    expect(await (await run.open(shellName)).match("/offline-update-ready")).toBeFalsy();
    expect(await (await run.open(shellName)).match(script)).toBeFalsy();
  });
  it("does not advertise a tool whose navigation payload is missing", async () => {
    const run = load();
    run.overrides.set("/en/tools/pdf-merge/index.txt", new Error("offline"));
    await run.worker.downloadSelectedOffline(selection);
    expect((await run.worker.offlineState()).tools["pdf-merge"]).toBeUndefined();
  });
  it("retries only missing resources after a failed download", async () => {
    const run = load();
    run.overrides.set(script, new Error("offline"));
    await run.worker.downloadSelectedOffline(selection);
    run.overrides.clear();
    run.messages.length = 0;
    await run.worker.downloadSelectedOffline(selection);
    expect(run.messages.find((m) => m.status === "complete")).toMatchObject({ done: 6, total: 6 });
  });
  it("refuses activation before a verified download or with another Kit window open", async () => {
    const run = load();
    expect((await run.message({ type: "ACTIVATE_UPDATE", requestId: "request-1" }))[0].ok).toBe(false);
    await run.worker.downloadSelectedOffline(selection);
    run.windows.push({ ...run.windows[0], id: "another" });
    expect((await run.message({ type: "ACTIVATE_UPDATE", requestId: "request-1" }))[0].ok).toBe(false);
    expect(run.activations()).toBe(0);
    run.windows.pop();
    expect((await run.message({ type: "ACTIVATE_UPDATE", requestId: "request-1" }))[0].ok).toBe(true);
    expect(run.activations()).toBe(1);
  });
  it("prepares startup HTML, CSS/JS dependencies, and payload before activation", async () => {
    const run = load();
    await run.worker.stageRelease(manifest);
    const cache = await run.open(shellName);
    expect(await cache.match("/")).toBeTruthy();
    expect(await cache.match("/en/")).toBeTruthy();
    expect(await cache.match(script)).toBeTruthy();
    expect(await (await run.open(rscName)).match("/en/index.txt")).toBeTruthy();
  });
  it("carries explicit saved choices to the new release without touching the old cache", async () => {
    const run = load();
    const old = await run.open("kit-shell-aaaaaaaaaaaa");
    await old.put("/offline-update-ready", Response.json({ selection, at: 1 }));
    await old.put("/en/", new Response("Old Kit"));
    await run.worker.stageRelease(manifest);
    expect(await (await run.open(shellName)).match("/en/tools/pdf-merge/")).toBeTruthy();
    expect(await (await old.match("/en/"))?.text()).toBe("Old Kit");
  });
  it("removed downloads do not come back in the next release", async () => {
    const run = load();
    await run.worker.downloadSelectedOffline(selection);
    await run.worker.removeOffline({ tools: ["pdf-merge"] });
    const cache = await run.open(shellName);
    const marker = await (await cache.match("/offline-update-ready"))?.json();
    expect(marker.selection.tools).toEqual([]);
    expect(await cache.match("/en/tools/pdf-merge/")).toBeFalsy();
    await run.worker.removeOffline({ all: true });
    expect(await cache.match("/offline-update-ready")).toBeFalsy();
  });
  it("navigation probes use the controlling release, never a different release's saved copies", async () => {
    const run = load();
    const staged = await run.open("kit-shell-aaaaaaaaaaaa");
    await staged.put("/en/", new Response(html, { headers: { "content-type": "text/html" } }));
    expect((await run.message({ type: "OFFLINE_HAS", url: `${origin}/en/` }))[0].held).toBe(false);
    await run.worker.downloadSelectedOffline(selection);
    expect((await run.message({ type: "OFFLINE_HAS", url: `${origin}/en?from=home` }))[0].held).toBe(true);
    expect((await run.message({ type: "OFFLINE_HAS", url: `${origin}/en/index.txt?from=home` }))[0].held).toBe(true);
  });
  it("a failed staged update leaves the previous offline release intact", async () => {
    const run = load();
    const old = await run.open("kit-shell-aaaaaaaaaaaa");
    await old.put("/offline-update-ready", Response.json({ selection, at: 1 }));
    await old.put("/en/", new Response("Old Kit"));
    run.overrides.set(script, new Error("connection lost"));
    await expect(run.worker.stageRelease(manifest)).rejects.toThrow();
    expect(await (await old.match("/en/"))?.text()).toBe("Old Kit");
    expect(await (await run.open(shellName)).match("/offline-update-ready")).toBeFalsy();
  });
});
