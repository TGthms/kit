// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gzipSync } from "node:zlib";

type Gate = { resolve: (value: number) => void; reject: (error: unknown) => void };

class FakeFFmpeg {
  static instances: FakeFFmpeg[] = [];
  loaded = false;
  terminated = false;
  loadCalls = 0;
  execCalls = 0;
  written: string[] = [];
  listeners = new Map<string, Set<(event: unknown) => void>>();
  private loadGate: { resolve: () => void; reject: (error: unknown) => void } | null = null;
  private execGates: Gate[] = [];

  constructor() {
    FakeFFmpeg.instances.push(this);
  }

  on(event: string, callback: (event: unknown) => void) {
    const set = this.listeners.get(event) ?? new Set();
    set.add(callback);
    this.listeners.set(event, set);
  }

  off(event: string, callback: (event: unknown) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, payload: unknown) {
    for (const callback of this.listeners.get(event) ?? []) callback(payload);
  }

  async load() {
    this.loadCalls += 1;
    await new Promise<void>((resolve, reject) => {
      this.loadGate = { resolve, reject };
    });
    this.loaded = true;
    return true;
  }

  async writeFile(name: string) {
    this.written.push(name);
  }

  async exec() {
    this.execCalls += 1;
    if (this.terminated) throw new Error("called FFmpeg.terminate()");
    return new Promise<number>((resolve, reject) => {
      this.execGates.push({ resolve, reject });
    });
  }

  async readFile() {
    return new Uint8Array([1, 2, 3]);
  }

  async deleteFile() {}

  terminate() {
    this.terminated = true;
    this.loaded = false;
    for (const gate of this.execGates.splice(0)) gate.reject(new Error("called FFmpeg.terminate()"));
    this.loadGate?.reject(new Error("called FFmpeg.terminate()"));
    this.loadGate = null;
  }

  settleLoad() {
    this.loadGate?.resolve();
    this.loadGate = null;
  }

  settleExec(code = 0) {
    for (const gate of this.execGates.splice(0)) gate.resolve(code);
  }

  get execPending() {
    return this.execGates.length > 0;
  }
}

vi.mock("@ffmpeg/ffmpeg", () => ({ FFmpeg: FakeFFmpeg }));
vi.mock("@ffmpeg/util", () => ({ toBlobURL: async () => "blob:core-js" }));

// The module keeps its singleton state at module scope, so every test gets a
// fresh import (and a fresh mock instance pool).
async function freshModule() {
  vi.resetModules();
  FakeFFmpeg.instances = [];
  return import("./ffmpeg");
}

/** Wait until an async condition holds (the loader pipeline spans several ticks). */
async function until(condition: () => boolean): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > 2_000) throw new Error("condition not met within 2s");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/** Start a run, wait for its load to begin, then let the load finish. */
async function startAndLoad(run: Promise<unknown>): Promise<FakeFFmpeg> {
  await until(() => FakeFFmpeg.instances[0]?.loadCalls === 1);
  const instance = FakeFFmpeg.instances[0];
  instance.settleLoad();
  return instance;
}

const OUTPUT = new Uint8Array([1, 2, 3]);

beforeEach(() => {
  // The loader fetches the gzipped WASM core from the same origin and
  // decompresses it; serve a small valid gzip body instead of the network.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(gzipSync(new Uint8Array([0x01, 0x02, 0x03]))))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runFFmpeg lifecycle", () => {
  it("loads, transcodes, and returns the output bytes", async () => {
    const { runFFmpeg } = await freshModule();
    const run = runFFmpeg("in.wav", new Uint8Array([0]), "out.mp3", ["-i", "in.wav"]);
    const instance = await startAndLoad(run);
    await until(() => instance.execPending);
    instance.settleExec(0);
    await expect(run).resolves.toEqual(OUTPUT);
    expect(FakeFFmpeg.instances).toHaveLength(1);
  });

  it("reports progress events from the instance", async () => {
    const { runFFmpeg } = await freshModule();
    const ratios: number[] = [];
    const run = runFFmpeg("in.wav", new Uint8Array([0]), "out.mp3", ["x"], (ratio) => ratios.push(ratio));
    const instance = await startAndLoad(run);
    await until(() => instance.execPending);
    instance.emit("progress", { progress: 0.5 });
    instance.settleExec(0);
    await run;
    expect(ratios).toContain(0.5);
  });

  it("surfaces a cancel during exec as AbortError and recovers on a fresh instance", async () => {
    const { runFFmpeg } = await freshModule();
    const controller = new AbortController();
    const run = runFFmpeg("in.wav", new Uint8Array([0]), "out.mp3", ["x"], undefined, controller.signal);
    const dead = await startAndLoad(run);
    await until(() => dead.execPending);

    controller.abort();
    await expect(run).rejects.toMatchObject({ name: "AbortError" });
    expect(dead.terminated).toBe(true);

    // The next run must not reuse the terminated instance.
    const second = runFFmpeg("in.wav", new Uint8Array([0]), "out.mp3", ["x"]);
    await until(() => FakeFFmpeg.instances.length === 2 && FakeFFmpeg.instances[1].loadCalls === 1);
    const fresh = FakeFFmpeg.instances[1];
    fresh.settleLoad();
    await until(() => fresh.execPending);
    fresh.settleExec(0);
    await expect(second).resolves.toEqual(OUTPUT);
  });

  it("surfaces a cancel during load as AbortError and leaves no half-loaded instance", async () => {
    const { runFFmpeg } = await freshModule();
    const controller = new AbortController();
    const run = runFFmpeg("in.wav", new Uint8Array([0]), "out.mp3", ["x"], undefined, controller.signal);
    await until(() => FakeFFmpeg.instances[0]?.loadCalls === 1);

    controller.abort();
    await expect(run).rejects.toMatchObject({ name: "AbortError" });
    expect(FakeFFmpeg.instances[0].terminated).toBe(true);

    const second = runFFmpeg("in.wav", new Uint8Array([0]), "out.mp3", ["x"]);
    await until(() => FakeFFmpeg.instances.length === 2 && FakeFFmpeg.instances[1].loadCalls === 1);
    const fresh = FakeFFmpeg.instances[1];
    fresh.settleLoad();
    await until(() => fresh.execPending);
    fresh.settleExec(0);
    await expect(second).resolves.toEqual(OUTPUT);
  });

  it("serializes concurrent runs through the exec lock", async () => {
    const { runFFmpeg } = await freshModule();
    const first = runFFmpeg("a.wav", new Uint8Array([0]), "a.mp3", ["x"]);
    const second = runFFmpeg("b.wav", new Uint8Array([0]), "b.mp3", ["x"]);
    const instance = await startAndLoad(first);
    await until(() => instance.execPending);
    // The second run must not touch the filesystem while the first holds the slot.
    expect(instance.execCalls).toBe(1);

    instance.settleExec(0);
    await expect(first).resolves.toEqual(OUTPUT);
    await until(() => instance.execCalls === 2);
    expect(instance.written).toContain("b.wav");
    instance.settleExec(0);
    await expect(second).resolves.toEqual(OUTPUT);
  });

  it("a queued run's cancel does not kill the run holding the exec slot", async () => {
    const { runFFmpeg } = await freshModule();
    const firstController = new AbortController();
    const secondController = new AbortController();
    const first = runFFmpeg("a.wav", new Uint8Array([0]), "a.mp3", ["x"], undefined, firstController.signal);
    const second = runFFmpeg("b.wav", new Uint8Array([0]), "b.mp3", ["x"], undefined, secondController.signal);
    const instance = await startAndLoad(first);
    await until(() => instance.execPending);
    expect(instance.written).toEqual(["a.wav"]);

    // Aborting the queued run must leave the owner's exec untouched, and the
    // queued run must bail out without ever writing its own input.
    secondController.abort();
    expect(instance.terminated).toBe(false);
    expect(instance.written).toEqual(["a.wav"]);

    instance.settleExec(0);
    await expect(first).resolves.toEqual(OUTPUT);
    await expect(second).rejects.toMatchObject({ name: "AbortError" });
  });

  it("retries once on a dead instance when the run was not cancelled", async () => {
    const { runFFmpeg, cancelFFmpeg } = await freshModule();
    const run = runFFmpeg("in.wav", new Uint8Array([0]), "out.mp3", ["x"]);
    await until(() => FakeFFmpeg.instances[0]?.loadCalls === 1);
    const dead = FakeFFmpeg.instances[0];
    dead.settleLoad();
    await until(() => dead.execPending);

    // Terminate without aborting the run: exec rejects as a dead-instance error.
    cancelFFmpeg();
    await until(() => FakeFFmpeg.instances.length === 2 && FakeFFmpeg.instances[1].loadCalls === 1);
    const fresh = FakeFFmpeg.instances[1];
    fresh.settleLoad();
    await until(() => fresh.execPending);
    fresh.settleExec(0);
    await expect(run).resolves.toEqual(OUTPUT);
  });
});
