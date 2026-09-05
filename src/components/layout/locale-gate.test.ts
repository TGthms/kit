// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { locales } from "@/lib/i18n/config";
import { LocaleGate } from "./locale-gate";

describe("LocaleGate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("ssr includes a Kit heading and noscript locale homes", () => {
    const html = renderToStaticMarkup(createElement(LocaleGate));
    expect(html).toContain(">Kit</h1>");
    expect(html).toContain('alt="Kit"');
    expect(html).toContain("<noscript>");
    for (const locale of locales) {
      expect(html).toContain(`href="/${locale}/"`);
    }
  });

  it("replaces to a locale home after mount", () => {
    const replace = vi.fn();
    vi.stubGlobal("location", { replace });
    render(createElement(LocaleGate));
    expect(screen.getByRole("heading", { level: 1, name: "Kit" })).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/en/");
  });
});
