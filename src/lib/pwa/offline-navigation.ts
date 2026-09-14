/**
 * Whether a destination can be reached with the network off.
 *
 * A page is reached two ways. The document itself is served from the worker's
 * cache, and the payload its route needs — the Flight file sitting beside the
 * page as `index.txt` — is what lets the router change page in place instead of
 * reloading the document. With the network off both have to be held for an
 * in-app click to stay as smooth as it is online; anything else is a reload.
 *
 * Next asks for the payload with the same query string as the page, so both the
 * bare and the query-bearing address are worth checking. The probe is
 * deliberately generous: a miss is not an error, it falls back to a document
 * load, which the worker answers from its cache.
 */
export function offlineProbeKeys(href: string, origin: string): { page: string[]; payload: string[] } {
  const url = new URL(href, origin);
  url.hash = "";
  const search = url.search;
  url.search = "";
  const bare = url.href;
  const directory = bare.endsWith("/") ? bare : `${bare}/`;
  return {
    page: search ? [bare, `${bare}${search}`] : [bare],
    payload: search
      ? [`${directory}index.txt`, `${directory}index.txt${search}`]
      : [`${directory}index.txt`],
  };
}

/** The worker's own cache lookup, guarded: a failure reads as "not held". */
export async function matchHeld(key: string): Promise<boolean> {
  try {
    return Boolean(await caches.match(key));
  } catch {
    return false;
  }
}

export async function isHeldOffline(
  href: string,
  origin: string,
  match: (key: string) => Promise<boolean> = matchHeld
): Promise<boolean> {
  const { page, payload } = offlineProbeKeys(href, origin);
  const anyHeld = async (keys: string[]) => {
    for (const key of keys) if (await match(key)) return true;
    return false;
  };
  const [pageHeld, payloadHeld] = await Promise.all([anyHeld(page), anyHeld(payload)]);
  return pageHeld && payloadHeld;
}
