export type RegexMatch = {
  index: number;
  text: string;
  groups: string[];
};

export type RegexResult =
  | { ok: true; matches: RegexMatch[]; flags: string }
  | { ok: false; error: string };

export function runRegex(pattern: string, flags: string, input: string): RegexResult {
  if (!pattern) return { ok: false, error: "Pattern is empty" };
  const cleaned = flags.replace(/[^gimsuy]/g, "");
  const unique = [...new Set(cleaned.split(""))].join("");
  const withG = unique.includes("g") ? unique : unique + "g";
  try {
    const re = new RegExp(pattern, withG);
    const matches: RegexMatch[] = [];
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(input))) {
      matches.push({
        index: m.index,
        text: m[0],
        groups: m.slice(1),
      });
      if (m[0] === "") re.lastIndex++;
      if (++guard > 10_000) break;
    }
    return { ok: true, matches, flags: withG };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function replaceRegex(
  pattern: string,
  flags: string,
  input: string,
  replacement: string
): { ok: true; text: string } | { ok: false; error: string } {
  const ran = runRegex(pattern, flags, input);
  if (!ran.ok) return ran;
  try {
    const re = new RegExp(pattern, ran.flags);
    return { ok: true, text: input.replace(re, replacement) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const MATCH_TIMEOUT_MS = 1500;

export type RegexWorkerRequest = {
  id: number;
  kind?: "match" | "replace";
  pattern?: string;
  flags?: string;
  input?: string;
  replacement?: string;
};

export type RegexWorkerReply =
  | ({ id: number } & RegexResult)
  | ({ id: number } & RegexReplaceResult);

/** One unit of worker work; REGEX_WORKER_SOURCE must behave identically. */
export function runRegexJob(request: RegexWorkerRequest): RegexWorkerReply {
  const { id } = request;
  const pattern = typeof request.pattern === "string" ? request.pattern : "";
  if (!pattern) return { id, ok: false, error: "Pattern is empty" };
  const flags = typeof request.flags === "string" ? request.flags : "";
  const input = typeof request.input === "string" ? request.input : "";
  if (request.kind === "replace") {
    const replacement = typeof request.replacement === "string" ? request.replacement : "";
    return { id, ...replaceRegex(pattern, flags, input, replacement) };
  }
  return { id, ...runRegex(pattern, flags, input) };
}

/**
 * The worker source is created from a Blob URL on purpose: a bundler-resolved
 * `new Worker(new URL("./regex-worker.ts", import.meta.url))` deadlocks the
 * Next 16 (Turbopack) production build. This string mirrors the
 * runRegex/replaceRegex semantics above; the colocated test pins the two so
 * they cannot drift. `worker-src blob:` is already allowed by the CSP.
 */
export const REGEX_WORKER_SOURCE = `
"use strict";
function runRegexJob(data) {
  if (!data || typeof data.id !== "number") return null;
  var pattern = typeof data.pattern === "string" ? data.pattern : "";
  if (!pattern) return { id: data.id, ok: false, error: "Pattern is empty" };
  var cleaned = (typeof data.flags === "string" ? data.flags : "").replace(/[^gimsuy]/g, "");
  var unique = Array.from(new Set(cleaned.split(""))).join("");
  var withG = unique.includes("g") ? unique : unique + "g";
  var input = typeof data.input === "string" ? data.input : "";
  try {
    var re = new RegExp(pattern, withG);
    var matches = [];
    var match;
    var guard = 0;
    while ((match = re.exec(input))) {
      matches.push({ index: match.index, text: match[0], groups: match.slice(1) });
      if (match[0] === "") re.lastIndex++;
      if (++guard > 10000) break;
    }
    if (data.kind === "replace") {
      var replaceWith = new RegExp(pattern, withG);
      return {
        id: data.id,
        ok: true,
        text: input.replace(replaceWith, typeof data.replacement === "string" ? data.replacement : ""),
      };
    }
    return { id: data.id, ok: true, matches: matches, flags: withG };
  } catch (error) {
    return { id: data.id, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
self.onmessage = function onMessage(event) {
  var reply = runRegexJob(event.data);
  if (reply) self.postMessage(reply);
};
`;

export type RegexReplaceResult = { ok: true; text: string } | { ok: false; error: string };

type PendingRequest = {
  deliver: (data: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
};

let worker: Worker | null = null;
let workerBlobUrl: string | null = null;
let workerBroken = false;
let nextRequestId = 1;
const pending = new Map<number, PendingRequest>();

function killWorker() {
  worker?.terminate();
  worker = null;
  if (workerBlobUrl) {
    try {
      URL.revokeObjectURL(workerBlobUrl);
    } catch {
      /* already revoked */
    }
    workerBlobUrl = null;
  }
}

function failAllPending(error: string) {
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
    entry.deliver({ ok: false, error });
  }
  pending.clear();
}

function createRegexWorker(): { worker: Worker; blobUrl: string } | null {
  if (typeof Blob === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    return null;
  }
  try {
    const blobUrl = URL.createObjectURL(new Blob([REGEX_WORKER_SOURCE], { type: "text/javascript" }));
    return { worker: new Worker(blobUrl), blobUrl };
  } catch {
    return null;
  }
}

function getWorker(): Worker | null {
  // jsdom/node tests and exotic browsers have no Worker/Blob; the
  // synchronous fallback keeps the tool working, guarded by the match cap.
  if (workerBroken || typeof Worker === "undefined") return null;
  if (worker) return worker;
  const created = createRegexWorker();
  if (!created) {
    workerBroken = true;
    return null;
  }
  created.worker.onmessage = (event: MessageEvent) => {
    const data = event.data as { id?: number } | null;
    const id = typeof data?.id === "number" ? data.id : null;
    const entry = id === null ? undefined : pending.get(id);
    if (!entry || id === null) return;
    pending.delete(id);
    clearTimeout(entry.timer);
    entry.deliver(data);
  };
  created.worker.onerror = () => {
    killWorker();
    workerBroken = true;
    failAllPending("Regex worker failed");
  };
  worker = created.worker;
  workerBlobUrl = created.blobUrl;
  return created.worker;
}

function toMatchResult(data: unknown): RegexResult {
  if (
    data &&
    typeof data === "object" &&
    (data as { ok?: unknown }).ok === true &&
    Array.isArray((data as { matches?: unknown }).matches)
  ) {
    const { matches, flags } = data as { matches: RegexMatch[]; flags: string };
    return { ok: true, matches, flags };
  }
  const error = data && typeof data === "object" ? (data as { error?: unknown }).error : null;
  return { ok: false, error: typeof error === "string" ? error : "Regex failed" };
}

function toReplaceResult(data: unknown): RegexReplaceResult {
  if (data && typeof data === "object" && (data as { ok?: unknown }).ok === true) {
    const { text } = data as { text?: unknown };
    if (typeof text === "string") return { ok: true, text };
  }
  const error = data && typeof data === "object" ? (data as { error?: unknown }).error : null;
  return { ok: false, error: typeof error === "string" ? error : "Regex failed" };
}

function runInWorker<T>(
  request: Record<string, unknown>,
  decode: (data: unknown) => T,
  fallback: () => T
): Promise<T> {
  const w = getWorker();
  if (!w) return Promise.resolve(fallback());
  return new Promise<T>((resolve) => {
    const id = nextRequestId;
    nextRequestId += 1;
    const timer = setTimeout(() => {
      pending.delete(id);
      // A runaway exec() can only be stopped by killing the worker; the next
      // request compiles a fresh one.
      killWorker();
      resolve(decode({ ok: false, error: "The pattern took too long and was stopped." }));
    }, MATCH_TIMEOUT_MS);
    pending.set(id, {
      deliver: (data) => resolve(decode(data)),
      timer,
    });
    try {
      w.postMessage({ id, ...request });
    } catch {
      pending.delete(id);
      clearTimeout(timer);
      resolve(fallback());
    }
  });
}

export function runRegexAsync(pattern: string, flags: string, input: string): Promise<RegexResult> {
  return runInWorker(
    { kind: "match", pattern, flags, input },
    toMatchResult,
    () => runRegex(pattern, flags, input)
  );
}

export function replaceRegexAsync(
  pattern: string,
  flags: string,
  input: string,
  replacement: string
): Promise<RegexReplaceResult> {
  return runInWorker(
    { kind: "replace", pattern, flags, input, replacement },
    toReplaceResult,
    () => replaceRegex(pattern, flags, input, replacement)
  );
}
