export const OFFER_UPDATE_EVENT = "kit:offer-update";

/** Finish a visible "preparing" state when the browser accepts or discards the
 * installer. update() can resolve before its install event finishes. */
export function observeUpdatePreparation(
  registration: ServiceWorkerRegistration,
  changed: (state: "available" | "current" | "error") => void,
): () => void {
  let installer: ServiceWorker | null = null;
  const check = () => {
    if (registration.waiting) changed("available");
    else if (installer?.state === "redundant" || (!installer && !registration.installing)) changed("error");
    else if (installer?.state === "activated") changed("current");
  };
  const found = () => {
    installer?.removeEventListener("statechange", check);
    installer = registration.installing;
    installer?.addEventListener("statechange", check);
    check();
  };
  registration.addEventListener("updatefound", found);
  const timeout = setTimeout(() => changed("error"), 10 * 60_000);
  found();
  return () => {
    clearTimeout(timeout);
    registration.removeEventListener("updatefound", found);
    installer?.removeEventListener("statechange", check);
  };
}

/** Observe an installed update without interrupting the current tool. Each
 * waiting worker is announced once; initial installation is not an update. */
export function observeWaitingWorker(
  registration: ServiceWorkerRegistration,
  offer: (worker: ServiceWorker) => void,
): () => void {
  let disposed = false;
  let installing: ServiceWorker | null = null;
  let announced: ServiceWorker | null = null;
  const check = () => {
    const waiting = registration.waiting;
    if (!disposed && registration.active && waiting && waiting !== announced) {
      announced = waiting;
      offer(waiting);
    }
  };
  const found = () => {
    installing?.removeEventListener("statechange", check);
    installing = registration.installing;
    installing?.addEventListener("statechange", check);
    check();
  };
  registration.addEventListener("updatefound", found);
  found();
  return () => {
    disposed = true;
    registration.removeEventListener("updatefound", found);
    installing?.removeEventListener("statechange", check);
  };
}
