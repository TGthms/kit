// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cloneElement, createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { LiquidTabBar } from "./liquid-glass-tab";

const sdk = vi.hoisted(() => ({ diagnostic: undefined as undefined | ((event: { error?: Error }) => void) }));
vi.mock("@glass-sdk/liquid-glass/styles.css", () => ({}));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }));
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ children, onClick, ...props }: { children: ReactNode; onClick?: (event: unknown) => void }) => createElement("a", {
    ...props,
    onClick: (event: { preventDefault: () => void }) => { onClick?.(event); event.preventDefault(); },
  }, children),
}));
vi.mock("@glass-sdk/liquid-glass", () => ({
  GlassScene: ({ children, onDiagnostic }: { children: ReactNode; onDiagnostic: typeof sdk.diagnostic }) => {
    sdk.diagnostic = onDiagnostic;
    return createElement("div", null, children);
  },
  GlassContent: () => null,
  GlassTabsRoot: ({ children, value }: { children: ReactNode; value: string }) => createElement("div", { "data-selection": value }, children),
  GlassTabsList: ({ children, onPointerDownCapture, onPointerMoveCapture, onPointerUpCapture }: HTMLAttributes<HTMLDivElement>) => createElement("div", { role: "tablist", onPointerDownCapture, onPointerMoveCapture, onPointerUpCapture }, children),
  GlassTabsIndicator: () => null,
  GlassTabsTrigger: ({ children, render, className }: { children: ReactNode; render: ReactElement; className: string }) => cloneElement(render, { role: "tab", className } as never, children),
}));
afterEach(cleanup);

function view(pathname: string) {
  return createElement(NextIntlClientProvider, { locale: "en", messages: en } as never,
    createElement(LiquidTabBar, { pathname, fallback: createElement("p", null, "Standard navigation") }));
}

it("keeps route context and clears optimistic selection after back navigation", () => {
  const current = render(view("/tools/pdf-merge/"));
  expect(screen.getByRole("tab", { name: "Home" })).toHaveAttribute("aria-current", "location");
  fireEvent.click(screen.getByRole("tab", { name: "Settings" }));
  expect(document.querySelector("[data-selection]")).toHaveAttribute("data-selection", "/settings");
  current.rerender(view("/settings/"));
  current.rerender(view("/favorites/"));
  expect(document.querySelector("[data-selection]")).toHaveAttribute("data-selection", "/favorites");
  expect(screen.getByRole("tab", { name: "Favorites" })).toHaveAttribute("aria-current", "page");
});

it("keeps modified link activation from changing the selected tab", () => {
  render(view("/"));
  fireEvent.click(screen.getByRole("tab", { name: "Settings" }), { metaKey: true });
  expect(document.querySelector("[data-selection]")).toHaveAttribute("data-selection", "/");
});

it("restores ordinary navigation when the SDK reports a rendering failure", () => {
  render(view("/"));
  act(() => sdk.diagnostic?.({ error: new Error("GPU unavailable") }));
  expect(screen.getByText("Standard navigation")).toBeInTheDocument();
  expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
});

it("commits the release position even when the SDK spring is a tab behind", async () => {
  render(view("/settings/"));
  const tabs = screen.getAllByRole("tab");
  tabs.forEach((tab, index) => {
    tab.getBoundingClientRect = () => ({ left: index * 90, width: 90 } as DOMRect);
  });
  const list = screen.getByRole("tablist");
  list.setPointerCapture = vi.fn();
  list.hasPointerCapture = () => false;
  const pointer = (type: string, target: Element, x: number) => {
    const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: 20 });
    Object.defineProperty(event, "pointerId", { value: 1 });
    fireEvent(target, event);
  };
  pointer("pointerdown", tabs[3], 315);
  expect(list.setPointerCapture).not.toHaveBeenCalled(); // Ordinary taps stay native.
  pointer("pointermove", tabs[3], 130);
  expect(list.setPointerCapture).toHaveBeenCalledWith(1);
  await act(async () => {
    pointer("pointerup", list, 45);
    fireEvent.click(tabs[1]); // The SDK's lagging indicator attempts Favorites.
    await Promise.resolve();
  });
  expect(document.querySelector("[data-selection]")).toHaveAttribute("data-selection", "/");
});
