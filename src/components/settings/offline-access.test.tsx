// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { tools } from "@/lib/tools/registry";
import { OfflineAccess } from "./offline-access";

const postMessage = vi.fn();
const worker = { postMessage };
let onMessage: ((event: MessageEvent) => void) | null = null;

function stubBrowser() {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({ active: worker }),
      controller: worker,
      addEventListener: (_type: string, listener: (event: MessageEvent) => void) => {
        onMessage = listener;
      },
      removeEventListener: () => undefined,
    },
  });
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: { estimate: async () => ({ usage: 5 * 1024 * 1024, quota: 100 * 1024 * 1024 }) },
  });
}

function renderOffline() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ settings: en.settings, common: en.common, categories: en.categories, tools: en.tools }}>
      <OfflineAccess />
    </NextIntlClientProvider>,
  );
}

function emit(data: Record<string, unknown>) {
  act(() => {
    onMessage?.({ data: { type: "OFFLINE_PROGRESS", ...data } } as MessageEvent);
  });
}

beforeEach(() => {
  postMessage.mockClear();
  onMessage = null;
  stubBrowser();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("OfflineAccess", () => {
  it("summarizes the current selection and the storage estimate", async () => {
    renderOffline();
    expect(screen.getByText(String(tools.length))).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("5.0 MB / 100.0 MB")).toBeInTheDocument());
  });

  it("requests a download with the selected languages, tools, and engines", async () => {
    renderOffline();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() =>
      expect(postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "OFFLINE_DOWNLOAD",
          locales: ["en"],
          engines: true,
        }),
      ),
    );
    const payload = postMessage.mock.calls[0][0] as { tools: string[] };
    expect(payload.tools).toContain("pdf-merge");
    expect(payload.tools).toHaveLength(tools.length);
  });

  it("renders batched progress logs and the completed state", async () => {
    renderOffline();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    emit({ status: "running", done: 1, total: 2, logs: ["Downloaded: /en/"] });
    expect(screen.getByText("Downloaded: /en/")).toBeInTheDocument();
    emit({ status: "complete", done: 2, total: 2, logs: ["Downloaded: /en/tools/pdf-merge/"] });
    expect(screen.getByText("Downloaded: /en/tools/pdf-merge/")).toBeInTheDocument();
    expect(screen.getByText("Offline access is ready")).toBeInTheDocument();
  });

  it("accepts a single-line progress payload", async () => {
    renderOffline();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    emit({ status: "running", done: 1, total: 2, log: "Preparing 2 items" });
    expect(screen.getByText("Preparing 2 items")).toBeInTheDocument();
  });
});
