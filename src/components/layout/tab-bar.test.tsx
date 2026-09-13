// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TabBar } from "./tab-bar";

const messages = {
  nav: { home: "Home", favorites: "Favorites", history: "History", settings: "Settings" },
  brand: { name: "Kit" },
};

/**
 * The route the component reads. Flipping this and re-rendering is what a real
 * navigation looks like from the tab bar's point of view.
 */
let currentPathname = "/";

vi.mock("@/lib/i18n/navigation", () => ({
  // The real Link keeps the tap in the client router, so the document never
  // navigates. jsdom would otherwise try to follow the href.
  Link: ({ children, href, onClick, ...props }: { children: ReactNode; href: string; onClick?: (e: unknown) => void }) =>
    createElement(
      "a",
      {
        href,
        ...props,
        onClick: (event: { preventDefault: () => void }) => {
          onClick?.(event);
          event.preventDefault();
        },
      },
      children
    ),
  usePathname: () => currentPathname,
}));

vi.mock("@/lib/react/hydrated", () => ({ useHydrated: () => true }));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderTabBar(pathname: string) {
  currentPathname = pathname;
  const view = render(
    createElement(NextIntlClientProvider, { locale: "en", messages } as never, createElement(TabBar, { pathname }))
  );
  return {
    ...view,
    navigateTo: (next: string) => {
      currentPathname = next;
      view.rerender(
        createElement(
          NextIntlClientProvider,
          { locale: "en", messages } as never,
          createElement(TabBar, { pathname: next })
        )
      );
    },
  };
}

/** Which tab the gliding highlight is sitting on. */
function highlightedIndex(): number {
  const pill = document.querySelector(".gliding-pill");
  if (!pill) throw new Error("no pill rendered");
  return Number((pill as HTMLElement).style.getPropertyValue("--gliding-pill-index"));
}

function tabLabelsInOrder(): string[] {
  return [...document.querySelectorAll("nav a")].map((a) => a.textContent?.trim() ?? "");
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});

afterEach(cleanup);

describe("TabBar highlight", () => {
  it("highlights the section the current path belongs to", () => {
    renderTabBar("/favorites");
    expect(highlightedIndex()).toBe(1);
    expect(screen.getByRole("link", { name: "Favorites" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps a tool page on the Home tab", () => {
    renderTabBar("/tools/merge-pdf");
    expect(highlightedIndex()).toBe(0);
  });

  it("moves the highlight on tap, before the route has changed", () => {
    renderTabBar("/");
    expect(highlightedIndex()).toBe(0);

    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    expect(highlightedIndex()).toBe(3);
  });

  it("returns the highlight to the tab actually on screen after going back", () => {
    const { navigateTo } = renderTabBar("/");

    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    navigateTo("/settings");
    expect(highlightedIndex()).toBe(3);

    // Hardware back: the route leaves Settings for Home.
    navigateTo("/");
    expect(highlightedIndex()).toBe(0);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Settings" })).not.toHaveAttribute("aria-current");
  });

  it("does not leave the highlight behind after a back and re-entry", () => {
    const { navigateTo } = renderTabBar("/");

    fireEvent.click(screen.getByRole("link", { name: "History" }));
    navigateTo("/history");
    navigateTo("/");
    expect(highlightedIndex()).toBe(0);

    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    navigateTo("/settings");
    navigateTo("/favorites");
    expect(highlightedIndex()).toBe(1);
  });

  it("lists the four sections in a fixed order", () => {
    renderTabBar("/");
    expect(tabLabelsInOrder()).toEqual(["Home", "Favorites", "History", "Settings"]);
  });
});
