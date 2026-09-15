import { getTool, tools as allTools, type ToolId } from "./registry";

/** How many neighbours a page offers before the list becomes a second catalogue. */
export const RELATED_LIMIT = 6;

/**
 * The other tools worth offering from a tool page, drawn from its own section
 * of the catalogue.
 *
 * The list starts just after this tool in the registry and wraps round, rather
 * than always starting at the head of the category. That matters for a page
 * whose value is partly its internal links: starting at the head would let the
 * first few tools collect every inbound link in a section while the rest are
 * never offered by anyone, and a start that moves with the page spreads them
 * out without being random — the same tool always offers the same neighbours.
 */
export function relatedTools(toolId: ToolId, limit = RELATED_LIMIT): ToolId[] {
  const tool = getTool(toolId);
  if (!tool || limit < 1) return [];
  const inCategory = allTools.filter((entry) => entry.category === tool.category && entry.id !== toolId);
  if (!inCategory.length) return [];
  const own = allTools.findIndex((entry) => entry.id === toolId);
  const offset = own < 0 ? 0 : own % inCategory.length;
  return [...inCategory.slice(offset), ...inCategory.slice(0, offset)]
    .slice(0, limit)
    .map((entry) => entry.id);
}
