// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { CheckUpdates } from "./check-updates";
import { OFFER_UPDATE_EVENT } from "@/lib/pwa/update-notice";
const check = vi.hoisted(() => vi.fn());
vi.mock("@/lib/pwa/check-update", () => ({ checkForAppUpdate: check }));
afterEach(() => { cleanup(); check.mockReset(); vi.restoreAllMocks(); });
function setup() { render(<NextIntlClientProvider locale="en" messages={en}><CheckUpdates /></NextIntlClientProvider>); }
it("reports a current release and permits another explicit check", async () => {
  check.mockResolvedValue("current"); setup();
  fireEvent.click(screen.getByRole("button", { name: en.settings.checkUpdates }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.settings.updateCurrent));
  expect(screen.getByRole("button")).toBeEnabled();
});
it("prevents double checks and routes an available update to the existing shell action", async () => {
  let complete!: (value: string) => void;
  check.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
  const offered = vi.fn(); window.addEventListener(OFFER_UPDATE_EVENT, offered);
  try {
    setup();
    fireEvent.click(screen.getByRole("button")); fireEvent.click(screen.getByRole("button"));
    expect(check).toHaveBeenCalledOnce(); expect(screen.getByRole("button")).toBeDisabled();
    await act(async () => complete("available"));
    expect(offered).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent(en.settings.updateAvailable);
  } finally { window.removeEventListener(OFFER_UPDATE_EVENT, offered); }
});
it("explains errors without claiming the release is current", async () => {
  check.mockRejectedValue(new Error("network")); setup(); fireEvent.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.settings.updateCheckFailed));
});
it("aborts a pending check on leaving Settings", () => {
  check.mockImplementation(() => new Promise(() => {}));
  const view = render(<NextIntlClientProvider locale="en" messages={en}><CheckUpdates /></NextIntlClientProvider>);
  fireEvent.click(screen.getByRole("button"));
  const signal = check.mock.calls[0][0] as AbortSignal;
  view.unmount(); expect(signal.aborted).toBe(true);
});
it("replaces preparing with a retryable failure when the browser discards the installer", async () => {
  class Installer extends EventTarget { state = "installing"; }
  const installer = new Installer();
  const registration = Object.assign(new EventTarget(), { installing: installer as Installer | null, waiting: null, active: {} });
  const prior = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { getRegistration: vi.fn().mockResolvedValue(registration) } });
  try {
    check.mockResolvedValueOnce("preparing").mockResolvedValueOnce("current"); setup();
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.settings.updatePreparing));
    await act(async () => { registration.installing = null; installer.state = "redundant"; installer.dispatchEvent(new Event("statechange")); });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.settings.updateCheckFailed));
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(en.settings.updateCurrent));
  } finally { if (prior) Object.defineProperty(navigator, "serviceWorker", prior); else Reflect.deleteProperty(navigator, "serviceWorker"); }
});
