// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { useHistoryStore } from "@/stores/history-store";
import { useHistoryNote } from "./shared";

const sonner = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: sonner.toast }));

/* The tool shell imports these at module scope; nothing rendered here uses
   them, and the real module reaches for a Next router that a test has none of. */
vi.mock("@/lib/i18n/navigation", () => ({
  Link: () => null,
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

/** The record button of a tool, reduced to what a reader can act on. */
function RecordButton({ summary = "3 files" }: { summary?: string }) {
  const note = useHistoryNote("pdf-merge");
  return <button onClick={() => note(summary, "Saved to history.")}>Record</button>;
}

function renderNote(summary?: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ history: en.history }}>
      <RecordButton summary={summary} />
    </NextIntlClientProvider>
  );
}

/** The notice the reader was shown. */
function notice() {
  const call = sonner.toast.mock.calls[0] as [
    string,
    { id?: string; action?: { label: string; onClick: () => void } }
  ];
  return { message: call[0], options: call[1] };
}

function entries() {
  return useHistoryStore.getState().entries;
}

beforeEach(() => {
  useHistoryStore.setState({ entries: [], enabled: false });
  sonner.toast.mockClear();
  sonner.toast.success.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("recording to history", () => {
  it("saves and confirms when recording is already on", () => {
    useHistoryStore.setState({ enabled: true });
    renderNote();
    fireEvent.click(screen.getByRole("button", { name: "Record" }));

    expect(entries()).toHaveLength(1);
    expect(entries()[0]).toMatchObject({ toolId: "pdf-merge", summary: "3 files" });
    expect(sonner.toast.success).toHaveBeenCalledWith("Saved to history.", { id: "kit-notice" });
  });

  it("offers the way to turn recording on instead of only refusing", () => {
    renderNote();
    fireEvent.click(screen.getByRole("button", { name: "Record" }));

    const { message, options } = notice();
    expect(message).toBe(en.history.notSaved);
    expect(options.action?.label).toBe(en.history.enableRecording);
    // Still off, and nothing written behind the visitor's back.
    expect(useHistoryStore.getState().enabled).toBe(false);
    expect(entries()).toEqual([]);
  });

  it("keeps the action that prompted it, so it need not be taken twice", () => {
    renderNote();
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    const prompt = notice();

    act(() => prompt.options.action?.onClick());

    expect(useHistoryStore.getState().enabled).toBe(true);
    expect(entries()).toHaveLength(1);
    expect(entries()[0]).toMatchObject({ toolId: "pdf-merge", summary: "3 files", status: "success" });
    /* Two things changed at once, so the confirmation names both: the setting,
       and the action that asked for it. Saying only "saved" would leave the
       visitor to discover later that recording had been switched on. */
    const [message, options] = sonner.toast.success.mock.calls[0] as [string, { id?: string }];
    expect(message).toBe(en.history.enabledAndSaved);
    /* And under an id of its own: taking an action dismisses the notice it
       belonged to, so a confirmation sharing that id would go with it and the
       visitor would see nothing at all. */
    expect(options.id).toBeTruthy();
    expect(options.id).not.toBe(prompt.options.id);
  });

  it("takes the ordinary path on the next tap, without asking again", () => {
    renderNote();
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    act(() => notice().options.action?.onClick());
    sonner.toast.mockClear();
    sonner.toast.success.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Record" }));

    expect(entries()).toHaveLength(2);
    expect(sonner.toast).not.toHaveBeenCalled();
    // Now it is only a save, so the tool's own confirmation is the right one.
    expect(sonner.toast.success).toHaveBeenCalledWith("Saved to history.", { id: "kit-notice" });
  });

  it("is the same recording, so the privacy rules still apply to it", () => {
    /* Turning recording on in the notice keeps the action, not the raw input:
       free-form text is reduced exactly as it is on the ordinary path. */
    renderNote("2 people · 30.00 for dinner");
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    act(() => notice().options.action?.onClick());

    expect(entries()[0]).toMatchObject({ toolId: "pdf-merge", summary: "completed" });
  });
});
