// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { checkForAppUpdate } from "./check-update";
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
function setup() {
  const registration = { waiting: null as unknown, installing: null as unknown, active: {}, update: vi.fn().mockResolvedValue(undefined) };
  const getRegistration = vi.fn().mockResolvedValue(registration);
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { getRegistration } });
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  return { registration, getRegistration };
}
it("checks the network worker script before reporting current", async () => {
  const { registration } = setup();
  await expect(checkForAppUpdate()).resolves.toBe("current");
  expect(registration.update).toHaveBeenCalledOnce();
});
it("offers an already prepared update even offline", async () => {
  const { registration } = setup();
  registration.waiting = {};
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  await expect(checkForAppUpdate()).resolves.toBe("available");
  expect(registration.update).not.toHaveBeenCalled();
});
it("distinguishes a newly discovered update from one still installing", async () => {
  const { registration } = setup();
  registration.update.mockImplementationOnce(async () => { registration.installing = {}; });
  await expect(checkForAppUpdate()).resolves.toBe("preparing");
  registration.installing = null;
  registration.update.mockImplementationOnce(async () => { registration.waiting = {}; });
  await expect(checkForAppUpdate()).resolves.toBe("available");
});
it("never reports current offline or after a failed network check", async () => {
  const { registration } = setup();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  await expect(checkForAppUpdate()).rejects.toThrow();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  registration.update.mockRejectedValueOnce(new Error("Network failed"));
  await expect(checkForAppUpdate()).rejects.toThrow("Network failed");
});
it("settles stalled checks and respects cancellation", async () => {
  vi.useFakeTimers();
  const { getRegistration } = setup();
  getRegistration.mockImplementation(() => new Promise(() => {}));
  const check = expect(checkForAppUpdate()).rejects.toThrow("timed out");
  await vi.advanceTimersByTimeAsync(30_000);
  await check;
  const controller = new AbortController();
  const canceled = expect(checkForAppUpdate(controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await canceled;
});
it("reports missing registration and unsupported service workers honestly", async () => {
  const { getRegistration } = setup();
  getRegistration.mockResolvedValueOnce(undefined);
  await expect(checkForAppUpdate()).resolves.toBe("unavailable");
  Reflect.deleteProperty(navigator, "serviceWorker");
  await expect(checkForAppUpdate()).resolves.toBe("unavailable");
});
