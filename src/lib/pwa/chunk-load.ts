/** Stale hashed chunks after a deploy. Retrying the same import URL cannot recover. */

export const CHUNK_RELOAD_KEY = "kit-chunk-reload-at";
export const CHUNK_RELOAD_GUARD_MS = 10_000;

const CHUNK_LOAD_PATTERN =
  /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === "string") return CHUNK_LOAD_PATTERN.test(error);
  if (typeof error !== "object") return false;
  const record = error as { name?: unknown; message?: unknown; digest?: unknown };
  const name = typeof record.name === "string" ? record.name : "";
  if (name === "ChunkLoadError") return true;
  const message = typeof record.message === "string" ? record.message : "";
  const digest = typeof record.digest === "string" ? record.digest : "";
  return CHUNK_LOAD_PATTERN.test(`${name} ${message} ${digest}`);
}

export function shouldReloadForChunkError(
  now = Date.now(),
  storage: Pick<Storage, "getItem" | "setItem"> | null | undefined = typeof window === "undefined" ? null : window.sessionStorage,
): boolean {
  if (!storage) return true;
  try {
    const previous = Number(storage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (previous && now - previous < CHUNK_RELOAD_GUARD_MS) return false;
    storage.setItem(CHUNK_RELOAD_KEY, String(now));
    return true;
  } catch {
    return true;
  }
}

export function reloadForStaleChunk(force = false): boolean {
  if (typeof window === "undefined") return false;
  if (!force && !shouldReloadForChunkError(Date.now(), window.sessionStorage)) return false;
  if (force) {
    try {
      window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_kitcb", String(Date.now()));
  window.location.replace(url.href);
  return true;
}
