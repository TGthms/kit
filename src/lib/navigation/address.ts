"use client";

import { useSyncExternalStore } from "react";
import type { ToolCategory, ToolId } from "@/lib/tools/registry";
import { parseCategoryParam, toolBackHref } from "./routes";

const emptySubscribe = () => () => undefined;

/** A same-origin path from an address-bar value, or null when it names another site. */
export function safeInternalHref(value: string | null): string | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    return decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : null;
  } catch {
    return null;
  }
}

function readLegacyCategory(): ToolCategory | null {
  return parseCategoryParam(new URLSearchParams(window.location.search).get("c"));
}

function readFrom(): string | null {
  return safeInternalHref(new URLSearchParams(window.location.search).get("from"));
}

/**
 * The category named by the legacy `?c=` query.
 *
 * Read straight from the address bar rather than through the router's
 * search-param hook: that hook holds its whole subtree back to the client side,
 * which leaves a crawler the app shell and nothing inside it. Nothing
 * subscribes, because the address is re-read on every render — a static export
 * rewrites this query in place, and a navigation re-renders anyway. The server
 * answers null so the first client render matches what was prerendered.
 */
export function useLegacyCategory(): ToolCategory | null {
  return useSyncExternalStore(emptySubscribe, readLegacyCategory, () => null);
}

/**
 * Where the back control on a tool page leads, and whether the visitor arrived
 * with a place to return to.
 *
 * A tool link carries where it was opened from, in a query the page itself
 * cannot see while rendering. Reading it from the address keeps the page's own
 * heading and description prerenderable; without one, the tool's category is
 * the answer, which is where the page belongs in the product stack.
 */
export function useToolBack(toolId: ToolId): { href: string; fromElsewhere: boolean } {
  const from = useSyncExternalStore(emptySubscribe, readFrom, () => null);
  return { href: from ?? toolBackHref(toolId), fromElsewhere: from !== null };
}
