// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
      <HowStory toolCount={94} languageCount={30} />
    </NextIntlClientProvider>,
  );
}

describe("HowStory", () => {
  afterEach(() => {
    cleanup();
  });

  it("leads with honest numbers, not fake percentages", () => {
    renderHow();
    const band = screen.getByRole("group", { name: "Kit at a glance" });
    expect(within(band).getByText("94 tools")).toBeInTheDocument();
    expect(within(band).getByText("30 languages")).toBeInTheDocument();
    expect(within(band).getByText("0 uploads")).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
  });

  it("merges the comparison into one table with the download and currency rows", () => {
    renderHow();
    expect(screen.getByRole("heading", { name: "Typical upload site vs Kit" })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Typical upload site vs Kit" });
    expect(within(table).getByText("Your file")).toBeInTheDocument();
    expect(within(table).getByText("The result you download")).toBeInTheDocument();
    expect(within(table).getByText("Currency conversion")).toBeInTheDocument();
    expect(within(table).getByText("Stays in this tab")).toBeInTheDocument();
    expect(within(table).getByText(/Amounts stay here\./)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "When you run a tool, what crosses the network" })).not.toBeInTheDocument();
  });

  it("explains why the design helps beyond privacy", () => {
    renderHow();
    expect(screen.getByRole("heading", { name: "Why Kit works this way" })).toBeInTheDocument();
    expect(screen.getByText("No upload cap, no queue, no premium tier for bigger files. The real ceiling is this device’s memory.")).toBeInTheDocument();
  });

  it("walks through a merge and a password end to end", () => {
    renderHow();
    expect(screen.getByRole("heading", { name: "Merging two PDFs" })).toBeInTheDocument();
    expect(screen.getByText("pdf.js, already part of the page, reads both files inside this tab.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Generating a password" })).toBeInTheDocument();
    expect(screen.getByText(/Any of the other 94 tools/)).toBeInTheDocument();
  });

  it("keeps the download and engine facts parameterized from code", () => {
    renderHow();
    expect(screen.getByText("FFmpeg WebAssembly (GPL-2.0-or-later)")).toBeInTheDocument();
    expect(screen.getByText("About 10 MB once, then cached")).toBeInTheDocument();
    expect(screen.getByText(/about 10 MB; after that it is cached and reused/)).toBeInTheDocument();
    expect(screen.getByText("Downloads")).toBeInTheDocument();
  });

  it("offers the network log and the FAQ", () => {
    renderHow();
    expect(screen.getByRole("heading", { name: "See it in your own browser" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recheck" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Common questions" })).toBeInTheDocument();
    expect(screen.getByText("Is Kit really free?")).toBeInTheDocument();
  });

  it("keeps the greeting story, collapsed", () => {
    renderHow();
    expect(screen.getByText("The line on the home page")).toBeInTheDocument();
    expect(screen.getByText(/Kit reads this device’s clock and calendar/)).toBeInTheDocument();
  });

  it("closes with a call to action on real tools and in-app locale paths", () => {
    renderHow();
    expect(screen.getByRole("heading", { name: "Try it with something small" })).toBeInTheDocument();
    const merge = screen.getByRole("link", { name: "Merge two PDFs" });
    const password = screen.getByRole("link", { name: "Generate a password" });
    expect(merge).toHaveAttribute("href", "/tools/pdf-merge");
    expect(password).toHaveAttribute("href", "/tools/password-generator");
    const privacy = screen.getAllByRole("link", { name: "Privacy Policy" })[0];
    const terms = screen.getAllByRole("link", { name: "Terms of Use" })[0];
    expect(privacy).toHaveAttribute("href", "/privacy");
    expect(terms).toHaveAttribute("href", "/terms");
    expect(privacy?.getAttribute("href")).not.toContain("/en/");
  });
});
