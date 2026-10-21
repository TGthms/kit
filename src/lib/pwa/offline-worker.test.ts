import { afterEach, describe, expect, it, vi } from "vitest";
import { offlineDownloadWorker } from "./offline-worker";

afterEach(() => { vi.unstubAllGlobals(); });
function setup({ waiting = null, online = true, update = vi.fn(async () => undefined), installing = null }: {
  waiting?: object | null; online?: boolean; update?: () => Promise<void>; installing?: EventTarget & { state: string } | null;
} = {}) {
  const active = { postMessage() {} };
  const registration = { active, waiting, installing, update };
  vi.stubGlobal("navigator", { onLine: online, serviceWorker: { getRegistration: async () => registration } });
  return { registration, active, update };
}
describe("choosing the offline release", () => {
  it("uses the waiting worker rather than the old controller", async () => {
    const waiting = { postMessage() {} };
    const { update } = setup({ waiting });
    expect(await offlineDownloadWorker()).toEqual({ worker: waiting, waiting: true });
    expect(update).toHaveBeenCalledOnce();
  });
  it("never silently falls back to the old version when the online update check fails", async () => {
    setup({ update: async () => { throw new Error("update failed"); } });
    await expect(offlineDownloadWorker()).rejects.toThrow("update failed");
  });
  it("can still use the active release while explicitly offline", async () => {
    const { active, update } = setup({ online: false });
    expect(await offlineDownloadWorker()).toEqual({ worker: active, waiting: false });
    expect(update).not.toHaveBeenCalled();
  });
  it("waits for an installing release instead of sending downloads to the old one", async () => {
    const installing = Object.assign(new EventTarget(), { state: "installing" });
    const { registration } = setup({ installing });
    const result = offlineDownloadWorker();
    await vi.waitFor(() => expect(registration.update).toHaveBeenCalledOnce());
    registration.waiting = installing as never;
    installing.state = "installed";
    installing.dispatchEvent(new Event("statechange"));
    expect(await result).toEqual({ worker: installing, waiting: true });
  });
});
