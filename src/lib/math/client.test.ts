import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MathClient } from "./client";
class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  messages: Record<string, unknown>[] = [];
  terminated = false;
  constructor(public url: string) {
    FakeWorker.instances.push(this);
  }
  postMessage(message: Record<string, unknown>) {
    this.messages.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  reply(result: unknown) {
    this.onmessage?.({
      data: { id: this.messages.at(-1)!.id, ok: true, result },
    });
  }
}
beforeEach(() => {
  vi.useFakeTimers();
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("math worker lifecycle", () => {
  it("reuses an idle worker and matches replies", async () => {
    const client = new MathClient();
    const job = client.run({ kind: "calculate", latex: "2+3" });
    const worker = FakeWorker.instances[0];
    worker.onmessage?.({ data: { id: -1, ok: true, result: "stale" } });
    worker.reply("5");
    expect(await job).toEqual({ id: 1, ok: true, result: "5" });
    const next = client.run({ kind: "calculate", latex: "5+5" });
    worker.reply("10");
    expect((await next).ok).toBe(true);
    expect(FakeWorker.instances).toHaveLength(1);
    client.dispose();
    expect(worker.terminated).toBe(true);
  });
  it("terminates a superseded calculation and settles both promises", async () => {
    const client = new MathClient();
    const previous = client.run({ kind: "calculate", latex: "1" });
    const next = client.run({ kind: "calculate", latex: "2" });
    expect(await previous).toEqual({ ok: false, error: "canceled" });
    expect(FakeWorker.instances[0].terminated).toBe(true);
    FakeWorker.instances[1].reply("2");
    expect((await next).ok).toBe(true);
    client.dispose();
  });
  it("hard-stops a stalled engine and permits a later retry", async () => {
    const client = new MathClient();
    const job = client.run({ kind: "solve", latex: "x=1" });
    await vi.advanceTimersByTimeAsync(6000);
    expect(await job).toEqual({ ok: false, error: "timeout" });
    expect(FakeWorker.instances[0].terminated).toBe(true);
    const retry = client.run({ kind: "calculate", latex: "3" });
    FakeWorker.instances[1].reply("3");
    expect((await retry).ok).toBe(true);
    client.dispose();
  });
  it("reports a missing offline engine and releases pending work on exit", async () => {
    const client = new MathClient();
    const job = client.run({ kind: "calculate", latex: "1" });
    FakeWorker.instances[0].onerror?.();
    expect(await job).toEqual({ ok: false, error: "unavailable" });
    const next = client.run({ kind: "calculate", latex: "2" });
    client.dispose();
    expect(await next).toEqual({ ok: false, error: "canceled" });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("graph job coalescing", () => {
  it("keeps the worker warm and runs only the latest queued request", async () => {
    const { GraphClient } = await import("./client");
    const client = new GraphClient();
    const first = client.run({ kind: "graphs", latex: "first" });
    const obsolete = client.run({ kind: "graphs", latex: "obsolete" });
    const latest = client.run({ kind: "graphs", latex: "latest" });
    expect(await obsolete).toEqual({ ok: false, error: "canceled" });
    expect(FakeWorker.instances).toHaveLength(1);
    const worker = FakeWorker.instances[0];
    worker.reply("first");
    expect((await first).ok).toBe(true);
    expect(worker.messages.at(-1)?.latex).toBe("latest");
    worker.reply("latest");
    expect((await latest).ok).toBe(true);
    expect(worker.terminated).toBe(false);
    client.dispose();
  });
  it("settles running and queued work when the page closes", async () => {
    const { GraphClient } = await import("./client");
    const client = new GraphClient();
    const running = client.run({ kind: "graphs", latex: "first" });
    const pending = client.run({ kind: "graphs", latex: "next" });
    client.dispose();
    expect(await pending).toEqual({ ok: false, error: "canceled" });
    expect(await running).toEqual({ ok: false, error: "canceled" });
    expect(FakeWorker.instances[0].terminated).toBe(true);
  });
});
