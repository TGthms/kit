import { afterEach, describe, expect, it, vi } from "vitest";
import { applyOfflineUpdate, offlineDownloadWorker, removeOfflineDownloads } from "./offline-worker";

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
    expect(update).not.toHaveBeenCalled();
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
    await vi.waitFor(() => expect(registration.update).not.toHaveBeenCalled());
    registration.waiting = installing as never;
    installing.state = "installed";
    installing.dispatchEvent(new Event("statechange"));
    expect(await result).toEqual({ worker: installing, waiting: true });
  });
});

describe("bounded preparation and activation", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("does not time out a legitimate installation at the former 45-second limit", async () => {
    vi.useFakeTimers();
    const installing = Object.assign(new EventTarget(), { state: "installing" });
    const { registration } = setup({ installing });
    let settled = false;
    const pending = offlineDownloadWorker().then((result) => { settled = true; return result; });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(settled).toBe(false);
    registration.waiting = installing as never;
    installing.state = "installed";
    installing.dispatchEvent(new Event("statechange"));
    expect((await pending).worker).toBe(installing);
  });

  it("cancels preparation and removes the installation listener", async () => {
    const installing = Object.assign(new EventTarget(), { state: "installing" });
    setup({ installing });
    const remove = vi.spyOn(installing, "removeEventListener");
    const controller = new AbortController();
    const pending = offlineDownloadWorker(controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await Promise.resolve(); await Promise.resolve();
    controller.abort();
    await rejected;
    expect(remove).toHaveBeenCalledWith("statechange", expect.any(Function));
  });

  it("bounds a hanging update check instead of spinning forever", async () => {
    vi.useFakeTimers();
    setup({ update: () => new Promise(() => {}) });
    const pending = expect(offlineDownloadWorker()).rejects.toThrow("taking too long");
    await vi.advanceTimersByTimeAsync(30_001);
    await pending;
  });

  function activationWorker(state = "installed") {
    let reply: MessagePort;
    const worker = Object.assign(new EventTarget(), { state, postMessage: vi.fn((_message, ports: MessagePort[]) => { reply = ports[0]; }) });
    const container = Object.assign(new EventTarget(), { controller: null });
    vi.stubGlobal("navigator", { serviceWorker: container });
    return { worker, container, acknowledge: (data: object) => reply.postMessage(data) };
  }

  it("ignores unrelated controller changes and waits for the requested worker", async () => {
    const { worker, container, acknowledge } = activationWorker();
    let settled = false;
    const pending = applyOfflineUpdate(worker as unknown as ServiceWorker, "job").then(() => { settled = true; });
    container.dispatchEvent(new Event("controllerchange"));
    expect(settled).toBe(false);
    acknowledge({ ok: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    worker.state = "activated";
    worker.dispatchEvent(new Event("statechange"));
    await pending;
    expect(settled).toBe(true);
  });

  it("requires an acknowledgment before switching an already active fallback release", async () => {
    const { worker, acknowledge } = activationWorker("activated");
    let settled = false;
    const pending = applyOfflineUpdate(worker as unknown as ServiceWorker, "job").then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    acknowledge({ ok: true, applied: true });
    await pending;
  });

  it("reports a refused activation without waiting for a timeout", async () => {
    const { worker, acknowledge } = activationWorker();
    const pending = expect(applyOfflineUpdate(worker as unknown as ServiceWorker, "job")).rejects.toThrow("Close other Kit windows");
    acknowledge({ ok: false, error: "Close other Kit windows" });
    await pending;
  });

  it("acknowledges removals and propagates storage failures", async () => {
    const worker = { postMessage: (_message: object, ports: MessagePort[]) => ports[0].postMessage({ ok: false, error: "storage unavailable" }) };
    await expect(removeOfflineDownloads(worker as ServiceWorker, { all: true })).rejects.toThrow("storage unavailable");
  });
});
it("uses the installed worker even if registration.waiting has not been exposed yet", async () => {
  const installing = Object.assign(new EventTarget(), { state: "installing" });
  setup({ installing });
  const pending = offlineDownloadWorker();
  await Promise.resolve(); await Promise.resolve();
  installing.state = "installed";
  installing.dispatchEvent(new Event("statechange"));
  expect(await pending).toEqual({ worker: installing, waiting: true });
});
