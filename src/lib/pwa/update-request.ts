/** Share a native update job across shell, Settings and offline-manager callers.
 * A live installer already owns staging; another update check adds no useful
 * work and can compete with recovery after an interrupted installation. */
const requests = new Map<string | ServiceWorkerRegistration, Promise<void>>();
export function hasLiveInstaller(
  registration: ServiceWorkerRegistration,
): boolean {
  return (
    !!registration.installing && registration.installing.state !== "redundant"
  );
}
export function requestWorkerUpdate(
  registration: ServiceWorkerRegistration,
): Promise<void> {
  if (hasLiveInstaller(registration)) return Promise.resolve();
  const key = registration.scope || registration;
  const current = requests.get(key);
  if (current) return current;
  const job = Promise.resolve()
    .then(() => registration.update())
    .then(() => undefined);
  requests.set(key, job);
  const cleanup = () => {
    if (requests.get(key) === job) requests.delete(key);
  };
  void job.then(cleanup, cleanup);
  return job;
}
