import type { ToolCategory, ToolId } from "@/lib/tools/registry";
import { categories, getTool } from "@/lib/tools/registry";

/** Home with optional category drill-in (shareable + browser-back friendly). */
export function homeHref(category?: ToolCategory | null): string {
  if (!category) return "/";
  return `/c/${encodeURIComponent(category)}/`;
}

/**
 * Keep `/?c=pdf` working, but show the canonical `/c/pdf/` path
 * (static export cannot 301).
 */
export function rewriteCategoryQuery(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const category = parseCategoryParam(url.searchParams.get("c"));
  if (!category) return;
  url.searchParams.delete("c");
  if (!/\/c\/[^/]+\/?$/.test(url.pathname)) {
    const base = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    url.pathname = `${base}c/${category}/`;
  }
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

/** Public URL segment for a tool. Legacy IDs remain valid route aliases. */
export function toolPathSegment(toolId: ToolId): string {
  return toolId === "timezone-converter" ? "world-clock" : toolId;
}

export function toolHref(toolId: ToolId, fromHref = "/"): string {
  return `/tools/${toolPathSegment(toolId)}?from=${encodeURIComponent(fromHref)}`;
}

/** Where a tool should go back in the product stack. */
export function toolBackHref(toolId: ToolId): string {
  const tool = getTool(toolId);
  return tool ? homeHref(tool.category) : "/";
}

export function parseCategoryParam(value: string | null | undefined): ToolCategory | null {
  if (!value) return null;
  return (categories as readonly string[]).includes(value)
    ? (value as ToolCategory)
    : null;
}

/** `/c/pdf` or `/c/pdf/` on the locale-stripped pathname. */
export function parseCategoryPath(pathname: string | null | undefined): ToolCategory | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/c\/([^/]+)\/?$/);
  return parseCategoryParam(match?.[1]);
}

/**
 * Keep `/tools/timezone-converter/` working, but show the canonical
 * `/tools/world-clock/` path in the address bar (static export cannot 301).
 */
export function rewriteLegacyToolPath(toolId: ToolId): void {
  if (toolId !== "timezone-converter" || typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!/\/tools\/timezone-converter\/?$/.test(url.pathname)) return;
  url.pathname = url.pathname.replace(/timezone-converter\/?$/, "world-clock/");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}
