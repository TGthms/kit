import { readFileSync } from "node:fs";
import vm from "node:vm";
import { ComputeEngine } from "@cortex-js/compute-engine";
import { describe, expect, it } from "vitest";
import type {
  MathReply,
  MathValue,
  Plot,
  Solution,
  MathRequest,
} from "./client";
const source = readFileSync("public/math-worker.js", "utf8");
function worker() {
  let response: unknown;
  const scope = {
    onmessage: null as unknown,
    postMessage: (reply: unknown) => {
      response = reply;
    },
  };
  vm.runInNewContext(source, {
    self: scope,
    globalThis: { ComputeEngine: { ComputeEngine } },
    importScripts() {},
    console,
  });
  return <T>(request: MathRequest) => {
    (scope.onmessage as (event: unknown) => void)({
      data: { id: 1, ...request },
    });
    return response as MathReply<T>;
  };
}
const run = worker();
function success<T>(reply: MathReply<T>): T {
  expect(reply.ok, JSON.stringify(reply)).toBe(true);
  if (!reply.ok) throw Error(reply.error);
  return reply.result;
}
describe("isolated math computation", () => {
  it.each([
    ["2+3\\times4", 14],
    ["-2^2", -4],
    ["2^{3^2}", 512],
    ["\\sqrt{12}", Math.sqrt(12)],
    ["\\frac{1}{2}+\\frac{1}{3}", 5 / 6],
    ["2(3+4)", 14],
    ["\\exponentialE", Math.E],
    ["5!", 120],
    ["\\left|-4\\right|", 4],
    ["\\log(100)", 2],
  ])("evaluates %s", (latex, expected) => {
    const reply = success(run<MathValue>({ kind: "calculate", latex }));
    expect(Number(reply.decimal)).toBeCloseTo(expected, 10);
  });
  it("respects angle units without leaking them across requests", () => {
    expect(
      Number(
        success(
          run<MathValue>({
            kind: "calculate",
            latex: "\\sin(30)",
            angle: "deg",
          }),
        ).decimal,
      ),
    ).toBeCloseTo(0.5);
    expect(
      Number(
        success(
          run<MathValue>({
            kind: "calculate",
            latex: "\\sin(\\frac{\\pi}{2})",
          }),
        ).decimal,
      ),
    ).toBeCloseTo(1);
  });
  it("keeps fractions exact", () => {
    expect(
      success(
        run<MathValue>({
          kind: "fraction",
          latex: "\\frac{1}{2}+\\frac{1}{3}",
        }),
      ).latex,
    ).toBe("\\frac{5}{6}");
    expect(run({ kind: "fraction", latex: "\\sqrt{2}" }).ok).toBe(false);
    expect(
      success(run<MathValue>({ kind: "fraction", latex: "0.1/0.3" })).latex,
    ).toBe("\\frac{1}{3}");
    expect(
      success(run<MathValue>({ kind: "fraction", latex: "0.1+0.2" })).plain,
    ).toBe("3/10");
  });
  it.each([
    "\\frac{1}{0}",
    "\\sqrt{-1}",
    "x+1",
    "\\placeholder{}",
    "(".repeat(25),
    "1".repeat(513),
  ])("rejects non-real or invalid input %s", (latex) =>
    expect(run({ kind: "calculate", latex }).ok).toBe(false),
  );
  it("solves and explains a linear equation", () => {
    const result = success(
      run<Solution>({ kind: "solve", latex: "2(x+3)=10" }),
    );
    expect(result.kind).toBe("linear");
    expect(result.roots[0].decimal).toBe("2");
    expect(result.steps.map((step) => step.key)).toEqual([
      "collect",
      "isolate",
      "divide",
    ]);
  });
  it("solves and explains quadratic roots", () => {
    const result = success(
      run<Solution>({ kind: "solve", latex: "x^2-5x+6=0" }),
    );
    expect(result.kind).toBe("quadratic");
    expect(result.roots.map((r) => r.decimal).sort()).toEqual(["2", "3"]);
    expect(result.steps.at(-1)?.key).toBe("quadraticFormula");
    expect(
      success(run<Solution>({ kind: "solve", latex: "x^2=2" })).roots[0].latex,
    ).toContain("sqrt");
  });
  it("distinguishes a double root, no real root, contradiction and identity", () => {
    expect(
      success(run<Solution>({ kind: "solve", latex: "(x-1)^2=0" })).roots,
    ).toHaveLength(1);
    expect(
      success(run<Solution>({ kind: "solve", latex: "x^2+1=0" })).kind,
    ).toBe("none");
    expect(success(run<Solution>({ kind: "solve", latex: "x=x+1" })).kind).toBe(
      "none",
    );
    expect(
      success(run<Solution>({ kind: "solve", latex: "2(x+1)=2x+2" })).kind,
    ).toBe("identity");
  });
  it.each([
    "x^3=1",
    "\\frac{x}{x}=1",
    "\\frac{x^2-1}{x-1}=2",
    "\\sin(x)=0",
    "y=2",
    "x=2=3",
  ])("does not invent polynomial steps for %s", (latex) => {
    expect(run({ kind: "solve", latex }).ok).toBe(false);
  });
  it("samples several functions without dynamic code generation", () => {
    const result = success(
      run<Plot>({
        kind: "graph",
        latex: "y=\\sin(x)",
        viewport: { xMin: -4, xMax: 4, yMin: -2, yMax: 2 },
      }),
    );
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.table[4]).toEqual([0, 0]);
    expect(source).not.toMatch(/\beval\(|new Function/);
  });
  it("breaks at an asymptote between sample points", () => {
    const result = success(
      run<Plot>({
        kind: "graph",
        latex: "\\frac{1}{x-0.013}",
        viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      }),
    );
    expect(result.segments.length).toBeGreaterThanOrEqual(2);
    expect(
      result.segments.some(
        (s) => s.some(([x]) => x < 0.013) && s.some(([x]) => x > 0.013),
      ),
    ).toBe(false);
  });
});
