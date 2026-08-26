// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "./page-header";

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
}));

describe("PageHeader mobile compact mode", () => {
  it("keeps the full tool header at the top and collapses after scrolling", () => {
    render(
      <PageHeader
        title="PDF merge"
        subtitle="Combine files locally"
        backHref="/"
        backLabel="Home"
        trailing={<button type="button">Favorite</button>}
        below={<span>Client-side only</span>}
        compactOnScroll
      />
    );

    const header = screen.getByRole("banner");
    const details = screen.getByText("Combine files locally").parentElement?.parentElement;
    expect(details).not.toHaveClass("max-sm:hidden");
    expect(screen.getByRole("button", { name: "Favorite" })).toBeInTheDocument();

    Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
    fireEvent.scroll(window);

    expect(header).toHaveClass("max-sm:py-1.5");
    expect(details).toHaveClass("max-sm:hidden");
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass("max-sm:w-9");
  });
});
