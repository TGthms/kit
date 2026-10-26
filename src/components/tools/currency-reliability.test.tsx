// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { CurrencyConverter } from "./currency-converter";
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
vi.mock("./shared", () => ({ ToolShell: ({ children }: { children: ReactNode }) => <div>{children}</div>, useHistoryNote: () => vi.fn() }));
vi.mock("@/components/shared/animated-number", () => ({ AnimatedNumber: ({ value }: { value: number }) => <span>{value}</span> }));
vi.mock("@/components/ui/searchable-select", () => ({ SearchableSelect: ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <select aria-label={label + " currency"} value={value} onChange={(event) => onChange(event.target.value)}><option>USD</option><option>EUR</option></select> }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear(); });
function stalledFetch() {
  let signal!: AbortSignal;
  vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => {
    signal = options.signal as AbortSignal;
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
  }));
  return () => signal;
}
it("aborts an obsolete pair and clears loading when switching to the same currency", async () => {
  const signal = stalledFetch(); render(<CurrencyConverter />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled());
  fireEvent.change(screen.getByLabelText("To currency"), { target: { value: "USD" } });
  await waitFor(() => expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled());
  expect(signal().aborted).toBe(true);
});
it("ends a stalled rate refresh and lets the user retry", async () => {
  vi.useFakeTimers(); const signal = stalledFetch(); render(<CurrencyConverter />);
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  expect(signal().aborted).toBe(true);
  expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
  expect(screen.getByText(/timed out/)).toBeVisible();
});
