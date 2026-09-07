const KEY = "kit-recent-paths-v2";
const INSTANCE_KEY = "kit-recent-instance-v1";
const MAX_PATHS = 12;
const INSTANCE_ID =
  typeof window === "undefined" ? "server" : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

type RecentState = { paths: string[]; index: number };

function readState(): RecentState {
  if (typeof sessionStorage === "undefined") return { paths: [], index: -1 };
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return { paths: [], index: -1 };
    const value = parsed as { paths?: unknown; index?: unknown };
    const paths = Array.isArray(value.paths)
      ? value.paths.filter((item): item is string => typeof item === "string")
      : [];
    const index = typeof value.index === "number" ? Math.trunc(value.index) : -1;
    return index >= 0 && index < paths.length ? { paths, index } : { paths: [], index: -1 };
  } catch {
    return { paths: [], index: -1 };
  }
}

function writeState(state: RecentState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or full quota: back simply falls back to the fixed href.
  }
}

/**
 * Starts a new in-document navigation session. A full reload or a deep link
 * into an already-open tab must not inherit an old route stack from a prior
 * document; client-side route changes in this document still retain it.
 */
export function startRecentSession(path: string): void {
  if (!path || typeof sessionStorage === "undefined") return;
  try {
    if (sessionStorage.getItem(INSTANCE_KEY) !== INSTANCE_ID) {
      sessionStorage.removeItem(KEY);
      sessionStorage.setItem(INSTANCE_KEY, INSTANCE_ID);
    }
  } catch {
    // Private mode or full quota: recordRecentPath will safely fall back.
  }
  recordRecentPath(path);
}

/**
 * Records a client-side route transition. Forward navigation truncates any
 * stale forward entries; consecutive duplicates (reloads) are ignored.
 */
export function recordRecentPath(path: string): void {
  if (!path || typeof sessionStorage === "undefined") return;
  const state = readState();
  if (state.paths[state.index] === path) return;
  if (state.paths[state.index - 1] === path) {
    writeState({ ...state, index: state.index - 1 });
    return;
  }
  if (state.paths[state.index + 1] === path) {
    writeState({ ...state, index: state.index + 1 });
    return;
  }
  const paths = state.paths.slice(0, state.index + 1);
  paths.push(path);
  while (paths.length > MAX_PATHS) paths.shift();
  writeState({ paths, index: paths.length - 1 });
}

/** The path the user came from within this tab, or null on a fresh arrival. */
export function previousRecentPath(): string | null {
  const state = readState();
  return state.index > 0 ? state.paths[state.index - 1] ?? null : null;
}

/** Consume one recent history entry after an in-app back navigation. */
export function stepRecentBack(): string | null {
  const state = readState();
  if (state.index <= 0) return null;
  const nextIndex = state.index - 1;
  writeState({ ...state, index: nextIndex });
  return state.paths[nextIndex] ?? null;
}
