import { describe, expect, it } from "vitest";
import { compileNumeric, DEFAULT_PARAMETERS } from "./numeric";
const call = (name: string, arg: unknown = "x") => [
  "InvisibleOperator",
  name,
  ["Delimiter", arg],
];
describe("shared graph interpreter", () => {
  it("composes named functions and evaluates arguments before the call", () => {
    const definitions = {
      d: ["Power", "x", 2],
      g: ["Sin", "x"],
      h: ["Add", call("d"), call("g")],
    };
    expect(
      compileNumeric(call("h", 2), "rad", DEFAULT_PARAMETERS, definitions)(0),
    ).toBeCloseTo(4 + Math.sin(2));
    expect(
      compileNumeric(
        call("d", ["Multiply", 2, "x"]),
        "rad",
        DEFAULT_PARAMETERS,
        definitions,
      )(3),
    ).toBe(36);
  });
  it("uses sliders inside dependencies without leaking parameters between requests", () => {
    const node = ["Add", ["Multiply", "a", "x"], "b"];
    expect(compileNumeric(node, "rad", { a: 2, b: 3, c: 0 })(4)).toBe(11);
    expect(compileNumeric(node)(4)).toBe(5);
  });
  it("detects missing and circular dependencies", () => {
    expect(() => compileNumeric(call("d"))).toThrow("missingFunction");
    expect(() =>
      compileNumeric(call("d"), "rad", DEFAULT_PARAMETERS, {
        d: call("g"),
        g: call("d"),
      }),
    ).toThrow("circularFunction");
  });
  it("bounds branching compositions and reuses shared function values", () => {
    const names = ["d", "f", "g", "h", "j", "k", "l", "m"];
    const definitions = Object.fromEntries(
      names.map((name, i) => [
        name,
        i === names.length - 1
          ? "x"
          : [
              "Add",
              ...Array.from({ length: 8 }, (_, j) =>
                call(names[i + 1], ["Add", ["Power", "x", 2], j + 0.1]),
              ),
            ],
      ]),
    );
    const fn = compileNumeric(
      call("d"),
      "rad",
      DEFAULT_PARAMETERS,
      definitions,
    );
    expect(() => fn(0.25)).toThrow("unsupported");
    const shared = {
      g: ["Power", "x", 2],
      d: ["Add", ...Array.from({ length: 50 }, () => call("g"))],
    };
    expect(
      compileNumeric(call("d"), "rad", DEFAULT_PARAMETERS, shared)(3),
    ).toBe(450);
  });
  it("rejects arbitrary code and unbounded trees", () => {
    expect(() => compileNumeric(["constructor", "x"])).toThrow();
    expect(() => compileNumeric("globalThis")).toThrow();
    expect(() => compileNumeric(["Add", ...Array(4001).fill(1)])).toThrow();
  });
});

describe("exact decimal labels", () => {
  it.each([
    [4, "4", true],
    [1.3, "1.3", true],
    [-1.3, "-1.3", true],
    [["Rational", 1, 2], "0.5", true],
    [["Rational", 1, 3], "0.33333333333333", false],
    [["Sqrt", 2], "1.4142135623731", false],
    [{ num: "12345678901234567890" }, "12345678901235000000", false],
  ])(
    "labels %j = %s only when exact",
    async (expression, decimal, expected) => {
      const { decimalIsExact } = await import("./numeric");
      expect(decimalIsExact(expression, String(decimal))).toBe(expected);
    },
  );
});

it("detects oscillations between regular samples without drawing a false flat line", async () => {
  const { sampleNumeric } = await import("./numeric");
  const result = sampleNumeric(x => Math.sin(1000 * Math.PI * x), { xMin: -10, xMax: 10, yMin: -2, yMax: 2 });
  expect(result.undersampled).toBe(true);
});
it("keeps simple lines and separates the two sides of a pole", async () => {
  const { sampleNumeric } = await import("./numeric");
  const view = { xMin: -10, xMax: 10, yMin: -5, yMax: 5 };
  const line = sampleNumeric(x => x / 2, view);
  expect(line.undersampled).toBe(false);
  expect(line.segments).toHaveLength(1);
  const pole = sampleNumeric(x => 1 / x, view);
  for (const segment of pole.segments) expect(segment.some(([x]) => x < 0) && segment.some(([x]) => x > 0)).toBe(false);
});
