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

/** Keep installed zoom policy through hydration, metadata replacement, resume
 * and display-mode changes. Safari can ignore viewport scale limits; CSS and
 * its gesture events cover page pinch without consuming pointer/touch events
 * used by Kit's graph. No global touchmove prevention or scroll lock. */
export function observeInstalledViewport(): () => void {
  const queries = ["standalone", "fullscreen", "minimal-ui"].map((mode) => window.matchMedia(`(display-mode: ${mode})`));
  const root = document.documentElement;
  let installed = false;
  const original = new Map<HTMLMetaElement, string>();
  const sync = () => {
    installed = isStandaloneDisplay(navigator as Navigator & { standalone?: boolean }, (query) => queries.some((media) => media.media === query && media.matches));
    root.toggleAttribute("data-kit-standalone", installed);
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="viewport"]')) {
      const content = meta.content;
      if (installed) {
        if (!original.has(meta)) original.set(meta, meta.getAttribute("data-kit-viewport-original") ?? content);
        meta.removeAttribute("data-kit-viewport-original");
        const locked = withLockedPageZoom(content);
        if (content !== locked) meta.content = locked;
      } else if (original.has(meta)) {
        meta.content = original.get(meta)!;
        original.delete(meta);
      }
    }
    // Removed metadata must not stay retained for a long app session.
    for (const meta of original.keys()) if (!meta.isConnected) original.delete(meta);
  };
  const preventPageGesture = (event: Event) => {
    if (installed && event.cancelable) event.preventDefault();
  };
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["name", "content"] });
  for (const media of queries) media.addEventListener("change", sync);
  window.addEventListener("pageshow", sync);
  document.addEventListener("gesturestart", preventPageGesture, { passive: false });
  document.addEventListener("gesturechange", preventPageGesture, { passive: false });
  return () => {
    observer.disconnect();
    for (const media of queries) media.removeEventListener("change", sync);
    window.removeEventListener("pageshow", sync);
    document.removeEventListener("gesturestart", preventPageGesture);
    document.removeEventListener("gesturechange", preventPageGesture);
    root.removeAttribute("data-kit-standalone");
    for (const [meta, content] of original) if (meta.isConnected) meta.content = content;
  };
}
