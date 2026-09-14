import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

/*
 * The worker's offline bookkeeping, exercised rather than read: the file is
 * loaded into a VM with the browser globals it expects stubbed, so removing a
 * tool or a language can be checked by what it actually takes out of the cache.
 * Reading the source would not have caught a tool whose route segment differs
 * from its id being left behind, or a removal that quietly skipped part of what
 * was downloaded.
 */
const here = dirname(fileURLToPath(import.meta.url));
const swSource = readFileSync(join(here, "../../../public/sw.js"), "utf8");

const FILL_PRECACHE = "./sw-precache.json";

/**
 * A small export: two languages, two tools, one tool that was renamed, and a
 * language that exists only as a compatibility address — the last two are the
 * shapes that caused trouble.
 */
const MANIFEST = {
  core: ["/app.js"],
  engines: ["/vendor/ffmpeg/ffmpeg-core.js"],
  chromeByLocale: {
    en: ["/en/", "/en/how/"],
    fr: ["/fr/", "/fr/how/"],
  },
  toolsByLocale: {
    en: ["/en/tools/pdf-merge/", "/en/tools/world-clock/"],
    fr: ["/fr/tools/pdf-merge/", "/fr/tools/world-clock/"],
  },
  rscByLocale: {
    en: [
      "/en/index.txt",
      "/en/how/index.txt",
      "/en/tools/pdf-merge/index.txt",
      "/en/tools/world-clock/index.txt",
    ],
    fr: [
      "/fr/index.txt",
      "/fr/how/index.txt",
      "/fr/tools/pdf-merge/index.txt",
      "/fr/tools/world-clock/index.txt",
    ],
  },
  extrasByLocale: {
    en: ["/en/tools/timezone-converter/", "/en/tools/timezone-converter/index.txt"],
    fr: ["/fr/tools/timezone-converter/", "/fr/tools/timezone-converter/index.txt"],
    zh: ["/zh/", "/zh/how/", "/zh/index.txt", "/zh/how/index.txt"],
  },
  /* The app's own pages, grouped by the ids Offline access offers. Together
     they cover the chrome lists above, exactly as the real manifest does. */
  pagesByLocale: {
    en: { home: ["/en/"], how: ["/en/how/"], categories: [] },
    fr: { home: ["/fr/"], how: ["/fr/how/"], categories: [] },
  },
};

/** Everything a visitor could have downloaded, as pathnames. */
function fullCache() {
  const urls = [
    ...MANIFEST.core,
    ...MANIFEST.engines,
    ...Object.values(MANIFEST.chromeByLocale).flat(),
    ...Object.values(MANIFEST.toolsByLocale).flat(),
    ...Object.values(MANIFEST.rscByLocale).flat(),
    ...Object.values(MANIFEST.extrasByLocale).flat(),
  ];
  return new Map(urls.map((url) => [url, true]));
}

/**
 * Load the worker with just enough of a browser around it: a cache that is one
 * Map, a manifest served from the network, and a `self` to hang listeners on.
 */
function loadWorker(seed: Map<string, boolean> = fullCache()) {
  const store = new Map(seed);
  /** Every address the worker asked the network for, in order. */
  const fetched: string[] = [];
  const open = async () => ({
    async keys() {
      return [...store.keys()].map((url) => ({ url: `https://trykit.pages.dev${url}` }));
    },
    async match(url: string) {
      return store.has(url) ? { url } : undefined;
    },
    async put(url: string) {
      store.set(url, true);
    },
    async delete(url: string) {
      return store.delete(url);
    },
  });
  const self = {
    location: { origin: "https://trykit.pages.dev" },
    addEventListener: () => undefined,
    clients: { matchAll: async () => [] },
    skipWaiting: () => undefined,
  };
  const context = vm.createContext({
    self,
    caches: { open, match: async () => undefined },
    fetch: async (input: string) => {
      fetched.push(String(input));
      return String(input).includes(FILL_PRECACHE)
        ? { ok: true, type: "basic", json: async () => MANIFEST }
        : { ok: true, type: "basic", status: 200 };
    },
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    URL,
  });
  vm.runInContext(swSource, context, { filename: "sw.js" });
  const worker = context as unknown as {
    removeOffline: (scope: {
      all?: boolean;
      engines?: boolean;
      locales?: string[];
      tools?: string[];
    }) => Promise<number>;
    offlineState: () => Promise<{
      generation: string;
      locales: Record<string, { done: number; total: number; ready: boolean }>;
      tools: Record<string, number>;
      engines: { done: number; total: number };
      readyLocales: number;
    }>;
    toolPathSegment: (toolId: string) => string;
    startLocaleFill: (locale: string, skipHeavy: boolean) => Promise<void>;
    selectedOfflineUrls: (data: {
      locales?: string[];
      tools?: string[];
      pages?: string[];
      engines?: boolean;
    }) => Promise<string[]>;
  };
  return { worker, store, paths: () => [...store.keys()], fetched };
}

describe("removing what was downloaded", () => {
  it("takes out a tool whose route segment differs from its id", async () => {
    const { worker, paths } = loadWorker();
    const removed = await worker.removeOffline({ tools: ["timezone-converter"] });

    expect(worker.toolPathSegment("timezone-converter")).toBe("world-clock");
    expect(removed).toBe(4); // two languages, page and payload
    expect(paths().filter((path) => path.startsWith("/en/tools/world-clock"))).toEqual([]);
    expect(paths().filter((path) => path.startsWith("/fr/tools/world-clock"))).toEqual([]);
    // Everything else stays.
    expect(paths()).toContain("/en/tools/pdf-merge/");
    expect(paths()).toContain("/en/tools/timezone-converter/");
  });

  it("takes one tool out of every language it was stored in", async () => {
    const { worker, paths } = loadWorker();
    expect(await worker.removeOffline({ tools: ["pdf-merge"] })).toBe(4);
    expect(paths().filter((path) => path.includes("pdf-merge"))).toEqual([]);
    expect(paths()).toContain("/en/tools/world-clock/");
  });

  it("takes a whole chosen set in one pass", async () => {
    const { worker, paths } = loadWorker();
    // Both languages in full, which already covers the tool named with them.
    expect(await worker.removeOffline({ locales: ["en", "fr"], tools: ["pdf-merge"] })).toBe(20);
    expect(paths().filter((path) => path.startsWith("/en/") || path.startsWith("/fr/"))).toEqual([]);
  });

  it("takes a language's compatibility addresses with it", async () => {
    const { worker, paths } = loadWorker();
    await worker.removeOffline({ locales: ["en"] });

    expect(paths().filter((path) => path.startsWith("/en/"))).toEqual([]);
    expect(paths()).toContain("/fr/");
    // The application itself is not something this page can remove.
    expect(paths()).toContain("/app.js");
    expect(paths()).toContain("/vendor/ffmpeg/ffmpeg-core.js");
  });

  it("can drop the media engines on their own, keeping the pages that use them", async () => {
    const { worker, paths } = loadWorker();
    expect(await worker.removeOffline({ engines: true })).toBe(1);

    expect(paths()).not.toContain("/vendor/ffmpeg/ffmpeg-core.js");
    expect(paths()).toContain("/en/");
    expect(paths()).toContain("/en/tools/pdf-merge/");
    expect(paths()).toContain("/en/tools/pdf-merge/index.txt");
  });

  it("removes nothing when the message names nothing", async () => {
    const { worker, paths } = loadWorker();
    const before = paths().length;
    /* A malformed message must never be read as a request for everything. */
    expect(await worker.removeOffline({})).toBe(0);
    expect(paths()).toHaveLength(before);
  });

  it("leaves nothing behind when everything is removed", async () => {
    const { worker, paths } = loadWorker();
    await worker.removeOffline({ all: true });

    /* Only the application's own files survive, whichever language directory
       they were stored under, including one that is only ever a compatibility
       address. The engines do go: they are offered on this page, so they are part
       of what it can add. */
    expect(paths()).toEqual(["/app.js"]);
  });
});

describe("what a download covers", () => {
  const everyToolId = ["pdf-merge", "timezone-converter"];

  it("brings every address a language is judged complete on", async () => {
    const { worker } = loadWorker();
    const urls = new Set(
      await worker.selectedOfflineUrls({ locales: ["en"], tools: everyToolId, engines: false })
    );
    /* Readiness counts a language's pages and their payloads. Anything missing
       here could never be fetched by this route, so the language would stay
       incomplete however long the visitor waited. */
    const needed = [
      ...MANIFEST.chromeByLocale.en,
      ...MANIFEST.toolsByLocale.en,
      ...MANIFEST.rscByLocale.en,
    ];
    expect(needed.filter((url) => !urls.has(url))).toEqual([]);
  });

  it("brings the language's own payloads when only one tool is chosen", async () => {
    const { worker } = loadWorker();
    const urls = await worker.selectedOfflineUrls({
      locales: ["en"],
      tools: ["pdf-merge"],
      engines: false,
    });

    expect(urls).toContain("/en/");
    expect(urls).toContain("/en/index.txt");
    expect(urls).toContain("/en/how/index.txt");
    expect(urls).toContain("/en/tools/pdf-merge/");
    expect(urls).toContain("/en/tools/pdf-merge/index.txt");
    // A tool that was not chosen is left out, page and payload alike.
    expect(urls).not.toContain("/en/tools/world-clock/");
    expect(urls).not.toContain("/en/tools/world-clock/index.txt");
  });

  it("covers a language chosen while another one is in use", async () => {
    const { worker } = loadWorker();
    // The background fill only covers the language in use, so a second language
    // has to arrive complete from this route or it never will.
    const urls = new Set(
      await worker.selectedOfflineUrls({ locales: ["fr"], tools: everyToolId, engines: false })
    );
    const needed = [
      ...MANIFEST.chromeByLocale.fr,
      ...MANIFEST.toolsByLocale.fr,
      ...MANIFEST.rscByLocale.fr,
    ];
    expect(needed.filter((url) => !urls.has(url))).toEqual([]);
  });

  it("takes the engines only when they were asked for", async () => {
    const { worker } = loadWorker();
    const withEngines = await worker.selectedOfflineUrls({ locales: ["en"], tools: [], engines: true });
    const without = await worker.selectedOfflineUrls({ locales: ["en"], tools: [], engines: false });

    expect(withEngines).toContain("/vendor/ffmpeg/ffmpeg-core.js");
    expect(without).not.toContain("/vendor/ffmpeg/ffmpeg-core.js");
  });

  it("brings the pages that were chosen, and their payloads", async () => {
    const { worker } = loadWorker();
    const urls = await worker.selectedOfflineUrls({
      locales: ["en"],
      tools: [],
      pages: ["how"],
      engines: false,
    });

    expect(urls).toContain("/en/how/");
    expect(urls).toContain("/en/how/index.txt");
    // The home page was not chosen, so the app will not open at the root.
    expect(urls).not.toContain("/en/");
    expect(urls).not.toContain("/en/index.txt");
  });

  it("takes every page when the message predates the list", async () => {
    const { worker } = loadWorker();
    /* A field the page never sent means the whole app, which is what a visitor
       who chose nothing was given before pages could be chosen at all. */
    const urls = await worker.selectedOfflineUrls({ locales: ["en"], tools: [], engines: false });

    expect(urls).toContain("/en/");
    expect(urls).toContain("/en/how/");
    expect(urls).toContain("/en/index.txt");
    expect(urls).toContain("/en/how/index.txt");
  });

  it("takes no page at all when the selection is empty", async () => {
    const { worker } = loadWorker();
    /* An empty list is a choice, not a missing field: a visitor who un-ticked
       every page asked for the tools alone. */
    const urls = await worker.selectedOfflineUrls({
      locales: ["en"],
      tools: ["pdf-merge"],
      pages: [],
      engines: false,
    });

    expect(urls).not.toContain("/en/");
    expect(urls).not.toContain("/en/index.txt");
    expect(urls).toContain("/en/tools/pdf-merge/");
    expect(urls).toContain("/en/tools/pdf-merge/index.txt");
  });
});

describe("the background fill", () => {
  it("fetches the app's own pages before anything else", async () => {
    /* The fill pauses whenever someone is reading or scrolling, so on a first
       visit it may only get through a few dozen requests. The pages the app's
       own navigation needs have to be among them, or a visitor who loses the
       network cannot open History, Favorites or Offline access until they have
       visited those pages once. */
    const { worker, fetched } = loadWorker(new Map());
    await worker.startLocaleFill("en", true);

    const asked = fetched.filter((url) => !url.includes(FILL_PRECACHE)).map((url) => new URL(url).pathname);
    const firstPage = asked.findIndex((path) => path === "/en/");
    const core = asked.findIndex((path) => path === "/app.js");

    expect(asked.slice(0, 2)).toEqual(["/en/", "/en/how/"]);
    expect(firstPage).toBeLessThan(core);
    // And their payloads, so an in-app click can stay in the tab.
    expect(asked.indexOf("/en/index.txt")).toBeLessThan(core);
  });
});

describe("reporting what is saved", () => {
  it("counts from the cache and reports every language complete", async () => {
    const { worker } = loadWorker();
    const state = await worker.offlineState();

    expect(Object.keys(state.locales).sort()).toEqual(["en", "fr"]);
    expect(state.readyLocales).toBe(2);
    expect(state.locales.en).toEqual({ done: 8, total: 8, ready: true });
    expect(state.tools["world-clock"]).toBe(2);
    expect(state.engines).toEqual({ done: 1, total: 1 });
  });

  it("does not count a compatibility language, so all of them can be ready", async () => {
    const { worker } = loadWorker();
    const state = await worker.offlineState();

    // `zh` owns addresses, and the page cannot offer it as a language.
    expect(state.locales).not.toHaveProperty("zh");
    expect(state.tools).not.toHaveProperty("timezone-converter");
  });

  it("reports a language as not ready while a payload is missing", async () => {
    const seed = fullCache();
    seed.delete("/en/how/index.txt");
    const { worker } = loadWorker(seed);
    const state = await worker.offlineState();

    expect(state.locales.en).toEqual({ done: 7, total: 8, ready: false });
    expect(state.locales.fr.ready).toBe(true);
    expect(state.readyLocales).toBe(1);
  });

  it("takes readiness from the cache rather than from what was asked for", async () => {
    const { worker, paths } = loadWorker();
    await worker.removeOffline({ locales: ["en"] });
    const state = await worker.offlineState();

    expect(state.locales.en).toEqual({ done: 0, total: 8, ready: false });
    expect(state.readyLocales).toBe(1);
    expect(paths()).toContain("/fr/");
  });
});
