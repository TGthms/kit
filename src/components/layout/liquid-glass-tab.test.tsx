// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { createElement, type ComponentProps } from "react";
import { NextIntlClientProvider } from "next-intl";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { LiquidTabBar } from "./liquid-glass-tab";

const navigate = vi.fn();
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }));
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ onClick, ...props }: ComponentProps<"a">) => createElement("a", {
    ...props,
    href: `/en${props.href}`,
    onClick: (event) => {
      onClick?.(event);
      if (!event.defaultPrevented && !event.metaKey) navigate(props.href);
      event.preventDefault();
    },
  }),
}));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  // jsdom has no layout. Give the real library the dimensions it uses for
  // gesture hit testing and a pointer event containing the primary pointer.
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(360);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(90);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(54);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    { left: 0, top: 0, bottom: 62, width: 360 } as DOMRect,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  navigate.mockClear();
});

function view(pathname: string) {
  return createElement(NextIntlClientProvider, { locale: "en", messages: en } as never,
    createElement(LiquidTabBar, { pathname }));
}

it("renders localized links, preserves route context and follows Back", () => {
  const current = render(view("/tools/pdf-merge/"));
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "location");
  expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/en/settings");
  fireEvent.click(screen.getByRole("link", { name: "Settings" }));
  expect(navigate).toHaveBeenCalledWith("/settings");
  current.rerender(view("/settings/"));
  expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("data-selected");
  current.rerender(view("/favorites/"));
  expect(screen.getByRole("link", { name: "Favorites" })).toHaveAttribute("data-selected");
  expect(screen.getByRole("link", { name: "Favorites" })).toHaveAttribute("aria-current", "page");
});

it("scrolls on a destination re-tap and preserves modified activation", () => {
  const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(view("/settings/"));
  const settings = screen.getByRole("link", { name: "Settings" });
  fireEvent.click(settings, { metaKey: true });
  expect(scrollTo).not.toHaveBeenCalled();
  fireEvent.click(settings);
  expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  expect(navigate).not.toHaveBeenCalled();
});

it("lets the SDK drag from Settings and activate Home at the release position", () => {
  render(view("/settings/"));
  const bar = screen.getByRole("navigation", { name: "Kit" });
  const settings = screen.getByRole("link", { name: "Settings" });
  bar.setPointerCapture = vi.fn();
  bar.hasPointerCapture = () => false;
  const pointer = (type: string, target: Element, x: number) => {
    const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: 20 });
    Object.assign(event, { pointerId: 1, isPrimary: true, pointerType: "touch" });
    fireEvent(target, event);
  };
  pointer("pointerdown", settings, 315);
  expect(bar.setPointerCapture).not.toHaveBeenCalled();
  pointer("pointermove", settings, 130);
  expect(bar.setPointerCapture).toHaveBeenCalledWith(1);
  pointer("pointerup", bar, 45);
  expect(navigate).toHaveBeenCalledExactlyOnceWith("/");
});
