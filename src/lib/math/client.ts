import type { Parameters } from "./numeric";
export type Viewport = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};
export type MathRequest = {
  kind: "calculate" | "fraction" | "solve" | "graph" | "graphs";
  latex: string;
  angle?: "deg" | "rad";
  viewport?: Viewport;
  parameters?: Parameters;
  curves?: { id: number; latex: string; name?: string; hidden?: boolean }[];
};
export type MathValue = {
  latex: string;
  plain: string;
  decimal: string;
  approximate: boolean;
};
export type Solution = {
  kind: "linear" | "quadratic" | "none" | "identity";
  roots: MathValue[];
  steps: { key: string; latex: string; detail?: string[] }[];
};
export type Plot = {
  expression: unknown;
  definitions: Record<string, unknown>;
  parameters: (keyof Parameters)[];
  segments: [number, number][][];
  table: [number, number | null][];
};
export type MathReply<T> =
  | { ok: true; result: T }
  | { ok: false; error: string };

/** One worker per mounted tool. Hard termination guards expensive inputs even
 * if the engine's cooperative evaluation budget fails to interrupt a task. */
export class MathClient {
  private worker: Worker | null = null;
  private sequence = 0;
  private pending: {
    resolve: (reply: MathReply<unknown>) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;

  cancel() {
    if (this.pending) {
      clearTimeout(this.pending.timer);
      this.pending.resolve({ ok: false, error: "canceled" });
      this.pending = null;
      // A posted message cannot cancel synchronous evaluation. Terminate it.
      this.worker?.terminate();
      this.worker = null;
    }
  }
  dispose() {
    this.cancel();
    this.worker?.terminate();
    this.worker = null;
  }

  async run<T>(request: MathRequest): Promise<MathReply<T>> {
    this.cancel();
    try {
      this.worker ??= new Worker(
        `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/math-worker.js`,
      );
    } catch {
      return { ok: false, error: "unavailable" };
    }
    const worker = this.worker;
    const id = ++this.sequence;
    return new Promise((resolve) => {
      const finish = (reply: MathReply<unknown>) => {
        if (id !== this.sequence || !this.pending) return;
        clearTimeout(this.pending.timer);
        this.pending = null;
        resolve(reply as MathReply<T>);
      };
      this.pending = {
        resolve: finish,
        timer: setTimeout(() => {
          finish({ ok: false, error: "timeout" });
          worker.terminate();
          if (this.worker === worker) this.worker = null;
        }, 6000),
      };
      worker.onmessage = ({ data }) => {
        if (data.id === id) finish(data);
      };
      worker.onerror = () => {
        finish({ ok: false, error: "unavailable" });
        worker.terminate();
        if (this.worker === worker) this.worker = null;
      };
      try { worker.postMessage({ ...request, id }); }
      catch {
        // postMessage can fail synchronously (terminated worker/clone error).
        // Settle through the same path so graph queues never remain locked.
        finish({ ok: false, error: "unavailable" });
        worker.terminate();
        if (this.worker === worker) this.worker = null;
      }
    });
  }
}

/** Keep one engine warm during continuous pan/slider input. At most one job
 * runs and one (the newest) waits; superseded queued promises always settle. */
export class GraphClient {
  private client = new MathClient();
  private pending: {
    request: MathRequest;
    resolve: (reply: MathReply<unknown>) => void;
  } | null = null;
  private running = false;
  private disposed = false;
  run<T>(request: MathRequest): Promise<MathReply<T>> {
    if (this.disposed) return Promise.resolve({ ok: false, error: "canceled" });
    this.pending?.resolve({ ok: false, error: "canceled" });
    return new Promise((resolve) => {
      this.pending = {
        request,
        resolve: (reply) => resolve(reply as MathReply<T>),
      };
      this.pump();
    });
  }
  private pump() {
    if (this.running || this.disposed || !this.pending) return;
    const job = this.pending;
    this.pending = null;
    this.running = true;
    void this.client.run(job.request).then((reply) => {
      job.resolve(reply);
      this.running = false;
      this.pump();
    });
  }
  dispose() {
    this.disposed = true;
    this.pending?.resolve({ ok: false, error: "canceled" });
    this.pending = null;
    this.client.dispose();
  }
}
