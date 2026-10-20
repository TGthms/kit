export const OPEN_TOOL_SEARCH_EVENT = "kit:search";

export function openToolSearch(): void {
  window.dispatchEvent(new Event(OPEN_TOOL_SEARCH_EVENT));
}
