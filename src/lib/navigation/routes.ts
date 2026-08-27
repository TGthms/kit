import type { ToolCategory, ToolId } from "@/lib/tools/registry";
import { categories, getTool } from "@/lib/tools/registry";

/** Home with optional category drill-in (shareable + browser-back friendly). */
export function homeHref(category?: ToolCategory | null): string {
  if (!category) return "/";
  return `/?c=${encodeURIComponent(category)}`;
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
