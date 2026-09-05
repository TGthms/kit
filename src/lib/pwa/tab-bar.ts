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

export function shouldHideFloatingTabBar(coverPx: number): boolean {
  return coverPx > KEYBOARD_TABBAR_HIDE_PX;
}

/** Re-tapping the current tab scrolls to top, like UITabBarController. */
export function scrollActiveTabToTop(
  event: { preventDefault: () => void },
  options: { reduceMotion: boolean; scrollTo: (opts: ScrollToOptions) => void },
): void {
  event.preventDefault();
  options.scrollTo({ top: 0, behavior: options.reduceMotion ? "auto" : "smooth" });
}
