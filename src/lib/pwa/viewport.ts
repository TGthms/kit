/** iOS home-screen and installed display modes. Browser tabs stay zoomable. */
export function isStandaloneDisplay(
  nav: { standalone?: boolean } | null | undefined,
  matches: (query: string) => boolean,
): boolean {
  if (nav?.standalone === true) return true;
  return (
    matches("(display-mode: standalone)") ||
    matches("(display-mode: fullscreen)") ||
    matches("(display-mode: minimal-ui)")
  );
}

/** Pin page scale at 1. Does not replace width / initial-scale / viewport-fit. */
export function withLockedPageZoom(content: string): string {
  const parts = content
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^maximum-scale\s*=/i.test(part) && !/^user-scalable\s*=/i.test(part));
  parts.push("maximum-scale=1", "user-scalable=no");
  return parts.join(", ");
}
