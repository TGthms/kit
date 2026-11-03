import { APP_VERSION } from "@/lib/version";
import type { OfflineState } from "./offline-status";
import { withBasePath } from "@/lib/base-path";

type DiagnosticArea = "offline" | "navigation" | "storage";
type DiagnosticCode = "unavailable" | "recovery" | "failed";
const events: { area: DiagnosticArea; code: DiagnosticCode; at: string }[] = [];
/** Closed enums only: never retain arbitrary exception messages or stacks. */
export function recordDiagnostic(area: DiagnosticArea, code: DiagnosticCode) {
  events.push({ area, code, at: new Date().toISOString() });
  if (events.length > 20) events.shift();
}
function identifier(value: unknown) {
  return typeof value === "string" && /^[a-z0-9.\-]{1,64}$/i.test(value)
    ? value
    : null;
}
function count(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}
export function offlineDiagnostic(state: Partial<OfflineState> | null) {
  return state
    ? {
        generation: identifier(state.generation),
        version: identifier(state.version),
        verifiedAt:
          typeof state.verifiedAt === "number" &&
          Number.isFinite(state.verifiedAt) &&
          Math.abs(state.verifiedAt) <= 8.64e15
            ? new Date(state.verifiedAt).toISOString()
            : null,
        core: {
          done: count(state.core?.done),
          total: count(state.core?.total),
        },
        engines: {
          done: count(state.engines?.done),
          total: count(state.engines?.total),
        },
        toolCount:
          state.tools && typeof state.tools === "object"
            ? Object.keys(state.tools).length
            : null,
        job: state.job
          ? {
              status: [
                "running",
                "completed",
                "interrupted",
                "error",
                "canceled",
              ].includes(state.job.status)
                ? state.job.status
                : "unknown",
              done: count(state.job.done),
              total: count(state.job.total),
            }
          : null,
      }
    : null;
}
function deadline<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}
export async function collectDiagnostics() {
  let registration: ServiceWorkerRegistration | undefined;
  try {
    if (navigator.serviceWorker)
      registration =
        (await deadline(
          navigator.serviceWorker.getRegistration(withBasePath("/")),
          2000,
        )) ?? undefined;
  } catch {
    /* unsupported */
  }
  const worker = navigator.serviceWorker?.controller ?? registration?.active;
  const report = worker
    ? new Promise<Partial<OfflineState> | null>((resolve) => {
        const done = (state: Partial<OfflineState> | null) => {
          clearTimeout(timer);
          navigator.serviceWorker.removeEventListener("message", message);
          resolve(state);
        };
        const message = (event: MessageEvent) => {
          if (event.source === worker && event.data?.type === "OFFLINE_STATE")
            done(event.data.state ?? null);
        };
        const timer = setTimeout(() => done(null), 2500);
        navigator.serviceWorker.addEventListener("message", message);
        try {
          worker.postMessage({ type: "OFFLINE_STATUS" });
        } catch {
          done(null);
        }
      })
    : Promise.resolve(null);
  let storage: StorageEstimate | null = null;
  try {
    storage = await deadline(navigator.storage.estimate(), 2000);
  } catch {
    /* unsupported */
  }
  return {
    appVersion: APP_VERSION,
    capturedAt: new Date().toISOString(),
    locale: document.documentElement.lang,
    display:
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone
        ? "installed"
        : "browser",
    online: navigator.onLine,
    worker: {
      controlled: !!navigator.serviceWorker?.controller,
      active: registration?.active?.state ?? null,
      waiting: registration?.waiting?.state ?? null,
    },
    storage: storage
      ? { usage: count(storage.usage), quota: count(storage.quota) }
      : null,
    offline: offlineDiagnostic(await report),
    events: events.map((entry) => ({ ...entry })),
  };
}
