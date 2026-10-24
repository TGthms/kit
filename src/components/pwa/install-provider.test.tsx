// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { InstallProvider } from "./install-provider";
import { InstallApp } from "../settings/install-app";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => en.settings[key as keyof typeof en.settings] }));
beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => Object.assign(new EventTarget(), { media: query, matches: false }));
  Object.defineProperty(navigator, "standalone", { configurable: true, value: false });
});
afterEach(() => { cleanup(); Reflect.deleteProperty(navigator, "maxTouchPoints"); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function setup() { return render(<InstallProvider><InstallApp /></InstallProvider>); }
function offer(prompt = vi.fn(async () => ({ outcome: "dismissed" }))) {
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt });
  act(() => { window.dispatchEvent(event); });
  return { event, prompt };
}
it("only shows a real install action when the browser supplies one, and consumes it once", async () => {
  setup();
  expect(screen.queryByRole("button", { name: en.settings.installTitle })).toBeNull();
  let finish!: (value: { outcome: string }) => void;
  const { event, prompt } = offer(vi.fn(() => new Promise((resolve) => { finish = resolve; })));
  expect(event.defaultPrevented).toBe(true);
  const button = screen.getByRole("button", { name: en.settings.installTitle });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(prompt).toHaveBeenCalledOnce();
  expect((button as HTMLButtonElement).disabled).toBe(true);
  await act(async () => { finish({ outcome: "dismissed" }); });
  expect(screen.queryByRole("button", { name: en.settings.installTitle })).toBeNull();
  expect(screen.queryByText(en.settings.installInstalled)).toBeNull();
  offer();
  expect(screen.getByRole("button", { name: en.settings.installTitle })).toBeTruthy();
});
it("waits for installation confirmation rather than treating prompt acceptance as success", async () => {
  setup();
  offer(vi.fn(async () => ({ outcome: "accepted" })));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: en.settings.installTitle })); });
  expect(screen.queryByText(en.settings.installInstalled)).toBeNull();
  act(() => { window.dispatchEvent(new Event("appinstalled")); });
  expect(screen.getByText(en.settings.installInstalled)).toBeTruthy();
});
it("handles a rejected prompt and offers browser guidance without reusing the event", async () => {
  setup();
  offer(vi.fn(async () => { throw new Error("blocked"); }));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: en.settings.installTitle })); });
  expect(screen.getByRole("status").textContent).toBe(en.settings.installFailed);
  expect(screen.queryByRole("button", { name: en.settings.installTitle })).toBeNull();
});
it("recognizes iPad desktop-mode Safari and shows manual Home Screen guidance", () => {
  vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
  Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 5 });
  setup();
  expect(screen.getByText(en.settings.installIos)).toBeTruthy();
});
it("does not promote installation inside the installed app", () => {
  Object.defineProperty(navigator, "standalone", { value: true });
  setup();
  expect(screen.getByText(en.settings.installInstalled)).toBeTruthy();
  offer();
  expect(screen.queryByRole("button", { name: en.settings.installTitle })).toBeNull();
});
