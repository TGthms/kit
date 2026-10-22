import type { OfflineState } from "./offline-status";

export type OfflineProgress = {
  status: string;
  requestId: string;
  done: number;
  total: number;
  logs?: string[];
  generation?: string;
  version?: string;
  activationRequired?: boolean;
};

function bounded<T>(promise: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => finish(() => reject(new DOMException("Canceled", "AbortError")));
    const finish = (action: () => void) => { clearTimeout(timer); signal?.removeEventListener("abort", abort); action(); };
    const timer = setTimeout(() => finish(() => reject(new Error("The operation is taking too long. Retry to continue."))), ms);
    promise.then((value) => finish(() => resolve(value)), (error) => finish(() => reject(error)));
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
  });
}

/** Prefer an already prepared release, including when a captive portal or an
 * unreliable navigator.onLine says a disconnected device is online. */
export async function offlineDownloadWorker(signal?: AbortSignal, refresh = false): Promise<{ worker: ServiceWorker; waiting: boolean }> {
  if (!("serviceWorker" in navigator)) throw new Error("Offline access is unavailable in this browser.");
  const registration = await bounded(navigator.serviceWorker.getRegistration(), 10_000, signal);
  if (!registration) throw new Error("Offline access is not ready. Reconnect and retry.");
  if (!registration.installing && (refresh || !registration.waiting) && navigator.onLine !== false) {
    try { await bounded(registration.update(), 30_000, signal); }
    catch (error) { if (!registration.waiting) throw error; }
  }
  const installing = registration.installing;
  if (installing) await new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); installing.removeEventListener("statechange", finish); signal?.removeEventListener("abort", abort); };
    const abort = () => { cleanup(); reject(new DOMException("Canceled", "AbortError")); };
    const finish = () => {
      if (installing.state !== "installed" && installing.state !== "activated" && installing.state !== "redundant") return;
      cleanup();
      if (installing.state === "redundant") reject(new Error("The update could not be prepared. Your previous downloads are safe. Reconnect and retry."));
      else resolve();
    };
    // A preserved offline collection can take much longer than a page load.
    const timer = setTimeout(() => { cleanup(); reject(new Error("The update is still preparing. Keep Kit open and retry shortly.")); }, 10 * 60_000);
    installing.addEventListener("statechange", finish);
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    finish();
  });
  const worker = registration.waiting ?? (installing?.state === "installed" ? installing : registration.active);
  if (!worker || worker.state === "redundant") throw new Error("Offline access is not ready. Reconnect and retry.");
  return { worker, waiting: worker === registration.waiting || worker.state === "installed" };
}

/** An explicit update completes when its particular worker activates. Watching
 * both state and controller covers an initially uncontrolled app and iOS event
 * timing, without treating an unrelated controller change as success. */
export function applyOfflineUpdate(worker: ServiceWorker, requestId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let accepted = false;
    const channel = new MessageChannel();
    const cleanup = () => {
      clearTimeout(timer);
      channel.port1.close();
      worker.removeEventListener("statechange", changed);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
    };
    const changed = () => {
      if (accepted && worker.state === "activated") { cleanup(); resolve(); }
      else if (worker.state === "redundant") { cleanup(); reject(new Error("A newer update replaced this one. Retry the update.")); }
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error("Could not apply the update. Close other Kit windows and retry.")); }, 30_000);
    channel.port1.onmessage = (event: MessageEvent<{ ok: boolean; error?: string; applied?: boolean }>) => {
      if (!event.data.ok) { cleanup(); reject(new Error(event.data.error || "Could not apply the update.")); }
      else { accepted = true; if (event.data.applied) { cleanup(); resolve(); } else changed(); }
    };
    worker.addEventListener("statechange", changed);
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    try { worker.postMessage({ type: "ACTIVATE_UPDATE", requestId }, [channel.port2]); changed(); }
    catch (error) { cleanup(); reject(error); }
  });
}

/** Acknowledge destructive cache changes before altering the saved plan/UI. */
export function removeOfflineDownloads(worker: ServiceWorker, selection: Record<string, unknown>): Promise<OfflineState | null> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const cleanup = () => { clearTimeout(timer); channel.port1.close(); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("Could not confirm removal. Refresh the saved status and retry.")); }, 30_000);
    channel.port1.onmessage = (event: MessageEvent<{ ok: boolean; state?: OfflineState; error?: string }>) => {
      cleanup();
      if (event.data.ok) resolve(event.data.state ?? null);
      else reject(new Error(event.data.error || "Could not remove downloads."));
    };
    try { worker.postMessage({ type: "OFFLINE_REMOVE", ...selection }, [channel.port2]); }
    catch (error) { cleanup(); reject(error); }
  });
}

/** Used by the update toast: one action prepares and applies a release. It
 * preserves the saved collection and asks the worker to include the open page. */
export async function updateOfflineApp(onProgress: (progress: OfflineProgress) => void, refresh = false): Promise<void> {
  const { worker } = await offlineDownloadWorker(undefined, refresh);
  const requestId = crypto.randomUUID();
  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => { clearTimeout(timer); navigator.serviceWorker.removeEventListener("message", message); worker.removeEventListener("statechange", changed); };
    const changed = () => { if (worker.state === "redundant") { cleanup(); reject(new Error("A newer update replaced this download. Retry to continue.")); } };
    const watchdog = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { cleanup(); reject(new Error("The update was interrupted. Open Offline access to continue.")); }, 150_000);
    };
    const message = (event: MessageEvent) => {
      const data = event.data as OfflineProgress & { type?: string };
      if (event.source !== worker || data?.type !== "OFFLINE_PROGRESS" || data.requestId !== requestId) return;
      watchdog();
      onProgress(data);
      if (data.status === "complete") { cleanup(); resolve(); }
      else if (data.status === "error" || data.status === "canceled") { cleanup(); reject(new Error(data.logs?.at(-1) || "Update failed. Retry.")); }
    };
    navigator.serviceWorker.addEventListener("message", message);
    worker.addEventListener("statechange", changed);
    watchdog();
    try { worker.postMessage({ type: "OFFLINE_DOWNLOAD", requestId, update: true }); }
    catch (error) { cleanup(); reject(error); }
  });
  await applyOfflineUpdate(worker, requestId);
}
