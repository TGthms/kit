// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { tools } from "@/lib/tools/registry";
import { OFFLINE_PLAN_KEY, type OfflineState } from "@/lib/pwa/offline-status";
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

/** A worker report: one language fully saved, one tool reachable offline. */
function savedState(overrides: Partial<OfflineState> = {}): OfflineState {
  return {
    generation: "v13",
    core: { done: 10, total: 10 },
    engines: { done: 4, total: 4 },
    locales: { en: { done: 12, total: 12, ready: true }, fr: { done: 3, total: 12, ready: false } },
    tools: { "pdf-merge": 1 },
    readyLocales: 1,
    ...overrides,
  };
}

function record(overrides: Record<string, unknown> = {}) {
  window.localStorage.setItem(
    OFFLINE_PLAN_KEY,
    JSON.stringify({ version: "1.1.0", generation: "v13", locales: ["en"], tools: ["pdf-merge"], engines: true, at: "2026-09-13T00:00:00.000Z", ...overrides }),
  );
}

/** The message the page sent to the worker, by type. */
function sent(type: string): Record<string, unknown> | undefined {
  return postMessage.mock.calls.map((call) => call[0] as Record<string, unknown>).find((message) => message.type === type);
}

/** Reaching the worker goes through a promise, so sending is not synchronous. */
async function sentEventually(type: string): Promise<Record<string, unknown>> {
  await waitFor(() => expect(sent(type)).toBeTruthy());
  return sent(type) as Record<string, unknown>;
}

beforeEach(() => {
  postMessage.mockClear();
  onMessage = null;
  window.localStorage.clear();
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

  it("asks the worker what is already saved", async () => {
    renderOffline();
    await waitFor(() => expect(sent("OFFLINE_STATUS")).toBeTruthy());
  });

  it("requests a download with the selected languages, tools, and engines", async () => {
    renderOffline();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(sent("OFFLINE_DOWNLOAD")).toBeTruthy());
    const payload = sent("OFFLINE_DOWNLOAD") as { locales: string[]; engines: boolean; tools: string[] };
    expect(payload.locales).toEqual(["en"]);
    expect(payload.engines).toBe(true);
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

describe("what is already saved", () => {
  it("reports the languages, tools, and engines the worker holds", () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    expect(screen.getByText(/What's saved/)).toBeInTheDocument();
    // One of the two languages is complete, and the engines are all there.
    expect(screen.getByText(/Languages 1\/2/)).toBeInTheDocument();
    expect(screen.getByText(/Media engines Ready/)).toBeInTheDocument();
  });

  it("marks a ready language in the picker and leaves a part-saved one unmarked", () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    const english = screen.getByText("English").closest("label") as HTMLElement;
    const french = screen.getByText("Français").closest("label") as HTMLElement;
    expect(within(english).getByText("Ready")).toBeInTheDocument();
    expect(within(french).queryByText("Ready")).not.toBeInTheDocument();
  });

  it("keeps the picker free of any remove control", () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    const picker = screen.getByText("English").closest("label") as HTMLElement;
    // Choosing and removing are separate jobs, so a picker row holds one control.
    expect(within(picker).getAllByRole("checkbox")).toHaveLength(1);
    expect(within(picker).queryAllByRole("button")).toHaveLength(0);
  });
});

/** The body of the Manage downloads menu, which only exists once expanded. */
function manageMenu(): HTMLElement {
  const body = document.getElementById("kit-offline-manage");
  expect(body).not.toBeNull();
  return body as HTMLElement;
}

function openManageMenu() {
  fireEvent.click(screen.getByRole("button", { name: /Manage downloads/ }));
}

describe("manage downloads", () => {
  it("stays closed until it is asked for", () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    const toggle = screen.getByRole("button", { name: /Manage downloads/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "kit-offline-manage");
    expect(document.getElementById("kit-offline-manage")).toBeNull();

    openManageMenu();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("kit-offline-manage")).not.toBeNull();
  });

  it("lists what is on the device rather than the whole catalogue", () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    openManageMenu();
    const body = within(manageMenu());
    // Two languages, one tool, one engines row: not 30 languages and 94 tools.
    expect(body.getAllByRole("checkbox")).toHaveLength(4);
    expect(body.getByRole("checkbox", { name: /Français/ })).toBeInTheDocument();
    expect(body.getByRole("checkbox", { name: /Merge PDFs/ })).toBeInTheDocument();
    expect(body.queryByRole("checkbox", { name: /Split PDF/ })).toBeNull();
  });

  it("counts a language's saving and a tool's reach against what it can see", () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    openManageMenu();
    const body = within(manageMenu());
    // Complete, partway, and held by one of the two languages that have
    // anything saved — never a denominator of zero.
    expect(body.getByText("Ready")).toBeInTheDocument();
    expect(body.getByText("3 of 12 saved")).toBeInTheDocument();
    expect(body.getByText("1/2")).toBeInTheDocument();
  });

  it("says there is nothing to remove, and offers no disclosure", () => {
    renderOffline();
    emit({
      type: "OFFLINE_STATE",
      state: savedState({ locales: {}, tools: {}, readyLocales: 0, engines: { done: 0, total: 4 } }),
    });
    // Nothing to manage, so the card is a note rather than a control that
    // reports itself expanded while showing nothing.
    expect(screen.queryByRole("button", { name: /Manage downloads/ })).toBeNull();
    expect(screen.getByText("Nothing is saved on this device yet.")).toBeInTheDocument();
    expect(document.getElementById("kit-offline-manage")).toBeNull();
  });

  it("names the count in the control and sends one message for the ticked set", async () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    openManageMenu();
    const body = within(manageMenu());
    const remove = body.getByRole("button", { name: /Remove selected/ });
    // Nothing is ticked, so there is nothing to send and no count to show.
    expect(remove).toBeDisabled();
    expect(within(remove).queryByText("2")).toBeNull();

    fireEvent.click(body.getByRole("checkbox", { name: /Français/ }));
    fireEvent.click(body.getByRole("checkbox", { name: /Merge PDFs/ }));
    expect(within(remove).getByText("2")).toBeInTheDocument();
    fireEvent.click(remove);

    expect(await sentEventually("OFFLINE_REMOVE")).toMatchObject({
      locales: ["fr"],
      tools: ["pdf-merge"],
      engines: false,
    });
  });

  it("takes everything when the whole selection is ticked", async () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    openManageMenu();
    const body = within(manageMenu());
    fireEvent.click(body.getByRole("button", { name: "Select all" }));
    fireEvent.click(body.getByRole("button", { name: /Remove selected/ }));

    expect(await sentEventually("OFFLINE_REMOVE")).toMatchObject({
      locales: ["en", "fr"],
      tools: ["pdf-merge"],
      engines: true,
    });
  });

  it("forgets the record once the selection takes all of it", async () => {
    record();
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    openManageMenu();
    const body = within(manageMenu());
    fireEvent.click(body.getByRole("button", { name: "Select all" }));
    fireEvent.click(body.getByRole("button", { name: /Remove selected/ }));
    await sentEventually("OFFLINE_REMOVE");
    expect(window.localStorage.getItem(OFFLINE_PLAN_KEY)).toBeNull();
  });

  it("keeps the record when only part of it goes", async () => {
    record();
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    openManageMenu();
    const body = within(manageMenu());
    fireEvent.click(body.getByRole("checkbox", { name: /Français/ }));
    fireEvent.click(body.getByRole("button", { name: /Remove selected/ }));
    await sentEventually("OFFLINE_REMOVE");
    expect(window.localStorage.getItem(OFFLINE_PLAN_KEY)).not.toBeNull();
  });

  it("removes everything from one control, after confirming", async () => {
    record();
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    openManageMenu();
    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal("confirm", confirmSpy);
    fireEvent.click(within(manageMenu()).getByRole("button", { name: "Remove all downloads" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(await sentEventually("OFFLINE_REMOVE")).toMatchObject({ all: true });
    expect(window.localStorage.getItem(OFFLINE_PLAN_KEY)).toBeNull();
  });

  it("sends nothing when the removal is not confirmed", async () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    openManageMenu();
    vi.stubGlobal("confirm", vi.fn(() => false));
    fireEvent.click(within(manageMenu()).getByRole("button", { name: "Remove all downloads" }));
    await waitFor(() => expect(sent("OFFLINE_STATUS")).toBeTruthy());
    expect(sent("OFFLINE_REMOVE")).toBeUndefined();
  });
});

describe("release changes", () => {
  it("records the selection only once the download reports completion", async () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await sentEventually("OFFLINE_DOWNLOAD");
    expect(window.localStorage.getItem(OFFLINE_PLAN_KEY)).toBeNull();
    emit({ status: "complete", done: 2, total: 2, logs: [] });
    const stored = JSON.parse(window.localStorage.getItem(OFFLINE_PLAN_KEY) as string);
    expect(stored).toMatchObject({ generation: "v13", locales: ["en"], engines: true });
    expect(stored.tools).toHaveLength(tools.length);
  });

  it("says nothing about a record whose content the visitor removed", () => {
    record();
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ locales: {}, tools: {}, readyLocales: 0 }) });
    expect(screen.queryByText(/earlier release/)).not.toBeInTheDocument();
    expect(screen.queryByText(/removed when Kit updated/)).not.toBeInTheDocument();
  });

  it("reports content left behind by an earlier release and offers to update it", async () => {
    record({ version: "1.0.0" });
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    expect(screen.getByText(/from an earlier release/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Update downloads" }));
    // The saved selection is re-run as it was, not whatever is on screen.
    expect(await sentEventually("OFFLINE_DOWNLOAD")).toMatchObject({ locales: ["en"], tools: ["pdf-merge"], engines: true });
  });

  it("reports content a new release dropped, and offers to fetch it again", () => {
    record({ generation: "v12" });
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ locales: {}, tools: {}, readyLocales: 0 }) });
    expect(screen.getByText(/removed when Kit updated/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update downloads" })).toBeInTheDocument();
  });
});
