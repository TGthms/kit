import { readFileSync } from "node:fs";
import vm from "node:vm";
import * as KitMathGraph from "./numeric";
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
    globalThis: { ComputeEngine: { ComputeEngine }, KitMathGraph },
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
  it("distinguishes exact results from rounded decimal approximations", () => {
    for (const latex of ["4", "1.3", "2+2", "\\sqrt{4}", "\\frac{1}{2}"])
      expect(
        success(run<MathValue>({ kind: "calculate", latex })).approximate,
        latex,
      ).toBe(false);
    for (const latex of ["\\frac{1}{3}", "\\sqrt{2}", "\\pi"])
      expect(
        success(run<MathValue>({ kind: "calculate", latex })).approximate,
        latex,
      ).toBe(true);
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
  it("plots eight named functions and resolves hidden dependencies", () => {
    const curves = [
      { id: 0, name: "d", latex: "x^2", hidden: true },
      { id: 1, name: "g", latex: "2x" },
      { id: 2, name: "h", latex: "h(x)=d(x)+g(x)" },
      ...["f", "p", "q", "r", "s"].map((name, i) => ({
        id: i + 3,
        name,
        latex: `${i + 1}x`,
      })),
    ];
    const result = success(
      run<Array<{ id: number; plot?: Plot; error?: string }>>({
        kind: "graphs",
        latex: "",
        curves,
        viewport: { xMin: -4, xMax: 4, yMin: -10, yMax: 20 },
      }),
    );
    expect(result).toHaveLength(8);
    expect(result[0].plot).toBeUndefined();
    expect(result[2].error).toBeUndefined();
    expect(result[2].plot?.table[6]).toEqual([2, 8]);
  });
  it("reports duplicate names, missing definitions and loops per expression", () => {
    const viewport = { xMin: -4, xMax: 4, yMin: -4, yMax: 4 };
    const check = (curves: { id: number; name: string; latex: string }[]) =>
      success(
        run<Array<{ error?: string }>>({
          kind: "graphs",
          latex: "",
          curves,
          viewport,
        }),
      );
    expect(check([{ id: 0, name: "f", latex: "g(x)" }])[0].error).toBe(
      "missingFunction",
    );
    expect(
      check([
        { id: 0, name: "f", latex: "g(x)" },
        { id: 1, name: "g", latex: "f(x)" },
      ]).map((r) => r.error),
    ).toEqual(["circularFunction", "circularFunction"]);
    expect(
      check([
        { id: 0, name: "f", latex: "x" },
        { id: 1, name: "f", latex: "x^2" },
      ]).every((r) => r.error === "duplicateFunction"),
    ).toBe(true);
  });
  it("updates slider parameters and degree mode in composed functions", () => {
    const result = success(
      run<Array<{ plot: Plot }>>({
        kind: "graphs",
        latex: "",
        curves: [
          { id: 0, name: "d", latex: "a\\sin(x)+c" },
          { id: 1, name: "h", latex: "d(x)+b" },
        ],
        parameters: { a: 2, b: 3, c: 4 },
        angle: "deg",
        viewport: { xMin: 0, xMax: 180, yMin: -10, yMax: 10 },
      }),
    );
    expect(result[1].plot.table[4][1]).toBeCloseTo(9);
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
