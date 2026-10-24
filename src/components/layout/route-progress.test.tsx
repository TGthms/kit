// @vitest-environment jsdom
/* eslint-disable @next/next/no-html-link-for-pages -- Exercise native document click handling without a router. */
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RouteProgress } from "./route-progress";

beforeEach(() => { vi.useFakeTimers(); window.history.replaceState({}, "", "/en/"); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
function setup(props: React.AnchorHTMLAttributes<HTMLAnchorElement> = {}) {
  const { container } = render(<><RouteProgress /><a href="/en/settings/" onClick={(event) => event.preventDefault()} {...props}>Settings</a></>);
  return { bar: container.querySelector(".kit-route-progress")!, link: container.querySelector("a")! };
}
it("delays short navigation feedback and stops it after the URL changes", () => {
  const { bar, link } = setup();
  fireEvent.click(link);
  act(() => vi.advanceTimersByTime(139));
  expect(bar.getAttribute("data-active")).toBe("false");
  act(() => vi.advanceTimersByTime(1));
  expect(bar.getAttribute("data-active")).toBe("true");
  window.history.pushState({}, "", "/en/settings/");
  act(() => vi.advanceTimersByTime(100));
  expect(bar.getAttribute("data-active")).toBe("false");
  expect(vi.getTimerCount()).toBe(0);
});
it("bounds a cancelled/stalled navigation and clears every timer", () => {
  const { bar, link } = setup();
  fireEvent.click(link);
  act(() => vi.advanceTimersByTime(150));
  expect(bar.getAttribute("data-active")).toBe("true");
  act(() => vi.advanceTimersByTime(12_000));
  expect(bar.getAttribute("data-active")).toBe("false");
  expect(vi.getTimerCount()).toBe(0);
});
it.each([{ target: "_blank" }, { target: "preview" }, { download: "download" }, { href: "https://example.com/" }, { href: "/en/#content" }])("ignores non-route activations %j", (props) => {
  const { bar, link } = setup(props);
  fireEvent.click(link);
  act(() => vi.advanceTimersByTime(200));
  expect(bar.getAttribute("data-active")).toBe("false");
  expect(vi.getTimerCount()).toBe(0);
});
it("does not carry stale progress into a resumed app", () => {
  const { bar, link } = setup();
  fireEvent.click(link);
  act(() => vi.advanceTimersByTime(150));
  fireEvent(window, new Event("pagehide"));
  expect(bar.getAttribute("data-active")).toBe("false");
  expect(vi.getTimerCount()).toBe(0);
});
