import { readFileSync } from "node:fs";
import { createHash, webcrypto } from "node:crypto";
import vm from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.useRealTimers());

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
function load({ stores = new Map<string, Map<string, Response>>(), build = generation, active = false, scope = "/" } = {}) {
  const currentManifest = { ...manifest, generation: build };
  const fetched: string[] = [];
  const writeErrors = new Map<string, Error>();
  const messages: Record<string, unknown>[] = [];
  const handlers: Record<string, (event: unknown) => void> = {};
  const overrides = new Map<string, Response | Error | ((init?: RequestInit) => Response)>();
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
      async put(input: string | Request, response: Response) {
        const error = writeErrors.get(new URL(key(input)).pathname);
        if (error) throw error;
        store.set(key(input), response.clone());
      },
      async delete(input: string | Request) { return store.delete(key(input)); },
      async keys() { return [...store.keys()].map((url) => new Request(url)); },
      async add() {},
    };
  };
  let activations = 0;
  const self = { location: { origin }, registration: { scope: `${origin}${scope}`, active: active ? { state: "activated" } : null },
    clients: { matchAll: async () => windows },
    addEventListener: (type: string, handler: (event: unknown) => void) => { handlers[type] = handler; },
    skipWaiting: async () => { activations++; },
  };
  const context = vm.createContext({ self, URL, Response, Headers, Request, AbortController, AbortSignal, DOMException, Uint8Array, crypto: webcrypto, console, setTimeout, clearTimeout, setInterval, clearInterval,
    caches: { open, keys: async () => [...stores.keys()], delete: async (name: string) => stores.delete(name) },
    fetch: async (input: string | Request, init?: RequestInit) => {
      const url = new URL(key(input));
      fetched.push(url.pathname);
      const override = overrides.get(url.pathname);
      if (override instanceof Error) throw override;
      if (typeof override === "function") return override(init);
      if (override) return override.clone();
      if (url.pathname === "/sw-precache.json") return Response.json(currentManifest);
      const file = files[url.pathname];
      return file ? new Response(file[0], { headers: { "content-type": file[1] } }) : new Response("Missing", { status: 404 });
    },
  });
  vm.runInContext(source.replace(generation, build), context);
  const worker = context as unknown as {
    downloadSelectedOffline(data: typeof selection): Promise<void>;
    matchesBuild(url: string, response: Response): Promise<boolean>;
    stageRelease(value: typeof manifest): Promise<void>;
    offlineState(): Promise<{ generation: string; tools: Record<string, number>; pendingUpdate: boolean; plan: { tools: string[]; ready: boolean }; job: { status: string; done: number } }>;
    downloadResponse(url: string): Promise<Response>;
    verifyOffline(locale: string, requested?: typeof selection): Promise<void>;
    pumpFill(): Promise<void>;
    enqueueFill(urls: string[]): void;
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
  const lifecycle = async (type: string) => {
    let pending: Promise<unknown> | undefined;
    handlers[type]({ waitUntil: (promise: Promise<unknown>) => { pending = promise; } });
    await pending;
  };
  const resource = async (url: string) => {
    let pending: Promise<Response> | undefined;
    handlers.fetch({ request: new Request(`${origin}${url}`), waitUntil: () => {}, respondWith: (promise: Promise<Response>) => { pending = promise; } });
    return pending;
  };
  return { worker, stores, open, messages, overrides, windows, message, lifecycle, resource, fetched, writeErrors, activations: () => activations };
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
  it("accepts Cloudflare's deployed analytics injection while verifying the original HTML", async () => {
    const run = load();
    const beacon = `<!-- Cloudflare Pages Analytics --><script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "${"a".repeat(32)}"}'></script><!-- Cloudflare Pages Analytics -->`;
    for (const path of ["/", "/en/", "/en/tools/pdf-merge/"]) run.overrides.set(path, new Response(html.replace("</body>", `${beacon}</body>`), { headers: { "content-type": "text/html" } }));
    await run.worker.stageRelease(manifest);
    await run.worker.downloadSelectedOffline(selection);
    expect(run.messages.some((message) => message.status === "complete")).toBe(true);
  });
  it.each(["tampered page", "unrecognized script", "extra script attribute"])("still rejects %s alongside an analytics block", async (kind) => {
    const run = load();
    let beacon = `<!-- Cloudflare Pages Analytics --><script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "${"a".repeat(32)}"}'></script><!-- Cloudflare Pages Analytics -->`;
    if (kind === "unrecognized script") beacon = beacon.replace("static.cloudflareinsights.com", "untrusted.test");
    if (kind === "extra script attribute") beacon = beacon.replace("defer src", 'defer onload="unexpected()" src');
    const page = (kind === "tampered page" ? html.replace("New Kit", "Old Kit") : html).replace("</body>", `${beacon}</body>`);
    run.overrides.set("/en/", new Response(page, { headers: { "content-type": "text/html" } }));
    await expect(run.worker.stageRelease(manifest)).rejects.toThrow();
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

describe("suspension, progress, and release handoff", () => {
  it("settles a paused fill instead of keeping an old worker event alive forever", async () => {
    const run = load();
    run.worker.enqueueFill(["/en/"]);
    await run.message({ type: "PRECACHE_PAUSE" });
    await run.worker.pumpFill();
    expect(run.fetched).toEqual([]);
    await run.message({ type: "PRECACHE_RESUME" });
    expect(await (await run.open(shellName)).match("/en/")).toBeTruthy();
  });

  it("preserves earlier completed choices when a later download fails", async () => {
    const run = load();
    await run.worker.downloadSelectedOffline({ ...selection, tools: [] });
    run.overrides.set("/en/tools/pdf-merge/", new Error("offline"));
    await run.worker.downloadSelectedOffline({ ...selection, requestId: "failed-job" });
    const marker = await (await (await run.open(shellName)).match("/offline-update-ready"))?.json();
    expect(marker.requestId).toBe("request-1");
    expect(marker.selection.tools).toEqual([]);
    expect((await run.worker.offlineState()).plan.ready).toBe(true);
  });

  it("keeps prior tools when downloading just app pages later", async () => {
    const run = load();
    await run.worker.downloadSelectedOffline(selection);
    await run.worker.downloadSelectedOffline({ ...selection, requestId: "extra", tools: [] });
    expect((await run.worker.offlineState()).plan.tools).toEqual(["pdf-merge"]);
  });

  it("recovers an interrupted job after the worker process is terminated", async () => {
    const run = load();
    await run.lifecycle("install");
    await (await run.open(shellName)).put("/offline-job", Response.json({ status: "running", requestId: "suspended", done: 3, total: 6, selection }));
    const restarted = load({ stores: run.stores });
    expect((await restarted.worker.offlineState()).job).toMatchObject({ status: "interrupted", done: 3 });
    await restarted.worker.downloadSelectedOffline(selection);
    expect((await restarted.worker.offlineState()).job.status).toBe("complete");
  });

  it("does not advertise tool availability when its runtime is missing", async () => {
    const run = load();
    await run.worker.downloadSelectedOffline(selection);
    await (await run.open(shellName)).delete(script);
    const state = await run.worker.offlineState();
    expect(state.tools).toEqual({});
    expect(state.plan.ready).toBe(false);
    expect((await run.message({ type: "ACTIVATE_UPDATE", requestId: selection.requestId }))[0].ok).toBe(false);
  });

  it("reports quota failures and releases the job so a retry can succeed", async () => {
    const run = load();
    run.writeErrors.set(script, new DOMException("full", "QuotaExceededError"));
    await run.worker.downloadSelectedOffline(selection);
    expect(run.messages.some((item) => item.status === "complete")).toBe(false);
    expect(run.messages.some((item) => item.status === "error")).toBe(true);
    run.writeErrors.clear();
    await run.worker.downloadSelectedOffline(selection);
    expect(run.messages.some((item) => item.status === "complete")).toBe(true);
  });

  it("continues serving a complete previous release when saved choices change after staging", async () => {
    const first = load({ build: "aaaaaaaaaaaa", active: true });
    await first.lifecycle("install");
    await first.lifecycle("activate");
    await first.worker.downloadSelectedOffline({ ...selection, tools: [] });
    const next = load({ stores: first.stores, active: true });
    await next.lifecycle("install");
    // Another tab finishes saving a tool after the next worker was installed.
    await first.worker.downloadSelectedOffline(selection);
    await next.lifecycle("activate");
    const held = await next.worker.offlineState();
    expect(held.generation).toBe("aaaaaaaaaaaa");
    expect(held.pendingUpdate).toBe(true);
    expect(held.tools["pdf-merge"]).toBe(1);
    expect(first.stores.has("kit-shell-aaaaaaaaaaaa")).toBe(true);
    expect((await next.message({ type: "OFFLINE_HAS", url: `${origin}/en/tools/pdf-merge/` }))[0].held).toBe(true);
    // Explicit repair/update prepares the new release, then switches atomically.
    await next.worker.downloadSelectedOffline(selection);
    expect(next.messages.find((item) => item.status === "complete")).toMatchObject({ activationRequired: true });
    expect((await next.message({ type: "ACTIVATE_UPDATE", requestId: selection.requestId }))[0]).toMatchObject({ ok: true, applied: true });
    expect((await next.worker.offlineState()).generation).toBe(generation);
    expect(first.stores.has("kit-shell-aaaaaaaaaaaa")).toBe(false);
  });

  it("copies identical verified files instead of redownloading engines and runtime", async () => {
    const first = load({ build: "aaaaaaaaaaaa" });
    await first.lifecycle("install");
    await first.lifecycle("activate");
    await first.worker.downloadSelectedOffline(selection);
    const next = load({ stores: first.stores });
    await next.lifecycle("install");
    expect(next.fetched).not.toContain(script);
    expect(next.fetched).not.toContain("/en/tools/pdf-merge/");
    await next.lifecycle("activate");
    expect((await next.worker.offlineState()).plan).toMatchObject({ generation, version: "2.0.0", ready: true });
  });

  it("does not restore removals from a waiting cache or a restarted background fill", async () => {
    const first = load({ build: "aaaaaaaaaaaa" });
    await first.lifecycle("install");
    await first.lifecycle("activate");
    await first.worker.downloadSelectedOffline(selection);
    const next = load({ stores: first.stores });
    await next.lifecycle("install");
    await first.worker.removeOffline({ tools: ["pdf-merge"] });
    expect(await (await next.open(shellName)).match("/en/tools/pdf-merge/")).toBeFalsy();
    const restarted = load({ stores: first.stores, build: "aaaaaaaaaaaa" });
    restarted.worker.enqueueFill(["/en/tools/pdf-merge/"]);
    await restarted.worker.pumpFill();
    expect(restarted.fetched).not.toContain("/en/tools/pdf-merge/");
    await next.lifecycle("activate");
    expect((await next.worker.offlineState()).tools["pdf-merge"]).toBeUndefined();
  });

  it("serves saved PDF ancillary assets without falling through to the network", async () => {
    const run = load();
    const font = "/vendor/pdfjs/standard_fonts/FoxitSerif.pfb";
    await (await run.open(shellName)).put(font, new Response("font bytes"));
    const response = await run.resource(font);
    expect(await response?.text()).toBe("font bytes");
    expect(run.fetched).toEqual([]);
  });
});

describe("download stream deadlines and cancellation", () => {
  it("bounds a body that stalls after successful headers", async () => {
    vi.useFakeTimers();
    const run = load();
    run.overrides.set(script, () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1])); } }), { headers: { "content-type": "text/javascript" } }));
    const pending = run.worker.downloadSelectedOffline(selection);
    await vi.waitFor(() => expect(run.messages.some((item) => item.status === "running")).toBe(true));
    await vi.advanceTimersByTimeAsync(120_001);
    await pending;
    expect(run.messages.some((item) => item.status === "complete")).toBe(false);
    expect(run.messages.at(-2)?.status).toBe("error");
  });

  it("cancels the current stream, keeps completed files, and resumes on retry", async () => {
    const run = load();
    run.overrides.set(script, (init) => new Response(new ReadableStream({
      start(controller) {
        init?.signal?.addEventListener("abort", () => controller.error(new DOMException("Canceled", "AbortError")), { once: true });
      },
    }), { headers: { "content-type": "text/javascript" } }));
    const pending = run.worker.downloadSelectedOffline(selection);
    await vi.waitFor(() => expect(run.fetched).toContain(script));
    await run.message({ type: "OFFLINE_CANCEL", requestId: selection.requestId });
    await pending;
    expect(run.messages.some((item) => item.status === "canceled")).toBe(true);
    expect(run.messages.some((item) => item.status === "complete")).toBe(false);
    expect(await (await run.open(shellName)).match("/en/")).toBeTruthy();
    run.overrides.clear(); run.fetched.length = 0;
    await run.worker.downloadSelectedOffline(selection);
    expect(run.fetched).toEqual([script]);
    expect(run.messages.some((item) => item.status === "complete")).toBe(true);
  });
});
it("does not overwrite newly selected tools with the previous release's plan during activation", async () => {
  const first = load({ build: "aaaaaaaaaaaa" });
  await first.lifecycle("install"); await first.lifecycle("activate");
  await first.worker.downloadSelectedOffline({ ...selection, tools: [] });
  const next = load({ stores: first.stores });
  await next.lifecycle("install");
  await next.worker.downloadSelectedOffline({ ...selection, requestId: "new-choice" });
  await next.lifecycle("activate");
  const marker = await (await (await next.open(shellName)).match("/offline-update-ready"))?.json();
  expect(marker).toMatchObject({ requestId: "new-choice", selection: { tools: ["pdf-merge"] } });
});
it("resolves the downloaded manifest against the worker scope on a base-path installation", async () => {
  const run = load({ scope: "/kit/" });
  run.overrides.set("/kit/sw-precache.json", Response.json(manifest));
  const response = await run.worker.downloadResponse("./sw-precache.json");
  expect((await response.json()).generation).toBe(generation);
  expect(run.fetched).toEqual(["/kit/sw-precache.json"]);
});
it("checks actual cached contents without the network and lets repair replace a damaged file", async () => {
  const run = load();
  await run.lifecycle("install");
  await run.worker.downloadSelectedOffline(selection);
  const cache = await run.open(shellName);
  await cache.put(script, new Response("damaged cached script", { headers: { "content-type": "text/javascript" } }));
  run.fetched.length = 0;
  await run.worker.verifyOffline("en", selection);
  expect(run.fetched).toEqual([]);
  expect(await cache.match(script)).toBeFalsy();
  expect((await run.worker.offlineState()).plan.ready).toBe(false);
  await run.worker.downloadSelectedOffline(selection);
  expect(await (await cache.match(script))?.text()).toBe("new script");
  expect((await run.worker.offlineState()).plan.ready).toBe(true);
});
it("recovers an evicted selection record from the client intent after verifying its files", async () => {
  const run = load();
  await run.lifecycle("install");
  await run.worker.downloadSelectedOffline(selection);
  const cache = await run.open(shellName);
  await cache.delete("/offline-update-ready");
  await run.worker.verifyOffline("en", selection);
  expect((await run.worker.offlineState()).plan).toMatchObject({ ready: true, tools: ["pdf-merge"] });
});
it("can cancel a download queued behind a stalled verification", async () => {
  vi.useFakeTimers();
  const run = load();
  await run.lifecycle("install");
  await run.worker.downloadSelectedOffline(selection);
  await (await run.open(shellName)).put(script, new Response(new ReadableStream({ start() {} }), { headers: { "content-type": "text/javascript" } }));
  const check = expect(run.worker.verifyOffline("en", selection)).rejects.toThrow("timed out");
  const pending = run.worker.downloadSelectedOffline({ ...selection, requestId: "queued" });
  await run.message({ type: "OFFLINE_CANCEL", requestId: "queued" });
  await pending;
  expect(run.messages.some((item) => item.requestId === "queued" && item.status === "canceled")).toBe(true);
  await vi.advanceTimersByTimeAsync(30_001);
  await check;
});
it("does not delete a newer staged release while retiring the serving ancestor", async () => {
  const first = load({ build: "aaaaaaaaaaaa", active: true });
  await first.lifecycle("install"); await first.lifecycle("activate");
  await first.worker.downloadSelectedOffline({ ...selection, tools: [] });
  const next = load({ stores: first.stores, active: true });
  await next.lifecycle("install");
  await first.worker.downloadSelectedOffline(selection);
  await next.lifecycle("activate"); // next preserves the previous serving release
  const newer = load({ stores: first.stores, build: "cccccccccccc" });
  await newer.lifecycle("install");
  await next.worker.downloadSelectedOffline(selection);
  await next.message({ type: "ACTIVATE_UPDATE", requestId: selection.requestId });
  expect(first.stores.has("kit-shell-aaaaaaaaaaaa")).toBe(false);
  expect(first.stores.has("kit-shell-cccccccccccc")).toBe(true);
  expect(await (await newer.open("kit-shell-cccccccccccc")).match("/en/tools/pdf-merge/")).toBeTruthy();
});
