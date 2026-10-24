// @vitest-environment jsdom
/* eslint-disable @next/next/no-html-link-for-pages -- Native anchors test the document navigation observer. */
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ScrollRestoration } from "./scroll-restoration";

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/en/tools/test/");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("saves scroll as an iOS app backgrounds even without pagehide", () => {
  render(<ScrollRestoration locationKey="/en/tools/test/" />);
  vi.spyOn(window, "scrollY", "get").mockReturnValue(468);
  fireEvent.scroll(window);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  fireEvent(document, new Event("visibilitychange"));
  expect(sessionStorage.getItem("kit-scroll:/en/tools/test")).toBe("468");
});
it("does not record restoration intent for a modified click into another tab", () => {
  const { container } = render(<><ScrollRestoration locationKey="/en/tools/test/" /><a href="/en/" data-restore-scroll onClick={(event) => event.preventDefault()}>Home</a></>);
  fireEvent.click(container.querySelector("a")!, { ctrlKey: true });
  expect(sessionStorage.getItem("kit-scroll-restore")).toBeNull();
});
