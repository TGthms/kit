/** Pixels of layout viewport covered by the virtual keyboard (or 0). */
export function keyboardCoverPx(
  innerHeight: number,
  visual: { height: number; offsetTop: number } | null | undefined,
): number {
  if (!visual) return 0;
  return Math.max(0, innerHeight - visual.height - visual.offsetTop);
}

/** Ignore URL-bar show/hide; a real keyboard is hundreds of pixels. */
export const KEYBOARD_TABBAR_HIDE_PX = 80;

/**
 * Browser chrome (URL bar, toolbar) collapses by a bounded amount, while a
 * software keyboard covers a large share of the layout viewport. Requiring both
 * an absolute floor and a share keeps a first-load viewport settle from being
 * read as a keyboard and sliding the bar away.
 */
export const KEYBOARD_TABBAR_MIN_SHARE = 0.18;

export function shouldHideFloatingTabBar(coverPx: number, viewportHeight = 0): boolean {
  const threshold =
    viewportHeight > 0
      ? Math.max(KEYBOARD_TABBAR_HIDE_PX, viewportHeight * KEYBOARD_TABBAR_MIN_SHARE)
      : KEYBOARD_TABBAR_HIDE_PX;
  return coverPx > threshold;
}

/** Re-tapping the current tab scrolls to top, like UITabBarController. */
export function scrollActiveTabToTop(
  event: { preventDefault: () => void },
  options: { reduceMotion: boolean; scrollTo: (opts: ScrollToOptions) => void },
): void {
  event.preventDefault();
  options.scrollTo({ top: 0, behavior: options.reduceMotion ? "auto" : "smooth" });
}
