// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { createElement, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
beforeEach(() => { vi.stubGlobal("matchMedia", () => ({ matches: false })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function search() {
  render(createElement(NextIntlClientProvider, { locale: "en", messages: en } as never,
    createElement("div", null, createElement(ToolSearch), createElement("button", null, "Outside"))));
  const input = screen.getByRole("combobox", { name: "Search tools…" });
  fireEvent(window, new Event(OPEN_TOOL_SEARCH_EVENT));
  return input;
}
it("searches in an anchored dropdown without a modal or changing focus", () => {
  const input = search();
  expect(input).toHaveFocus();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  fireEvent.change(input, { target: { value: "world clock" } });
  expect(screen.getByRole("option", { name: /World clock/ })).toHaveAttribute("href", "/tools/world-clock?from=%2Ftools%2Fpdf-merge%2F");
  expect(screen.queryByRole("option", { name: /Merge PDFs/ })).not.toBeInTheDocument();
  expect(input).toHaveFocus();
  fireEvent.keyDown(input, { key: "Escape" });
  expect(input).toHaveAttribute("aria-expanded", "false");
  expect(input).toHaveFocus();
});
it("supports active-descendant keyboard navigation, selection, and no matches", () => {
  const input = search();
  fireEvent.change(input, { target: { value: "merge" } });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  const first = screen.getAllByRole("option")[0];
  expect(input).toHaveAttribute("aria-activedescendant", first.id);
  expect(first).toHaveAttribute("aria-selected", "true");
  expect(input).toHaveFocus();
  const click = vi.spyOn(first, "click").mockImplementation(() => undefined);
  fireEvent.keyDown(input, { key: "Enter" });
  expect(click).toHaveBeenCalledOnce();
  fireEvent.change(input, { target: { value: "no-such-tool-xyz" } });
  expect(screen.queryAllByRole("option")).toHaveLength(0);
  expect(screen.getByRole("status")).toHaveTextContent("No matches");
});
it("closes on outside interaction and clears without leaving the field", () => {
  const input = search();
  fireEvent.change(input, { target: { value: "PDF" } });
  expect(screen.getAllByRole("option").length).toBeLessThanOrEqual(8);
  fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
  expect(input).toHaveAttribute("aria-expanded", "false");
  fireEvent.focus(input);
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(input).toHaveValue("");
  expect(input).toHaveFocus();
});
