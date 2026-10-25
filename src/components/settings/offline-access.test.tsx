// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { tools, categories } from "@/lib/tools/registry";
import { APP_PAGE_IDS } from "@/lib/pwa/app-pages";
import { OFFLINE_PLAN_KEY, type OfflineState } from "@/lib/pwa/offline-status";
import { OfflineAccess } from "./offline-access";
import { APP_VERSION } from "@/lib/version";

const postMessage = vi.fn();
const worker = { postMessage };
let onMessage: ((event: MessageEvent) => void) | null = null;
let lastState: OfflineState | null = null;

function stubBrowser() {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({ active: worker }),
      getRegistration: async () => ({ active: worker, update: async () => undefined, addEventListener() {}, removeEventListener() {} }),
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

function renderOffline(customize = true) {
  const view = render(
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
  if (customize) fireEvent.click(screen.getByRole("button", { name: /Customize downloads/ }));
  return view;
}

function emit(data: Record<string, unknown>) {
  if (data.type === "OFFLINE_STATE") lastState = data.state as OfflineState | null;
  act(() => {
    onMessage?.({ source: worker, data: { type: "OFFLINE_PROGRESS", verified: data.type === "OFFLINE_STATE", requestId: sent("OFFLINE_DOWNLOAD")?.requestId, ...data } } as unknown as MessageEvent);
  });
}

/** A worker report: one language fully saved, one tool reachable offline. */
function savedState(overrides: Partial<OfflineState> = {}): OfflineState {
  return {
    generation: "3f9a1c4e77b2",
    verifiedAt: Date.now(),
    essentials: { en: { done: 6, total: 6, ready: true }, fr: { done: 3, total: 6, ready: false } },
    pages: { en: [...APP_PAGE_IDS], fr: [] },
    toolPages: { en: ["pdf-merge"], fr: [] },
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
    JSON.stringify({ version: "1.1.0", generation: "3f9a1c4e77b2", locales: ["en"], tools: ["pdf-merge"], engines: true, at: "2026-09-13T00:00:00.000Z", ...overrides }),
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

async function startDownload() {
  await sentEventually("OFFLINE_VERIFY");
  emit({ type: "OFFLINE_STATE", state: lastState ?? savedState() });
  if (!screen.queryByRole("button", { name: "Download" })) fireEvent.click(screen.getByRole("button", { name: /Customize downloads/ }));
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
}

beforeEach(() => {
  postMessage.mockReset();
  postMessage.mockImplementation((data, ports) => {
    if (data.type === "OFFLINE_REMOVE") { ports?.[0]?.postMessage({ ok: true }); ports?.[0]?.close(); }
  });
  onMessage = null;
  lastState = null;
  window.localStorage.clear();
  stubBrowser();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
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
  const found = heading.closest("[data-offline-picker]");
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
  it("offers every registered category, including new math tools", () => {
    renderOffline();
    const picker = within(card("Tools"));
    for (const category of categories) {
      const label = en.categories[category];
      expect(picker.getByRole("button", { name: new RegExp(`^${label} `) })).toBeInTheDocument();
    }
    fireEvent.click(picker.getByRole("button", { name: /^Math / }));
    expect(picker.getByRole("checkbox", { name: "Scientific calculator" })).toBeChecked();
    expect(picker.getByRole("checkbox", { name: "Equation solver" })).toBeChecked();
  });

  it("waits for each figure rather than showing one it has not measured", async () => {
    renderOffline();
    /* Nothing has been read yet, so all four figures are waits: a number here
       is always one that was measured, never a guess. */
    expect(within(figures()).getAllByText("Loading…")).toHaveLength(4);

    emit({ type: "OFFLINE_STATE", state: savedState() });
    await waitFor(() => expect(within(figures()).queryAllByText("Loading…")).toHaveLength(0));
    expect(within(figures()).getByText("English")).toBeInTheDocument();
  });

  it("reports the device rather than the current selection", async () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    /* One of two languages ready, one of 94 tools usable offline, the engines
       complete, and the storage estimate. The selection belongs to the pickers,
       where it is chosen, so a figure here is never a selection count. */
    await waitFor(() => expect(within(figures()).getByText("5.0 MB")).toBeInTheDocument());
    expect(within(figures()).getByText("English")).toBeInTheDocument();
    expect(within(figures()).getByText("1")).toBeInTheDocument();
    expect(within(figures()).getByText("Ready")).toBeInTheDocument();
  });

  it("asks the worker what is already saved", async () => {
    renderOffline();
    await waitFor(() => expect(sent("OFFLINE_STATUS")).toBeTruthy());
  });

  it("requests a download with the selected languages, tools, pages, and engines", async () => {
    renderOffline();
    await startDownload();
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
    await startDownload();
    await sentEventually("OFFLINE_DOWNLOAD");
    emit({ status: "running", done: 1, total: 2, logs: ["Downloaded: /en/"] });
    expect(screen.getByText("Downloaded: /en/")).toBeInTheDocument();
    emit({ status: "complete", done: 2, total: 2, logs: ["Downloaded: /en/tools/pdf-merge/"] });
    expect(screen.getByText("Downloaded: /en/tools/pdf-merge/")).toBeInTheDocument();
    expect(screen.getByText("Offline access is ready")).toBeInTheDocument();
  });

  it("accepts a single-line progress payload", async () => {
    renderOffline();
    await startDownload();
    await sentEventually("OFFLINE_DOWNLOAD");
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
    const english = within(card("Languages")).getByText("English").closest("label") as HTMLElement;
    const french = screen.getByText("Français").closest("label") as HTMLElement;
    expect(within(english).getByText("Ready")).toBeInTheDocument();
    expect(within(french).queryByText("Ready")).not.toBeInTheDocument();
  });

  it("keeps the picker free of any remove control", () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    const picker = within(card("Languages")).getByText("English").closest("label") as HTMLElement;
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
    await startDownload();

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

  it("is a download in its own right, without any tool", async () => {
    renderOffline();
    fireEvent.click(within(header("Tools")).getByRole("button", { name: "Clear" }));
    await sentEventually("OFFLINE_VERIFY");
    emit({ type: "OFFLINE_STATE", state: savedState() });
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
  it("start closed, rather than every list at once", () => {
    renderOffline();
    const tools = within(card("Tools"));
    expect(tools.queryByText("Merge PDFs")).toBeNull();
    expect(tools.getByRole("button", { name: /^PDF/ })).toHaveAttribute("aria-expanded", "false");
    expect(tools.getAllByRole("button", { expanded: false })).toHaveLength(categories.length);
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
    await waitFor(() => expect(window.localStorage.getItem(OFFLINE_PLAN_KEY)).toBeNull());
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
    await waitFor(() => expect(window.localStorage.getItem(OFFLINE_PLAN_KEY)).toBeNull());
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
    await startDownload();
    await sentEventually("OFFLINE_DOWNLOAD");
    expect(window.localStorage.getItem(OFFLINE_PLAN_KEY)).toBeNull();
    emit({ status: "complete", done: 2, total: 2, logs: [] });
    const stored = JSON.parse(window.localStorage.getItem(OFFLINE_PLAN_KEY) as string);
    expect(stored).toMatchObject({ generation: "3f9a1c4e77b2", locales: ["en"], engines: true });
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

    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    // The saved selection is re-run as it was, not whatever is on screen.
    expect(await sentEventually("OFFLINE_DOWNLOAD")).toMatchObject({ locales: ["en"], tools: ["pdf-merge"], engines: true });
  });

  it("re-runs the recorded selection, pages included, rather than what is on screen", async () => {
    record({ version: "1.0.0", pages: ["home", "history"] });
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    const payload = await sentEventually("OFFLINE_DOWNLOAD");
    expect(payload.pages).toEqual(["home", "history", "settings", "offline"]);
  });

  it("reports content a new release dropped, and offers to fetch it again", () => {
    record({ generation: "v12" });
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ locales: {}, tools: {}, readyLocales: 0 }) });
    expect(screen.getByText(en.settings.offlineRepair)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Repair" })).toBeInTheDocument();
  });
});

describe("reliable progress and status", () => {
  const chosen = { locales: ["en"] as const, tools: ["pdf-merge"] as const, pages: ["home"] as const, engines: false };

  it("reattaches to a download after leaving and returning, including a missed completion", async () => {
    const first = renderOffline();
    first.unmount();
    renderOffline();
    const running = { requestId: "background-job", status: "running", done: 2, total: 6, selection: chosen };
    emit({ type: "OFFLINE_STATE", state: savedState({ job: running as unknown as OfflineState["job"] }) });
    expect(screen.getByText("Progress · 33%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    // A status response can recover the terminal message that arrived while away.
    emit({ type: "OFFLINE_STATE", state: savedState({ job: { ...running, status: "complete", done: 6 } as unknown as OfflineState["job"] }) });
    expect(screen.getByText("Offline access is ready")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("offers continuation after the worker was terminated, rather than an endless running bar", async () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ job: {
      requestId: "terminated", status: "interrupted", done: 2, total: 6, logs: ["Download interrupted"], selection: chosen,
    } as unknown as OfflineState["job"] }) });
    expect(screen.getAllByText("Download interrupted").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await sentEventually("OFFLINE_DOWNLOAD")).toMatchObject({ locales: ["en"], tools: ["pdf-merge"], engines: false });
  });

  it("does not let a waiting worker's report replace the active release's saved status", async () => {
    const waiting = { postMessage: vi.fn() };
    navigator.serviceWorker.getRegistration = vi.fn(async () => ({ active: worker, waiting, update: async () => undefined, addEventListener() {}, removeEventListener() {} })) as never;
    renderOffline();
    await waitFor(() => expect(waiting.postMessage).toHaveBeenCalledWith({ type: "OFFLINE_STATUS" }));
    emit({ type: "OFFLINE_STATE", state: savedState() });
    act(() => { onMessage?.({ source: waiting, data: { type: "OFFLINE_STATE", state: savedState({ tools: {}, readyLocales: 0 }) } } as unknown as MessageEvent); });
    expect(within(figures()).getByText("1")).toBeInTheDocument();
    expect(within(figures()).getByText("English")).toBeInTheDocument();
  });

  it("synchronizes automatically carried downloads with the worker's actual release", () => {
    record({ generation: "old-generation" });
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ version: APP_VERSION, plan: {
      locales: ["en"], tools: ["pdf-merge"], pages: ["home"], engines: true, version: APP_VERSION, generation: "3f9a1c4e77b2", ready: true, at: "2026-10-21T00:00:00.000Z",
    } }) });
    expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(OFFLINE_PLAN_KEY)!)).toMatchObject({ generation: "3f9a1c4e77b2" });
  });

  it("shows repair for an evicted file instead of claiming the recorded selection is ready", () => {
    record({ version: APP_VERSION });
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ plan: {
      locales: ["en"], tools: ["pdf-merge"], pages: ["home"], engines: false, version: APP_VERSION, generation: "3f9a1c4e77b2", ready: false, at: "2026-10-21T00:00:00.000Z",
    } }) });
    expect(screen.getByText(en.settings.offlineRepair)).toBeInTheDocument();
  });

  it("does not forget the saved plan when removal fails", async () => {
    record();
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    postMessage.mockImplementation((data, ports) => {
      if (data.type === "OFFLINE_REMOVE") { ports[0].postMessage({ ok: false, error: "Storage is unavailable" }); ports[0].close(); }
    });
    openManageMenu();
    vi.stubGlobal("confirm", () => true);
    fireEvent.click(screen.getByRole("button", { name: "Remove all downloads" }));
    await waitFor(() => expect(screen.getAllByText("Storage is unavailable").length).toBeGreaterThan(0));
    expect(window.localStorage.getItem(OFFLINE_PLAN_KEY)).not.toBeNull();
  });

  it("reports a status failure rather than displaying an empty download list", () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: null, error: "Storage is unavailable" });
    expect(screen.getAllByText(en.settings.offlineUnavailable).length).toBeGreaterThan(0);
    expect(screen.queryByText(en.settings.offlineNothingSaved)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("distinguishes preparation from a measured download percentage", async () => {
    navigator.serviceWorker.getRegistration = vi.fn(() => new Promise<ServiceWorkerRegistration | undefined>(() => {}));
    renderOffline();
    await startDownload();
    expect(screen.getByText(en.settings.offlinePreparing)).toBeInTheDocument();
    expect(screen.queryByText("Progress · 0%")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.getByText("Download canceled")).toBeInTheDocument());
  });

  it("does not offer to remove a language holding only essential app pages", () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ locales: { en: { done: 6, total: 200, ready: false, removable: false } }, tools: {}, engines: { done: 0, total: 4 }, readyLocales: 0 }) });
    expect(screen.getByText(en.settings.offlineNothingSaved)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Manage downloads/ })).not.toBeInTheDocument();
  });
});

describe("clear offline readiness", () => {
  it("keeps a larger local collection until verification reconciles a smaller worker marker", async () => {
    record({ version: APP_VERSION });
    renderOffline(false);
    await sentEventually("OFFLINE_VERIFY");
    emit({ type: "OFFLINE_STATE", verified: false, state: savedState({ plan: {
      locales: ["en"], tools: [], pages: ["home"], engines: false, version: APP_VERSION, generation: "3f9a1c4e77b2", ready: true, at: "2026-10-21T00:00:00.000Z",
    } }) });
    expect(JSON.parse(window.localStorage.getItem(OFFLINE_PLAN_KEY)!)).toMatchObject({ tools: ["pdf-merge"], engines: true });
  });

  it("extends the checking deadline only for the controlling worker's verification progress", async () => {
    renderOffline(false);
    await sentEventually("OFFLINE_VERIFY");
    // Arm the timer with fake time after the initial ready promise has settled.
    vi.useFakeTimers();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    fireEvent.click(screen.getByRole("button", { name: "Check saved files" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    emit({ type: "OFFLINE_VERIFY_PROGRESS", done: 50, total: 100 });
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(screen.getByRole("heading", { name: en.settings.offlineChecking })).toBeInTheDocument();
    expect(screen.getByText("Progress · 50%")).toBeInTheDocument();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    expect(screen.getByRole("heading", { name: en.settings.offlineReadyTitle })).toBeInTheDocument();
  });

  it("keeps the actual worker failure available in download details", async () => {
    renderOffline(false);
    await sentEventually("OFFLINE_VERIFY");
    const detail = "Storage report · abc123 · UnknownError: Internal error";
    emit({ type: "OFFLINE_STATE", state: null, error: detail });
    expect(screen.getByText(detail)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.settings.offlineUnavailable })).toBeInTheDocument();
    emit({ type: "OFFLINE_STATE", state: savedState() });
    expect(screen.queryByText(detail)).not.toBeInTheDocument();
  });
  it("honors edited download choices when an update is available", async () => {
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ pendingUpdate: true }) });
    fireEvent.click(within(header("Tools")).getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Math (4)" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Function grapher" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Include large media engines/ }));
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(await sentEventually("OFFLINE_DOWNLOAD")).toMatchObject({ tools: ["function-grapher"], engines: false });
  });

  it("does not overwrite customized choices with an old saved plan during update", async () => {
    record();
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ pendingUpdate: true }) });
    fireEvent.click(within(header("Tools")).getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Math (4)" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Function grapher" }));
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(await sentEventually("OFFLINE_DOWNLOAD")).toMatchObject({ tools: ["function-grapher"] });
  });

  it("does not discard edits when the primary action is repair", async () => {
    record({ version: APP_VERSION, pages: ["home"] });
    renderOffline();
    emit({ type: "OFFLINE_STATE", state: savedState({ essentials: { en: { done: 0, total: 6, ready: false } } }) });
    fireEvent.click(within(header("Tools")).getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Math (4)" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Function grapher" }));
    fireEvent.click(screen.getByRole("button", { name: "Repair" }));
    expect(await sentEventually("OFFLINE_DOWNLOAD")).toMatchObject({ tools: ["function-grapher"] });
  });

  it("starts compact, with the choices behind one Customize downloads control", () => {
    renderOffline(false);
    expect(screen.getByRole("button", { name: /Customize downloads/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.settings.offlineChecking })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Customize downloads/ }));
    expect(screen.getByRole("checkbox", { name: "English" })).toBeInTheDocument();
  });

  it("does not claim readiness from a report that has not been verified", async () => {
    renderOffline(false);
    await sentEventually("OFFLINE_VERIFY");
    emit({ type: "OFFLINE_STATE", state: savedState(), verified: false });
    expect(screen.queryByRole("heading", { name: en.settings.offlineReadyTitle })).not.toBeInTheDocument();
    emit({ type: "OFFLINE_STATE", state: savedState(), verified: true });
    expect(screen.getByRole("heading", { name: en.settings.offlineReadyTitle })).toBeInTheDocument();
  });

  it("keeps verification failures visible until a successful check", async () => {
    renderOffline(false);
    await sentEventually("OFFLINE_VERIFY");
    emit({ type: "OFFLINE_STATE", state: null, verified: true, error: "could not verify" });
    emit({ type: "OFFLINE_STATE", state: savedState(), verified: false });
    expect(screen.getByRole("heading", { name: en.settings.offlineUnavailable })).toBeInTheDocument();
    emit({ type: "OFFLINE_STATE", state: savedState(), verified: true });
    expect(screen.getByRole("heading", { name: en.settings.offlineReadyTitle })).toBeInTheDocument();
  });

  it("preserves repair intent when cache metadata disappears", async () => {
    record({ version: APP_VERSION, pages: ["home"] });
    renderOffline(false);
    await sentEventually("OFFLINE_VERIFY");
    emit({ type: "OFFLINE_STATE", state: savedState({ plan: null, toolPages: { en: [] }, essentials: { en: { done: 0, total: 6, ready: false } } }) });
    expect(window.localStorage.getItem(OFFLINE_PLAN_KEY)).not.toBeNull();
    expect(screen.getByRole("heading", { name: en.settings.offlineRepairTitle })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Repair" }));
    expect(await sentEventually("OFFLINE_DOWNLOAD")).toMatchObject({ tools: ["pdf-merge"], engines: true });
  });

  it("reattaches to release preparation after leaving the page without sending duplicate downloads", async () => {
    const preparingPost = vi.fn();
    const installing = Object.assign(new EventTarget(), { state: "installing", postMessage: preparingPost });
    const registration = Object.assign(new EventTarget(), { active: worker, waiting: null as typeof installing | null, installing, update: vi.fn(async () => undefined) });
    navigator.serviceWorker.getRegistration = vi.fn(async () => registration) as never;
    const first = renderOffline(false);
    await startDownload();
    expect(screen.getByText(en.settings.offlinePreparing)).toBeInTheDocument();
    first.unmount();
    renderOffline(false);
    await waitFor(() => expect(screen.getByText(en.settings.offlinePreparing)).toBeInTheDocument());
    registration.waiting = installing; installing.state = "installed";
    act(() => installing.dispatchEvent(new Event("statechange")));
    await waitFor(() => expect(preparingPost).toHaveBeenCalledOnce());
    const payload = preparingPost.mock.calls[0][0];
    expect(payload.type).toBe("OFFLINE_DOWNLOAD");
    act(() => onMessage?.({ source: installing, data: { type: "OFFLINE_PROGRESS", requestId: payload.requestId, status: "running", done: 1, total: 6 } } as unknown as MessageEvent));
    expect(screen.getByText("Progress · 17%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(preparingPost).toHaveBeenLastCalledWith({ type: "OFFLINE_CANCEL", requestId: payload.requestId });
  });
});
it("lets partial media downloads be removed instead of leaving unmanageable storage behind", async () => {
  renderOffline(false);
  await sentEventually("OFFLINE_VERIFY");
  emit({ type: "OFFLINE_STATE", state: savedState({ engines: { done: 1, total: 4 }, locales: {}, tools: {}, toolPages: {}, readyLocales: 0 }) });
  expect(within(figures()).getByText("1 of 4 saved")).toBeInTheDocument();
  openManageMenu();
  const menu = within(manageMenu());
  fireEvent.click(menu.getByRole("checkbox", { name: "Include large media engines" }));
  fireEvent.click(menu.getByRole("button", { name: /Remove selected/ }));
  expect(await sentEventually("OFFLINE_REMOVE")).toMatchObject({ engines: true });
});
