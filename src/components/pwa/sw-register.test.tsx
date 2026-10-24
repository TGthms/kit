// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { ServiceWorkerRegister } from "./sw-register";

const { notify, updateApp } = vi.hoisted(() => ({ notify: Object.assign(vi.fn(), { dismiss: vi.fn(), loading: vi.fn(), error: vi.fn() }), updateApp: vi.fn() }));
vi.mock("sonner", () => ({ toast: notify }));
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => en.settings[key as keyof typeof en.settings] }));
vi.mock("@/lib/pwa/offline-worker", () => ({ updateOfflineApp: updateApp }));

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  notify.mockClear(); notify.dismiss.mockClear(); notify.loading.mockClear(); notify.error.mockClear();
  updateApp.mockReset(); updateApp.mockImplementation(() => new Promise(() => {}));
  window.history.replaceState({}, "", "/en/tools/length-converter/");
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function workerRegistration(waiting: EventTarget | null) {
  const worker = Object.assign(new EventTarget(), { postMessage: vi.fn() });
  const registration = Object.assign(new EventTarget(), { active: worker, installing: null, waiting, update: async () => undefined });
  const container = Object.assign(new EventTarget(), { register: async () => registration, ready: Promise.resolve(registration) });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });
  return registration;
}
it("offers an Update action that starts the update directly and suppresses duplicate clicks", async () => {
  workerRegistration(new EventTarget());
  render(<ServiceWorkerRegister />);
  await waitFor(() => expect(notify).toHaveBeenCalledOnce());
  expect(notify.mock.calls[0][0]).toBe(en.settings.updateAvailable);
  const options = notify.mock.calls[0][1];
  expect(options.duration).toBe(Infinity);
  expect(options.action.label).toBe(en.settings.reviewUpdate);
  options.action.onClick();
  options.action.onClick();
  expect(updateApp).toHaveBeenCalledOnce();
  expect(notify.loading).toHaveBeenCalledWith(en.settings.offlinePreparing, expect.any(Object));
});
it("does not duplicate the notice already shown on the offline page", async () => {
  const registration = workerRegistration(new EventTarget());
  const update = vi.spyOn(registration, "update");
  window.history.replaceState({}, "", "/en/settings/offline/");
  render(<ServiceWorkerRegister />);
  await waitFor(() => expect(update).toHaveBeenCalledOnce());
  expect(notify).not.toHaveBeenCalled();
});
it("lets the error toast retry the update directly and refresh an obsolete waiting release", async () => {
  workerRegistration(new EventTarget());
  updateApp.mockRejectedValueOnce(new Error("connection lost"));
  render(<ServiceWorkerRegister />);
  await waitFor(() => expect(notify).toHaveBeenCalledOnce());
  notify.mock.calls[0][1].action.onClick();
  await waitFor(() => expect(notify.error).toHaveBeenCalledOnce());
  notify.error.mock.calls[0][1].action.onClick();
  expect(updateApp).toHaveBeenCalledTimes(2);
  expect(updateApp.mock.calls[1][1]).toBe(true);
});
it("resumes a visibility-paused fill without needing a subsequent interaction", async () => {
  vi.useFakeTimers();
  const registration = workerRegistration(null);
  vi.stubGlobal("fetch", vi.fn(async () => new Response("flight")));
  render(<ServiceWorkerRegister />);
  await act(async () => { await Promise.resolve(); });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  document.dispatchEvent(new Event("visibilitychange"));
  expect(registration.active.postMessage).toHaveBeenCalledWith({ type: "PRECACHE_PAUSE" });
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(registration.active.postMessage).toHaveBeenCalledWith({ type: "PRECACHE_RESUME" });
});

it("retries an offline registration failure on reconnect without duplicate registrations", async () => {
  const registration = workerRegistration(null);
  const register = vi.spyOn(navigator.serviceWorker, "register");
  let complete!: (value: ServiceWorkerRegistration) => void;
  register.mockRejectedValueOnce(new Error("offline")).mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
  render(<ServiceWorkerRegister />);
  await waitFor(() => expect(register).toHaveBeenCalledOnce());
  await act(async () => { await Promise.resolve(); });
  act(() => { window.dispatchEvent(new Event("online")); window.dispatchEvent(new Event("online")); });
  expect(register).toHaveBeenCalledTimes(2);
  await act(async () => { complete(registration as unknown as ServiceWorkerRegistration); });
  expect(registration.active.postMessage).toHaveBeenCalledWith({ type: "PRECACHE_HOME", url: expect.stringContaining("/en/") });
});

it("cleans up reconnect listeners when leaving the app shell", async () => {
  workerRegistration(null);
  const register = vi.spyOn(navigator.serviceWorker, "register").mockRejectedValue(new Error("offline"));
  const { unmount } = render(<ServiceWorkerRegister />);
  await waitFor(() => expect(register).toHaveBeenCalledOnce());
  unmount();
  window.dispatchEvent(new Event("online"));
  expect(register).toHaveBeenCalledOnce();
});

it("does not throttle a reconnect check after an earlier update request failed", async () => {
  vi.useFakeTimers();
  const registration = workerRegistration(null);
  const update = vi.spyOn(registration, "update").mockRejectedValueOnce(new Error("offline"));
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  render(<ServiceWorkerRegister />);
  await act(async () => { await Promise.resolve(); });
  expect(update).toHaveBeenCalledOnce();
  act(() => { window.dispatchEvent(new Event("online")); });
  await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
  expect(update).toHaveBeenCalledTimes(2);
});
