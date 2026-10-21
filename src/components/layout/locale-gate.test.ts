// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import vm from "node:vm";
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

  it("shows only the spinner while retaining the no-script introduction and language homes", () => {
    const html = renderToStaticMarkup(createElement(LocaleGate, COUNTS));
    const visible = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
    expect(visible).not.toMatch(/<h1|<img|Private by design|tools across/);
    expect(visible).toContain('class="kit-spinner"');
    expect(visible).toContain('role="status">Loading');
    expect(html).toContain(">Kit</h1>");
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

  it("hands off without React after giving the entry a chance to paint", () => {
    const replace = vi.fn();
    const frames: Array<() => void> = [];
    const tasks: Array<() => void> = [];
    const requestAnimationFrame = (callback: () => void) => frames.push(callback);
    vm.runInNewContext(readFileSync("public/boot/locale-gate.js", "utf8"), {
      document: { currentScript: { getAttribute: (key: string) => key === "data-locales" ? locales.join(",") : "" } },
      location: { pathname: "/", search: "?date=2026-12-25", hash: "#top", replace },
      navigator: { language: "en" }, localStorage: { getItem: () => "zh" },
      window: { requestAnimationFrame }, requestAnimationFrame,
      setTimeout: (callback: () => void) => tasks.push(callback),
    });
    expect(replace).not.toHaveBeenCalled();
    expect(frames).toHaveLength(1);
    frames[0]();
    expect(replace).not.toHaveBeenCalled();
    tasks[0]();
    expect(replace).toHaveBeenCalledWith("/zh-Hans/?date=2026-12-25#top");
  });

  it("ships inline loading styles and an independent inline locale script", () => {
    const html = renderToStaticMarkup(createElement(LocaleGate, COUNTS));
    expect(html).toContain('id="kit-entry-style"');
    expect(html).toContain('id="kit-locale-entry"');
    expect(html).toContain("kit-entry-spin");
    expect(html).not.toMatch(/<script[^>]+src=/);
  });

  it("boot script also appends search and hash", () => {
    const src = readFileSync("public/boot/locale-gate.js", "utf8");
    expect(src).toContain("location.search");
    expect(src).toContain("location.hash");
  });
});
