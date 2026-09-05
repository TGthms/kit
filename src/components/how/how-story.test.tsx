// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { HowStory } from "./how-story";

function renderHow() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ how: en.how }}>
      <HowStory />
    </NextIntlClientProvider>,
  );
}

describe("HowStory", () => {
  it("explains privacy with honest tables, not fake percentages", () => {
    renderHow();
    expect(screen.getByRole("heading", { name: "Typical upload site vs Kit" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Typical upload site vs Kit" })).toBeInTheDocument();
    expect(screen.getByText("Stays in this tab")).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "When you run a tool, what crosses the network" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "When you run a tool, what crosses the network" })).toBeInTheDocument();
    expect(screen.getByText("Stays in this tab. It does not show up as an upload.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The line on the home page" })).toBeInTheDocument();
    expect(screen.getByText(/Kit reads this device’s clock and calendar/)).toBeInTheDocument();
    expect(screen.getByText("FFmpeg WebAssembly (GPL-2.0-or-later)")).toBeInTheDocument();
    expect(screen.getByText(/about 10 MB gzipped/)).toBeInTheDocument();
  });

  it("uses in-app locale paths instead of a hardcoded /en/ URL", () => {
    renderHow();
    const privacy = screen.getAllByRole("link", { name: "Privacy Policy" })[0];
    const terms = screen.getAllByRole("link", { name: "Terms of Use" })[0];
    expect(privacy).toHaveAttribute("href", "/privacy");
    expect(terms).toHaveAttribute("href", "/terms");
    expect(privacy?.getAttribute("href")).not.toContain("/en/");
  });
});
