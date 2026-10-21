// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { ServiceWorkerRegister } from "./sw-register";

const { notify, push } = vi.hoisted(() => ({ notify: Object.assign(vi.fn(), { dismiss: vi.fn() }), push: vi.fn() }));
vi.mock("sonner", () => ({ toast: notify }));
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => en.settings[key as keyof typeof en.settings] }));
vi.mock("@/lib/i18n/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  notify.mockClear(); notify.dismiss.mockClear(); push.mockClear();
  window.history.replaceState({}, "", "/en/tools/length-converter/");
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
function workerRegistration(waiting: EventTarget | null) {
  const worker = Object.assign(new EventTarget(), { postMessage: vi.fn() });
  const registration = Object.assign(new EventTarget(), { active: worker, installing: null, waiting, update: async () => undefined });
  const container = Object.assign(new EventTarget(), { register: async () => registration, ready: Promise.resolve(registration) });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });
  return registration;
}
it("offers a persistent localized toast and takes the visitor directly to offline updates", async () => {
  workerRegistration(new EventTarget());
  render(<ServiceWorkerRegister />);
  await waitFor(() => expect(notify).toHaveBeenCalledOnce());
  expect(notify.mock.calls[0][0]).toBe(en.settings.updateAvailable);
  const options = notify.mock.calls[0][1];
  expect(options.duration).toBe(Infinity);
  expect(options.action.label).toBe(en.settings.reviewUpdate);
  options.action.onClick();
  expect(push).toHaveBeenCalledWith("/settings/offline");
  expect(notify.dismiss).toHaveBeenCalledWith("kit-update-ready");
});
it("does not duplicate the notice already shown on the offline page", async () => {
  const registration = workerRegistration(new EventTarget());
  const update = vi.spyOn(registration, "update");
  window.history.replaceState({}, "", "/en/settings/offline/");
  render(<ServiceWorkerRegister />);
  await waitFor(() => expect(update).toHaveBeenCalledOnce());
  expect(notify).not.toHaveBeenCalled();
});
