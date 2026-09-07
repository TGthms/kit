// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "./page-header";

const messages = { common: { back: "Back" } };

function renderPageHeader(props: React.ComponentProps<typeof PageHeader>) {
  return render(
    createElement(
      NextIntlClientProvider,
      { locale: "en", messages } as never,
      createElement(PageHeader, props)
    )
  );
}

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ children, ...props }: { children: ReactNode; href: string; [key: string]: unknown }) =>
    createElement("a", props, children),
  useRouter: () => ({ push: vi.fn() }),
}));

describe("PageHeader", () => {
  it("keeps the full header content in the document flow", () => {
    renderPageHeader({
      title: "PDF merge",
      subtitle: "Combine files locally",
      backHref: "/",
      backLabel: "Home",
      trailing: createElement("button", { type: "button" }, "Favorite"),
      below: createElement("span", null, "Client-side only"),
    });

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PDF merge" })).toBeInTheDocument();
    expect(screen.getByText("Combine files locally")).toBeInTheDocument();
    expect(screen.getByText("Client-side only")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Favorite" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("keeps the compact chrome as a hidden overlay at rest", () => {
    renderPageHeader({
      title: "PDF merge",
      backHref: "/",
      backLabel: "Home",
    });

    const overlay = document.querySelector(".kit-compact-header");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(overlay).toHaveClass("fixed");
    expect(overlay).toHaveClass("pointer-events-none");
    expect(overlay).not.toHaveClass("sticky");
  });
});
