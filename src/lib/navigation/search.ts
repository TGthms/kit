import { visiblePrimarySearch } from "./primary-search";

export const OPEN_TOOL_SEARCH_EVENT = "kit:search";

export function openToolSearch(): void {
  const primary = visiblePrimarySearch();
  if (primary) { primary.focus(); return; }
  window.dispatchEvent(new Event(OPEN_TOOL_SEARCH_EVENT));
}
