// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { tools } from "@/lib/tools/registry";
import { APP_PAGE_IDS } from "@/lib/pwa/app-pages";
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
    <NextIntlClientProvider
      locale="en"
      messages={{
        settings: en.settings,
        common: en.common,
        categories: en.categories,
        tools: en.tools,
        nav: en.nav,
        footer: en.footer,
        home: en.home,
      }}
    >
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

/** The card of figures. Nothing else on the page uses a description list. */
function figures(): HTMLElement {
  const card = document.querySelector("dl");
  expect(card).not.toBeNull();
  return card as HTMLElement;
}

/** The card headed by `title`, so one picker can be scoped on its own. */
function card(title: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: title, level: 3 });
  const found = heading.closest("div.rounded-2xl");
  expect(found).not.toBeNull();
  return found as HTMLElement;
}

/**
 * A picker's heading strip, where its own Select all and Clear live. A category
 * row offers the same two words once everything in it is ticked, so the whole
 * card cannot be used to find them.
 */
function header(title: string): HTMLElement {
  const first = card(title).firstElementChild;
  expect(first).not.toBeNull();
  return first as HTMLElement;
}

/** The app's own pages the card offers, in the order it lists them. */
const PAGE_LABELS = [
  "Home",
  "Favorites",
  "History",
  "Settings",
  "Offline access",
  "How Kit works",
  "Privacy Policy",
  "Terms of Use",
  "Categories",
];

function pageBoxes(): HTMLInputElement[] {
  return PAGE_LABELS.map((label) => screen.getByRole("checkbox", { name: label }) as HTMLInputElement);
}

describe("OfflineAccess", () => {
  it("waits for each figure rather than showing one it has not measured", async () => {
    renderOffline();
    /* Nothing has been read yet, so all four figures are waits: a number here
       is always one that was measured, never a guess. */
    expect(within(figures()).getAllByText("Loading…")).toHaveLength(4);

    emit({ type: "OFFLINE_STATE", state: savedState() });
    await waitFor(() => expect(within(figures()).queryAllByText("Loading…")).toHaveLength(0));
    expect(within(figures()).getByText("1 / 2")).toBeInTheDocument();
  });

  it("reports the device rather than the current selection", async () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    /* One of two languages ready, one of 94 tools usable offline, the engines
       complete, and the storage estimate. The selection belongs to the pickers,
       where it is chosen, so a figure here is never a selection count. */
    await waitFor(() => expect(within(figures()).getByText("5.0 MB / 100.0 MB")).toBeInTheDocument());
    expect(within(figures()).getByText("1 / 2")).toBeInTheDocument();
    expect(within(figures()).getByText("1 / 94")).toBeInTheDocument();
    expect(within(figures()).getByText("Ready")).toBeInTheDocument();
  });

  it("asks the worker what is already saved", async () => {
    renderOffline();
    await waitFor(() => expect(sent("OFFLINE_STATUS")).toBeTruthy());
  });

  it("requests a download with the selected languages, tools, pages, and engines", async () => {
    renderOffline();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(sent("OFFLINE_DOWNLOAD")).toBeTruthy());
    const payload = sent("OFFLINE_DOWNLOAD") as {
      locales: string[];
      engines: boolean;
      tools: string[];
      pages: string[];
    };
    expect(payload.locales).toEqual(["en"]);
    expect(payload.engines).toBe(true);
    expect(payload.tools).toContain("pdf-merge");
    expect(payload.tools).toHaveLength(tools.length);
    expect(payload.pages).toEqual([...APP_PAGE_IDS]);
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
  it("waits in the menu too, rather than saying nothing is saved", async () => {
    renderOffline();
    /* The worker has not answered, so the page states nothing about the device
       and does not claim the device is empty. */
    expect(screen.queryByText("Nothing is saved on this device yet.")).not.toBeInTheDocument();
    expect(screen.getAllByText("Loading…").length).toBeGreaterThan(0);

    emit({ type: "OFFLINE_STATE", state: savedState() });
    await waitFor(() => expect(screen.queryAllByText("Loading…")).toHaveLength(0));
    expect(screen.queryByText("Nothing is saved on this device yet.")).not.toBeInTheDocument();
  });

  it("says nothing is saved once the worker has reported an empty device", () => {
    renderOffline();
    emit({
      type: "OFFLINE_STATE",
      state: savedState({ locales: {}, tools: {}, readyLocales: 0, engines: { done: 0, total: 4 } }),
    });
    expect(screen.getByText("Nothing is saved on this device yet.")).toBeInTheDocument();
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

describe("the app's own pages", () => {
  it("offers every one of them, ticked, without being asked", () => {
    renderOffline();
    /* Kit cannot open with the network off without its own pages, so they
       arrive selected — and they are downloads like any other, so each one can
       be left out on its own. */
    expect(pageBoxes()).toHaveLength(APP_PAGE_IDS.length);
    expect(pageBoxes().every((box) => box.checked)).toBe(true);
  });

  it("takes the ticked set with the download", async () => {
    renderOffline();
    fireEvent.click(screen.getByRole("checkbox", { name: "History" }));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    const payload = await sentEventually("OFFLINE_DOWNLOAD");
    expect(payload.pages).not.toContain("history");
    expect(payload.pages).toContain("offline");
    expect(payload.pages).toHaveLength(APP_PAGE_IDS.length - 1);
  });

  it("selects and clears the whole card from its own controls", () => {
    renderOffline();
    const pages = within(header("Pages"));
    fireEvent.click(pages.getByRole("button", { name: "Clear" }));
    expect(pageBoxes().some((box) => box.checked)).toBe(false);

    fireEvent.click(pages.getByRole("button", { name: "Select all" }));
    expect(pageBoxes().every((box) => box.checked)).toBe(true);
  });

  it("is a download in its own right, without any tool", () => {
    renderOffline();
    fireEvent.click(within(header("Tools")).getByRole("button", { name: "Clear" }));
    // Preparing the app itself for offline is a small, legitimate download.
    expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
  });

  it("will not start a download that asks for nothing at all", () => {
    renderOffline();
    fireEvent.click(within(header("Tools")).getByRole("button", { name: "Clear" }));
    fireEvent.click(within(header("Pages")).getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("button", { name: "Download" })).toBeDisabled();
  });
});

describe("the tool categories", () => {
  it("start closed, rather than nine lists at once", () => {
    renderOffline();
    const tools = within(card("Tools"));
    expect(tools.queryByText("Merge PDFs")).toBeNull();
    expect(tools.getByRole("button", { name: /^PDF/ })).toHaveAttribute("aria-expanded", "false");
    expect(tools.getAllByRole("button", { expanded: false })).toHaveLength(9);
  });

  it("open one at a time, and the tools inside still choose", () => {
    renderOffline();
    const tools = within(card("Tools"));
    fireEvent.click(tools.getByRole("button", { name: /^PDF/ }));
    expect(tools.getByText("Merge PDFs")).toBeInTheDocument();
    // Another category stays as it was.
    expect(tools.queryByText("Compress images")).toBeNull();
  });
});

/** The body of the Manage downloads menu, which only exists once expanded. */function manageMenu(): HTMLElement {
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

  it("lists what is on the device rather than the whole catalog", () => {
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
    expect(stored.pages).toEqual([...APP_PAGE_IDS]);
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

  it("re-runs the recorded selection, pages included, rather than what is on screen", async () => {
    record({ version: "1.0.0", pages: ["home", "history"] });
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    fireEvent.click(screen.getByRole("button", { name: "Update downloads" }));
    const payload = await sentEventually("OFFLINE_DOWNLOAD");
    expect(payload.pages).toEqual(["home", "history"]);
  });

  it("reports content a new release dropped, and offers to fetch it again", () => {
    record({ generation: "v12" });
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ locales: {}, tools: {}, readyLocales: 0 }) });
    expect(screen.getByText(/removed when Kit updated/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update downloads" })).toBeInTheDocument();
  });
});
