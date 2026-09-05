import { describe, expect, it, vi } from "vitest";
import {
  KEYBOARD_TABBAR_HIDE_PX,
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
