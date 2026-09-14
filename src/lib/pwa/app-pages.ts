/**
 * The app's own pages, as things Offline access can offer to download.
 *
 * These are the shell rather than the catalog: whichever language is chosen,
 * they are what makes the app itself usable with the network off. Each one is
 * listed on its own so a visitor can leave out a page they have no use for —
 * the terms, say — without giving up anything else.
 *
 * The id is the one `scripts/sw-precache.mjs` writes into the manifest, and
 * `label` names the catalog string that introduces the row.
 * `app-pages.test.ts` fails if either side drifts from the other.
 */
export const APP_PAGES = [
  { id: "home", label: "nav.home" },
  { id: "favorites", label: "nav.favorites" },
  { id: "history", label: "nav.history" },
  { id: "settings", label: "nav.settings" },
  { id: "offline", label: "settings.offlineAccess" },
  { id: "how", label: "footer.how" },
  { id: "privacy", label: "footer.privacy" },
  { id: "terms", label: "footer.terms" },
  { id: "categories", label: "home.categories" },
] as const;

export type AppPageId = (typeof APP_PAGES)[number]["id"];

export const APP_PAGE_IDS: readonly AppPageId[] = APP_PAGES.map((page) => page.id);

/** An id this release does not know is dropped, never handed to the worker. */
export function isAppPageId(value: unknown): value is AppPageId {
  return typeof value === "string" && (APP_PAGE_IDS as readonly string[]).includes(value);
}
