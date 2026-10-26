export const OFFER_UPDATE_EVENT = "kit:offer-update";

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
