import { afterEach, describe, expect, it, vi } from "vitest";
import { REGEX_WORKER_SOURCE, replaceRegexAsync, runRegex, runRegexAsync } from "./regex";

describe("empty Unicode matches", () => {
  it.each(["gu", "guy"])("advances by code point with %s", (flags) => {
    const result = runRegex("(?:)", flags, "a😀b");
    expect(result.ok && result.matches.map((match) => match.index)).toEqual([0, 1, 3, 4]);
    const frame = { onmessage: (event: { data: unknown }) => { void event; }, postMessage: (reply: typeof result) => {
      expect(reply.ok && reply.matches.map((match) => match.index)).toEqual([0, 1, 3, 4]);
    } };
    new Function("self", REGEX_WORKER_SOURCE)(frame);
    frame.onmessage({ data: { id: 1, pattern: "(?:)", flags, input: "a😀b" } });
  });

  it("still advances by UTF-16 code unit without /u", () => {
    const result = runRegex("(?:)", "g", "😀");
    expect(result.ok && result.matches.map((match) => match.index)).toEqual([0, 1, 2]);
  });
});

describe("main-thread fallback", () => {
  it("reports worker unavailability instead of evaluating on the UI thread", async () => {
    const result = await runRegexAsync("a+", "g", "aaa b aa");
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/background worker/);
  });

  it("refuses a pattern that could backtrack without bound", async () => {
    const result = await runRegexAsync("(a+)+$", "g", `${"a".repeat(40)}!`);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/background worker/i);
  });

  it("refuses the same shape for replacement", async () => {
    const result = await replaceRegexAsync("(a+)+$", "g", `${"a".repeat(40)}!`, "x");
    expect(result.ok).toBe(false);
  });

  it("keeps the synchronous path available for callers that want it", () => {
    expect(runRegex("a+", "g", "aaa").ok).toBe(true);
  });
});

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage() {}
  terminate = vi.fn();
  constructor() { FakeWorker.instances.push(this); }
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("settles every queued job when a runaway pattern kills their worker and permits retry", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("Worker", FakeWorker);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:regex");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const first = runRegexAsync("a+", "g", "aaa");
  const second = runRegexAsync("b+", "g", "bbb");
  await vi.advanceTimersByTimeAsync(1500);
  expect((await first).ok).toBe(false);
  expect((await second).ok).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  const retry = runRegexAsync("c+", "g", "ccc");
  expect(FakeWorker.instances).toHaveLength(2);
  FakeWorker.instances[1].onerror?.();
  expect((await retry).ok).toBe(false);
});

it("releases its blob when worker construction is blocked and rejects patterns heuristics miss", async () => {
  vi.stubGlobal("Worker", class { constructor() { throw new Error("Blocked"); } });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:blocked");
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const reply = await runRegexAsync("(a|aa)+$", "g", "a".repeat(100) + "!");
  expect(reply.ok).toBe(false);
  expect(revoke).toHaveBeenCalledWith("blob:blocked");
});
