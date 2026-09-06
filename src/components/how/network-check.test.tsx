// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { NetworkCheck } from "./network-check";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

type Entry = { name: string; transferSize: number; startTime?: number };

function fakePerformance(resources: Entry[]) {
  return {
    getEntriesByType: (type: string) =>
      type === "resource"
        ? resources.map((entry, index) => ({
            name: entry.name,
            entryType: "resource",
            startTime: entry.startTime ?? index,
            duration: 0,
            transferSize: entry.transferSize,
          }))
        : [],
  } as unknown as Performance;
}

function renderCheck() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ how: en.how }}>
      <NetworkCheck />
    </NextIntlClientProvider>,
  );
}

describe("NetworkCheck", () => {
  it("classifies cache, network, and cross-origin entries", () => {
    const origin = window.location.origin;
    vi.stubGlobal("performance", fakePerformance([
      { name: `${origin}/en/how/_next/static/x.js`, transferSize: 0 },
      { name: `${origin}/en/how/_next/static/y.js`, transferSize: 40 * 1024, startTime: 1 },
      { name: "https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR", transferSize: 300, startTime: 2 },
    ]));
    renderCheck();
    const local = screen.getAllByText("Served from cache or service worker");
    expect(local.length).toBeGreaterThan(0);
    expect(screen.getByText("/en/how/_next/static/y.js")).toBeInTheDocument();
    expect(screen.getByText("40 KB")).toBeInTheDocument();
    expect(screen.getByText("api.frankfurter.dev")).toBeInTheDocument();
    expect(screen.queryByText("None so far — as expected.")).not.toBeInTheDocument();
  });

  it("calls a clean tab fully local", () => {
    const origin = window.location.origin;
    vi.stubGlobal("performance", fakePerformance([
      { name: `${origin}/en/how/`, transferSize: 0 },
      { name: `${origin}/sw.js`, transferSize: 0, startTime: 1 },
    ]));
    renderCheck();
    expect(screen.getByText("None so far — as expected.")).toBeInTheDocument();
    expect(screen.getByText("/sw.js")).toBeInTheDocument();
  });

  it("explains itself when resource timing is unavailable", () => {
    vi.stubGlobal("performance", {} as Performance);
    renderCheck();
    expect(screen.getByText(/resource timing/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recheck" })).not.toBeInTheDocument();
  });
});
