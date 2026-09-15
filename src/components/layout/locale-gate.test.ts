// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { locales } from "@/lib/i18n/config";
import { LocaleGate } from "./locale-gate";

const COUNTS = { tools: 94, sections: 9, languages: 30 };

describe("LocaleGate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("ssr includes a Kit heading and noscript locale homes", () => {
    const html = renderToStaticMarkup(createElement(LocaleGate, COUNTS));
    expect(html).toContain(">Kit</h1>");
    expect(html).toContain('alt="Kit"');
    expect(html).toContain("<noscript>");
    for (const locale of locales) {
      expect(html).toContain(`href="/${locale}/"`);
    }
  });

  it("says what the site holds, which is all this address gives a reader without scripting", () => {
    /* Most of what a machine fetching `/` can learn. The numbers are handed in
       from the registry, so this cannot become a page that describes a site the
       project no longer is. */
    const html = renderToStaticMarkup(createElement(LocaleGate, COUNTS));
    expect(html).toContain("94 tools across 9 sections");
    expect(html).toContain("30 languages");
    expect(html).toContain("nothing is uploaded");
  });

  it("replaces to a locale home after mount", () => {
    const replace = vi.fn();
    vi.stubGlobal("location", { replace, search: "", hash: "" });
    render(createElement(LocaleGate, COUNTS));
    expect(screen.getByRole("heading", { level: 1, name: "Kit" })).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/en/");
  });

  it("keeps greeting preview query and hash on the locale hop", () => {
    const replace = vi.fn();
    vi.stubGlobal("location", { replace, search: "?date=2026-12-25", hash: "#top" });
    render(createElement(LocaleGate, COUNTS));
    expect(replace).toHaveBeenCalledWith("/en/?date=2026-12-25#top");
  });

  it("boot script also appends search and hash", () => {
    const src = readFileSync("public/boot/locale-gate.js", "utf8");
    expect(src).toContain("location.search");
    expect(src).toContain("location.hash");
  });
});
