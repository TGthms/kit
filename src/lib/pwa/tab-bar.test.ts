import { describe, expect, it, vi } from "vitest";
import {
  KEYBOARD_TABBAR_HIDE_PX,
  KEYBOARD_TABBAR_MIN_SHARE,
  keyboardCoverPx,
  scrollActiveTabToTop,
  shouldHideFloatingTabBar,
} from "./tab-bar";

describe("keyboardCoverPx", () => {
  it("returns 0 when visualViewport is missing", () => {
    expect(keyboardCoverPx(800, undefined)).toBe(0);
    expect(keyboardCoverPx(800, null)).toBe(0);
  });

  it("is the layout height minus the visual viewport, including offsetTop", () => {
    expect(keyboardCoverPx(800, { height: 500, offsetTop: 0 })).toBe(300);
    expect(keyboardCoverPx(800, { height: 500, offsetTop: 40 })).toBe(260);
  });

  it("does not go negative when the visual viewport is larger", () => {
    expect(keyboardCoverPx(700, { height: 800, offsetTop: 0 })).toBe(0);
  });
});

describe("shouldHideFloatingTabBar", () => {
  it("stays put for small chrome changes", () => {
    expect(shouldHideFloatingTabBar(KEYBOARD_TABBAR_HIDE_PX)).toBe(false);
    expect(shouldHideFloatingTabBar(40)).toBe(false);
  });

  it("hides when a keyboard covers the bottom", () => {
    expect(shouldHideFloatingTabBar(KEYBOARD_TABBAR_HIDE_PX + 1)).toBe(true);
    expect(shouldHideFloatingTabBar(300)).toBe(true);
  });

  it("keeps the pixel floor when the viewport height is unknown", () => {
    expect(shouldHideFloatingTabBar(KEYBOARD_TABBAR_HIDE_PX + 1, 0)).toBe(true);
    expect(shouldHideFloatingTabBar(KEYBOARD_TABBAR_HIDE_PX, 0)).toBe(false);
  });

  it("ignores a first-load viewport settle that is not a keyboard", () => {
    const viewport = 800;
    const shareFloor = viewport * KEYBOARD_TABBAR_MIN_SHARE;
    expect(shareFloor).toBeGreaterThan(KEYBOARD_TABBAR_HIDE_PX);
    // A collapsing URL bar/toolbar is over the pixel floor but nowhere near a
    // keyboard's share of the viewport.
    expect(shouldHideFloatingTabBar(100, viewport)).toBe(false);
    expect(shouldHideFloatingTabBar(shareFloor - 1, viewport)).toBe(false);
  });

  it("still hides for a real keyboard share of the viewport", () => {
    const viewport = 800;
    const shareFloor = viewport * KEYBOARD_TABBAR_MIN_SHARE;
    expect(shouldHideFloatingTabBar(shareFloor, viewport)).toBe(false);
    expect(shouldHideFloatingTabBar(shareFloor + 1, viewport)).toBe(true);
    expect(shouldHideFloatingTabBar(320, viewport)).toBe(true);
  });
});

describe("scrollActiveTabToTop", () => {
  it("cancels navigation and smooth-scrolls unless motion is reduced", () => {
    const preventDefault = vi.fn();
    const scrollTo = vi.fn();
    scrollActiveTabToTop({ preventDefault }, { reduceMotion: false, scrollTo });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

    scrollTo.mockClear();
    scrollActiveTabToTop({ preventDefault }, { reduceMotion: true, scrollTo });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });
});
