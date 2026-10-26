import { withBasePath } from "@/lib/base-path";

export type UpdateCheck = "current" | "available" | "preparing" | "unavailable";

/** Check the browser's actual worker registration, never a cached version
 * string. Checking does not activate anything or interrupt an open tool. */
export function checkForAppUpdate(signal?: AbortSignal): Promise<UpdateCheck> {
  if (!("serviceWorker" in navigator)) return Promise.resolve("unavailable");
  return new Promise((resolve, reject) => {
    const finish = (action: () => void) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      action();
    };
    const abort = () => finish(() => reject(new DOMException("Canceled", "AbortError")));
    const timer = setTimeout(() => finish(() => reject(new Error("Update check timed out"))), 30_000);
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    void (async (): Promise<UpdateCheck> => {
      const registration = await navigator.serviceWorker.getRegistration(withBasePath("/"));
      signal?.throwIfAborted();
      if (!registration) return "unavailable";
      // A fully staged release is still useful without a connection.
      if (registration.waiting) return "available";
      if (registration.installing) return "preparing";
      if (navigator.onLine === false) throw new Error("Offline");
      try { await registration.update(); }
      catch (error) { if (!registration.waiting) throw error; }
      signal?.throwIfAborted();
      if (registration.waiting) return "available";
      if (registration.installing || !registration.active) return "preparing";
      return "current";
    })().then((result) => finish(() => resolve(result)), (error) => finish(() => reject(error)));
  });
}
