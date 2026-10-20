// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activeCategory, isActive, SideNav, TabBar } from "./tab-bar";
import en from "../../../messages/en.json";
import { useAppearanceStore } from "@/stores/appearance-store";

const messages = {
  nav: { home: "Home", favorites: "Favorites", history: "History", settings: "Settings" },
  brand: { name: "Kit" },
  categories: en.categories,
  home: { categories: "Categories" },
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
  useAppearanceStore.setState({ liquidGlass: false });
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("navigation sections", () => {
  it("owns category and tool routes without matching unrelated prefixes", () => {
    expect(isActive("/tools/pdf-merge/", "/")).toBe(true);
    expect(isActive("/c/pdf/", "/")).toBe(true);
    expect(isActive("/settings/offline/", "/settings")).toBe(true);
    expect(isActive("/settings-other/", "/settings")).toBe(false);
    expect(activeCategory("/tools/world-clock/")).toBe("everyday");
    expect(activeCategory("/tools/media-convert/")).toBe("video");
  });

  it("offers all nine categories and highlights the tool's category on desktop", () => {
    render(createElement(NextIntlClientProvider, { locale: "en", messages } as never, createElement(SideNav, { pathname: "/tools/pdf-merge/" })));
    expect(screen.getByRole("link", { name: "PDF" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "location");
    expect(screen.getAllByRole("link")).toHaveLength(13);
    expect(screen.getByRole("button")).toHaveAttribute("aria-haspopup", "dialog");
  });
});

describe("TabBar highlight", () => {
  it("uses the original capsule by default and when an opted-in browser lacks WebGPU", () => {
    const { unmount } = renderTabBar("/favorites");
    expect(document.querySelector(".floating-nav-face")).toBeInTheDocument();
    expect(document.querySelector(".kit-sdk-tab-scene")).not.toBeInTheDocument();
    unmount();
    useAppearanceStore.setState({ liquidGlass: true });
    renderTabBar("/favorites");
    expect(document.querySelector(".floating-nav-face")).toBeInTheDocument();
    expect(highlightedIndex()).toBe(1);
    expect(screen.getByRole("link", { name: "Favorites" })).toHaveAttribute("aria-current", "page");
  });
  it("highlights the section the current path belongs to", () => {
    renderTabBar("/favorites");
    expect(highlightedIndex()).toBe(1);
    expect(screen.getByRole("link", { name: "Favorites" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps a tool page on the Home tab", () => {
    renderTabBar("/tools/merge-pdf");
    expect(highlightedIndex()).toBe(0);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "location");
  });

  it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }])("leaves selection and scrolling alone for modified clicks: %j", (modifiers) => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderTabBar("/");
    fireEvent.click(screen.getByRole("link", { name: "Settings" }), modifiers);
    expect(highlightedIndex()).toBe(0);
    fireEvent.click(screen.getByRole("link", { name: "Home" }), modifiers);
    expect(scroll).not.toHaveBeenCalled();
  });

  it("navigates home from a tool and only scrolls on the actual home page", () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const { navigateTo } = renderTabBar("/tools/pdf-merge/");
    fireEvent.click(screen.getByRole("link", { name: "Home" }));
    expect(scroll).not.toHaveBeenCalled();
    navigateTo("/");
    fireEvent.click(screen.getByRole("link", { name: "Home" }));
    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
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
