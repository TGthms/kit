import type { Locale } from "@/lib/i18n/config";
import type { ToolId } from "@/lib/tools/registry";
import { toolPathSegment } from "@/lib/navigation/routes";

/** The stored key for what a visitor asked to keep offline. */
export const OFFLINE_PLAN_KEY = "kit-offline-plan";

export type OfflineCount = { done: number; total: number };
export type OfflineLocaleState = OfflineCount & { ready: boolean };

/**
 * What the worker reports holding. Counted from the cache keys, so it describes
 * what is really on the device rather than what was requested.
 */
export type OfflineState = {
  /** Identifies the build whose cache holds the content. */
  generation: string;
  core: OfflineCount;
  engines: OfflineCount;
  locales: Record<string, OfflineLocaleState>;
  /** How many languages hold each tool, keyed by public route segment. */
  tools: Record<string, number>;
  readyLocales: number;
};

/**
 * What was last asked for, and which release it was asked for. Kept on the
 * device rather than inside the cache, because a new release replaces the cache
 * and would take the record with it — which is exactly when it becomes useful.
 */
export type OfflinePlan = {
  version: string;
  generation: string;
  locales: Locale[];
  tools: ToolId[];
  engines: boolean;
  at: string;
};

/**
 * `none` — nothing to report.
 * `saved` — what is on the device belongs to the release that is running.
 * `stale` — saved content is from an earlier release and should be fetched again.
 * `cleared` — this release replaced saved content, so there is none left.
 */
export type PlanStatus = "none" | "saved" | "stale" | "cleared";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readRaw(): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(OFFLINE_PLAN_KEY);
  } catch {
    return null;
  }
}

export function parsePlan(raw: string | null): OfflinePlan | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OfflinePlan>;
    if (typeof parsed.version !== "string" || !isStringArray(parsed.locales) || !isStringArray(parsed.tools)) {
      return null;
    }
    return {
      version: parsed.version,
      generation: typeof parsed.generation === "string" ? parsed.generation : "",
      locales: parsed.locales as Locale[],
      tools: parsed.tools as ToolId[],
      engines: Boolean(parsed.engines),
      at: typeof parsed.at === "string" ? parsed.at : "",
    };
  } catch {
    return null;
  }
}

/*
 * The record is read straight out of storage rather than copied into component
 * state, so a component always sees what is really stored and nothing has to be
 * synchronized on mount. The parsed value is cached against the raw text, which
 * keeps the snapshot stable between renders — a fresh object each time would
 * make React re-render forever.
 */
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedPlan: OfflinePlan | null = null;

export function getPlanSnapshot(): OfflinePlan | null {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPlan = parsePlan(raw);
  }
  return cachedPlan;
}

/** Nothing is stored on the server, so the first paint never claims a record. */
export function getPlanServerSnapshot(): OfflinePlan | null {
  return null;
}

export function subscribePlan(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function savePlan(plan: OfflinePlan): void {
  try {
    window.localStorage.setItem(OFFLINE_PLAN_KEY, JSON.stringify(plan));
  } catch {
    /* private mode, or storage full: the downloads still work */
  }
  listeners.forEach((listener) => listener());
}

/**
 * Forget the record. Used when the visitor removes what they downloaded: they
 * have said they no longer want it, and without this the next release would ask
 * them to fetch it again.
 */
export function clearPlan(): void {
  try {
    window.localStorage.removeItem(OFFLINE_PLAN_KEY);
  } catch {
    /* nothing to clear */
  }
  listeners.forEach((listener) => listener());
}

/**
 * Whether what is on the device belongs to the release that is running.
 *
 * A record with nothing stored behind it is only worth mentioning when the
 * cache has moved on, which means a new release dropped it. Content missing for
 * any other reason — the visitor removed it — is not reported at all.
 */
export function planStatus(plan: OfflinePlan | null, state: OfflineState | null, version: string): PlanStatus {
  if (!plan || !state) return "none";
  const generationMoved = Boolean(plan.generation && state.generation && plan.generation !== state.generation);
  if (state.readyLocales === 0) return generationMoved ? "cleared" : "none";
  const sameVersion = plan.version === version;
  const sameGeneration = !plan.generation || !state.generation || plan.generation === state.generation;
  return sameVersion && sameGeneration ? "saved" : "stale";
}

/**
 * Whether a tool can be opened offline.
 *
 * A language is all-or-nothing: its pages and their navigation payloads are
 * saved together or not at all, so a tool counts as available only when every
 * fully saved language holds it.
 */
export function toolSaved(state: OfflineState | null, toolId: ToolId): boolean {
  if (!state || state.readyLocales === 0) return false;
  return (state.tools[toolPathSegment(toolId)] ?? 0) >= state.readyLocales;
}

/** How many languages hold this tool's page, for the detail line. */
export function toolSavedCount(state: OfflineState | null, toolId: ToolId): number {
  return state?.tools[toolPathSegment(toolId)] ?? 0;
}

export function localeState(state: OfflineState | null, locale: string): OfflineLocaleState | null {
  return state?.locales[locale] ?? null;
}
