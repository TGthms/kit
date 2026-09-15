import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

/*
 * What a visitor is shown for an address that does not exist.
 *
 * The worker answers navigations itself, so the host's answer only reaches the
 * visitor if the worker passes it on. Nothing about that is visible in the
 * source: a cached page satisfies every assertion one could write about
 * navigation while putting an address on screen that was never asked for. The
 * decision is therefore exercised here, with the browser globals it uses.
 */
const here = dirname(fileURLToPath(import.meta.url));
const swSource = readFileSync(join(here, "../../../public/sw.js"), "utf8");

const ORIGIN = "https://trykit.pages.dev";
/** A mistyped tool address: no page, and nothing ever cached for it. */
const MISSING = "/en/tools/pdf-merg/";
/** The page the worker keeps so a navigation always has somewhere to land. */
const LAST_HOME = "/last-home";

type Page = {
  status: number;
  ok: boolean;
  type: string;
  redirected: boolean;
  url: string;
  headers: { get(name: string): string | null };
  clone(): Page;
};

function page(status: number): Page {
  const headers = (name: string) =>
    name.toLowerCase() === "content-type" ? "text/html; charset=utf-8" : null;
  return {
    status,
    ok: status >= 200 && status < 300,
    type: "basic",
    redirected: false,
    url: `${ORIGIN}/`,
    headers: { get: headers },
    clone: () => page(status),
  };
}

/** An address as the worker's cache deals in them: relative to the origin. */
function keyOf(key: unknown): string {
  const raw = typeof key === "string" ? key : String((key as { url?: string }).url ?? "");
  const path = raw.startsWith(ORIGIN) ? raw.slice(ORIGIN.length) : raw;
  return path.startsWith("./") ? path.slice(1) : path;
}

/** The worker with just enough of a browser around it to make one decision. */
function loadWorker({
  cached = [],
  network,
}: {
  cached?: string[];
  network: "missing" | "offline";
}) {
  const store = new Set(cached);
  /** Every address the worker asked the network for. */
  const asked: string[] = [];
  const self = {
    location: { origin: ORIGIN },
    addEventListener: () => undefined,
    clients: { matchAll: async () => [] },
    skipWaiting: () => undefined,
  };
  const context = vm.createContext({
    self,
    caches: {
      open: async () => ({
        async keys() {
          return [...store].map((path) => ({ url: `${ORIGIN}${path}` }));
        },
        async match(key: unknown) {
          return store.has(keyOf(key)) ? page(200) : undefined;
        },
        async put(key: unknown) {
          store.add(keyOf(key));
        },
        async delete(key: unknown) {
          return store.delete(keyOf(key));
        },
      }),
      match: async () => undefined,
    },
    fetch: async (input: unknown) => {
      asked.push(keyOf(input));
      if (network === "offline") throw new TypeError("Failed to fetch");
      /* The host's answer for an address that does not exist. */
      return page(404);
    },
    Response: { error: () => page(0) },
    DOMException,
    AbortController,
    URL,
    console,
    setTimeout,
    clearTimeout,
  });
  vm.runInContext(swSource, context, { filename: "sw.js" });
  const worker = context as unknown as {
    navigateDocument: (req: { url: string }) => Promise<Page | undefined>;
  };
  return { worker, asked, store };
}

describe("a navigation to an address that does not exist", () => {
  it("is answered with the missing page, not with whatever was cached", async () => {
    const { worker, store } = loadWorker({ cached: [LAST_HOME], network: "missing" });
    const answered = await worker.navigateDocument({ url: ORIGIN + MISSING });

    expect(answered?.status).toBe(404);
    /* The cached page is untouched — it is only passed over. */
    expect(store.has(LAST_HOME)).toBe(true);
  });

  it("asks the host, rather than answering from the cache alone", async () => {
    const { worker, asked } = loadWorker({ cached: [LAST_HOME], network: "missing" });
    await worker.navigateDocument({ url: ORIGIN + MISSING });
    expect(asked).toContain(MISSING);
  });

  it("is not stored, because an address can start existing again", async () => {
    const { worker, asked, store } = loadWorker({ network: "missing" });
    await worker.navigateDocument({ url: ORIGIN + MISSING });

    expect(asked).toContain(MISSING);
    expect([...store]).toEqual([]);
  });

  it("still lands on what was downloaded when there is no network", async () => {
    const { worker } = loadWorker({ cached: [LAST_HOME], network: "offline" });
    const answered = await worker.navigateDocument({ url: ORIGIN + MISSING });

    expect(answered?.status).toBe(200);
  });
});
