// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "./page-header";

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ children, ...props }: { children: ReactNode; href: string; [key: string]: unknown }) =>
    createElement("a", props, children),
}));

describe("PageHeader", () => {
  it("keeps the full header content in the document flow", () => {
    render(
      createElement(PageHeader, {
        title: "PDF merge",
        subtitle: "Combine files locally",
        backHref: "/",
        backLabel: "Home",
        trailing: createElement("button", { type: "button" }, "Favorite"),
        below: createElement("span", null, "Client-side only"),
      })
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("PDF merge")).toBeInTheDocument();
    expect(screen.getByText("Combine files locally")).toBeInTheDocument();
    expect(screen.getByText("Client-side only")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Favorite" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
