// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { observeInstalledViewport } from "./viewport";

let stop = () => {};
afterEach(() => { stop(); document.head.innerHTML = ""; vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function setup(installed: boolean) {
  Object.defineProperty(navigator, "standalone", { configurable: true, value: installed });
  const media = new Map<string, MediaQueryList>();
  vi.stubGlobal("matchMedia", (query: string) => {
    if (!media.has(query)) media.set(query, Object.assign(new EventTarget(), { media: query, matches: false }) as MediaQueryList);
    return media.get(query)!;
  });
  document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
  stop = observeInstalledViewport();
  return media;
}
it("keeps viewport restrictions when hydration replaces or edits metadata", async () => {
  setup(true);
  expect(document.documentElement.hasAttribute("data-kit-standalone")).toBe(true);
  document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
  await Promise.resolve();
  const meta = document.querySelector("meta")!;
  expect(meta.content).toContain("user-scalable=no");
  meta.content = "width=device-width, initial-scale=1";
  await Promise.resolve();
  expect(meta.content).toContain("maximum-scale=1");
});
it("prevents Safari page gestures only when installed, without cancelling graph pointer events or scroll", () => {
  setup(true);
  const pinch = new Event("gesturestart", { cancelable: true, bubbles: true });
  document.dispatchEvent(pinch);
  expect(pinch.defaultPrevented).toBe(true);
  for (const type of ["pointerdown", "pointermove", "touchstart", "touchmove"]) {
    const event = new Event(type, { cancelable: true, bubbles: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  }
  stop();
  const after = new Event("gesturechange", { cancelable: true });
  document.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(false);
});
it("leaves browser tabs zoomable and restores their viewport after leaving standalone", async () => {
  const media = setup(false);
  const before = document.querySelector("meta")!.content;
  const event = new Event("gesturestart", { cancelable: true });
  document.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  const standalone = media.get("(display-mode: standalone)")!;
  Object.defineProperty(standalone, "matches", { configurable: true, value: true });
  standalone.dispatchEvent(new Event("change"));
  expect(document.querySelector("meta")!.content).toContain("user-scalable=no");
  Object.defineProperty(standalone, "matches", { value: false });
  standalone.dispatchEvent(new Event("change"));
  await Promise.resolve();
  expect(document.querySelector("meta")!.content).toBe(before);
  expect(document.documentElement.hasAttribute("data-kit-standalone")).toBe(false);
});
