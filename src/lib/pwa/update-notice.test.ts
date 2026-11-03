import { describe, expect, it, vi } from "vitest";
import { observeWaitingWorker, observeUpdatePreparation } from "./update-notice";

class Worker extends EventTarget { state = "installing"; }
class Registration extends EventTarget {
  active: Worker | null = new Worker();
  waiting: Worker | null = null;
  installing: Worker | null = null;
}
const observe = (registration: Registration, offer: (worker: ServiceWorker) => void) => observeWaitingWorker(registration as unknown as ServiceWorkerRegistration, offer);

describe("update availability", () => {
  it("announces an already waiting release once", () => {
    const registration = new Registration();
    registration.waiting = new Worker();
    const offer = vi.fn();
    const stop = observe(registration, offer);
    registration.dispatchEvent(new Event("updatefound"));
    expect(offer).toHaveBeenCalledExactlyOnceWith(registration.waiting);
    stop();
  });
  it("waits for installation to complete, then observes later updates", () => {
    const registration = new Registration();
    const offer = vi.fn();
    const stop = observe(registration, offer);
    const first = new Worker();
    registration.installing = first;
    registration.dispatchEvent(new Event("updatefound"));
    expect(offer).not.toHaveBeenCalled();
    registration.waiting = first;
    first.state = "installed";
    first.dispatchEvent(new Event("statechange"));
    first.dispatchEvent(new Event("statechange"));
    expect(offer).toHaveBeenCalledOnce();
    const next = new Worker();
    registration.installing = next;
    registration.dispatchEvent(new Event("updatefound"));
    registration.waiting = next;
    next.dispatchEvent(new Event("statechange"));
    expect(offer).toHaveBeenCalledTimes(2);
    stop();
    registration.waiting = new Worker();
    next.dispatchEvent(new Event("statechange"));
    expect(offer).toHaveBeenCalledTimes(2);
  });
  it("does not announce the first installation as an update", () => {
    const registration = new Registration();
    registration.active = null;
    registration.waiting = new Worker();
    const offer = vi.fn();
    const stop = observe(registration, offer);
    expect(offer).not.toHaveBeenCalled();
    stop();
  });
});

describe("preparation feedback", () => {
  it("settles a failed installer and releases listeners", () => {
    const registration = new Registration();
    const worker = new Worker(); registration.installing = worker;
    const changed = vi.fn();
    const stop = observeUpdatePreparation(registration as unknown as ServiceWorkerRegistration, changed);
    expect(changed).not.toHaveBeenCalled();
    registration.installing = null; worker.state = "redundant"; worker.dispatchEvent(new Event("statechange"));
    expect(changed).toHaveBeenLastCalledWith("error");
    stop(); changed.mockClear(); worker.dispatchEvent(new Event("statechange"));
    expect(changed).not.toHaveBeenCalled();
  });
  it("announces completion and detects an installer already discarded before observation", () => {
    const registration = new Registration(); const changed = vi.fn();
    const stop = observeUpdatePreparation(registration as unknown as ServiceWorkerRegistration, changed);
    expect(changed).toHaveBeenLastCalledWith("error"); stop();
    registration.waiting = new Worker();
    const next = observeUpdatePreparation(registration as unknown as ServiceWorkerRegistration, changed);
    expect(changed).toHaveBeenLastCalledWith("available"); next();
  });
});
