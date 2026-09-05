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
  it("explains privacy with a comparison table and a leave-the-device chart", () => {
    renderHow();
    expect(screen.getByRole("heading", { name: "Typical upload site vs Kit" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Typical upload site vs Kit" })).toBeInTheDocument();
    expect(screen.getByText("Stays in this tab")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How much of the document leaves this device" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Typical upload tool: 100%" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Kit: 0%" })).toBeInTheDocument();
    expect(screen.getByText("FFmpeg WebAssembly (GPL-2.0-or-later)")).toBeInTheDocument();
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
