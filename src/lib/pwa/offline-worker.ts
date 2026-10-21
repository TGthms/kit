/** Wait for an update installation; downloading through the old controller is
 * otherwise indistinguishable from successfully saving an obsolete release. */
export async function offlineDownloadWorker(): Promise<{ worker: ServiceWorker; waiting: boolean }> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) throw new Error("Offline access is not ready. Reconnect and retry.");
  if (navigator.onLine !== false) await registration.update();
  const installing = registration.installing;
  if (installing) await new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (installing.state !== "installed" && installing.state !== "redundant") return;
      clearTimeout(timer);
      installing.removeEventListener("statechange", finish);
      if (installing.state === "redundant") reject(new Error("The update could not be installed. Retry when connected."));
      else resolve();
    };
    const timer = setTimeout(() => {
      installing.removeEventListener("statechange", finish);
      reject(new Error("The update is taking too long. Reconnect and retry."));
    }, 45_000);
    installing.addEventListener("statechange", finish);
    finish();
  });
  const worker = registration.waiting ?? registration.active;
  if (!worker) throw new Error("Offline access is not ready. Reconnect and retry.");
  return { worker, waiting: worker === registration.waiting };
}

/** Explicit activation follows a complete download. Never reload an editing tab
 * merely because a worker was installed in the background. */
export function applyOfflineUpdate(worker: ServiceWorker, requestId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const cleanup = () => {
      clearTimeout(timer);
      channel.port1.close();
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
    };
    const changed = () => { cleanup(); resolve(); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("Could not apply the update. Retry when connected.")); }, 15_000);
    channel.port1.onmessage = (event: MessageEvent<{ ok: boolean; error?: string }>) => {
      if (!event.data.ok) { cleanup(); reject(new Error(event.data.error || "Could not apply the update.")); }
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    worker.postMessage({ type: "ACTIVATE_UPDATE", requestId }, [channel.port2]);
  });
}
