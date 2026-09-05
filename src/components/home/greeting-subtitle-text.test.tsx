// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { GreetingSubtitleText } from "./greeting-subtitle-text";

function renderSub(key: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ home: en.home }}>
      <GreetingSubtitleText subtitleKey={key} day="Friday" occasion="" />
    </NextIntlClientProvider>,
  );
}

describe("GreetingSubtitleText", () => {
  it("turns Generate one here into the password generator", () => {
    renderSub("subtitleObservance.passwordDay2");
    const link = screen.getByRole("link", { name: "Generate one here" });
    expect(link.getAttribute("href")).toContain("/tools/password-generator");
    expect(link.getAttribute("href")).not.toContain("/en/");
  });

  it("turns Learn more into the How Kit works page", () => {
    renderSub("subtitleFacts.kit6");
    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute("href", "/how");
  });
});
