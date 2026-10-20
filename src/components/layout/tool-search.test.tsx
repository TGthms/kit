// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { createElement, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import en from "../../../messages/en.json";
import { ToolSearch } from "./tool-search";
import { OPEN_TOOL_SEARCH_EVENT } from "@/lib/navigation/search";

vi.mock("@/lib/i18n/navigation", () => ({
  usePathname: () => "/tools/pdf-merge/",
  Link: ({ children, href, prefetch: _prefetch, ...props }: { children: ReactNode; href: string; prefetch?: boolean }) => {
    void _prefetch;
    return createElement("a", { href, ...props }, children);
  },
}));

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); }) });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); }) });
});

afterEach(() => { cleanup(); Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal"); Reflect.deleteProperty(HTMLDialogElement.prototype, "close"); });

function openSearch() {
  render(createElement(NextIntlClientProvider, { locale: "en", messages: en } as never, createElement("div", null,
    createElement("button", null, "Search opener"), createElement(ToolSearch))));
  const opener = screen.getByRole("button", { name: "Search opener" });
  opener.focus();
  fireEvent(window, new Event(OPEN_TOOL_SEARCH_EVENT));
  return { opener, dialog: screen.getByRole("dialog"), input: screen.getByRole("textbox", { name: "Search tools…" }) };
}

it("opens from a tool page, searches localized names, and restores focus", () => {
  const { opener, dialog, input } = openSearch();
  expect(input).toHaveFocus();
  fireEvent.change(input, { target: { value: "world clock" } });
  expect(within(dialog).getByRole("link", { name: /World clock/ })).toHaveAttribute("href", "/tools/world-clock?from=%2Ftools%2Fpdf-merge%2F");
  expect(within(dialog).queryByRole("link", { name: /Merge PDFs/ })).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
  expect(dialog).not.toHaveAttribute("open");
  expect(opener).toHaveFocus();
});

it("supports arrow keys and handles an empty result set", () => {
  const { dialog, input } = openSearch();
  fireEvent.change(input, { target: { value: "merge" } });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(within(dialog).getAllByRole("link")[0]).toHaveFocus();
  fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
  expect(input).toHaveFocus();
  fireEvent.change(input, { target: { value: "no-such-tool-xyz" } });
  expect(within(dialog).queryAllByRole("link")).toHaveLength(0);
  expect(within(dialog).getByRole("status")).toHaveTextContent("No matches");
});
