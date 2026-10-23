/* All computation stays in an isolated, replaceable worker. Local UMD build
 * avoids dynamic code generation (and works with Kit's existing CSP). */
importScripts("./vendor/math/compute-engine.js");
const engine = new globalThis.ComputeEngine.ComputeEngine({ precision: 50 });

function invalid(code = "invalid") {
  throw new Error(code);
}
function parse(latex) {
  if (typeof latex !== "string" || !latex.trim() || latex.length > 512)
    invalid();
  let depth = 0;
  for (const char of latex) {
    if (char === "{" || char === "(") depth++;
    if (char === "}" || char === ")") depth--;
    if (depth > 24 || depth < 0) invalid();
  }
  const expression = engine.parse(latex, { canonical: false });
  if (!expression.isValid) invalid();
  return expression;
}
function real(expression) {
  const value = expression.N().valueOf();
  if (typeof value !== "number" || !Number.isFinite(value)) invalid("domain");
  return Object.is(value, -0) ? 0 : value;
}
function display(expression) {
  const exact = expression.evaluate();
  const decimal = real(exact);
  return {
    latex: exact.latex,
    plain: exact.toString(),
    decimal: Number(decimal.toPrecision(14)).toString(),
  };
}

// Treat terminating decimal literals as exact base-ten fractions in the
// fraction tool, before any arithmetic can round a recurring quotient.
function rationalize(node) {
  if (Array.isArray(node))
    return node.map((value, i) => (i ? rationalize(value) : value));
  const raw =
    typeof node === "number"
      ? String(node)
      : node && typeof node === "object" && "num" in node
        ? String(node.num)
        : null;
  if (!raw || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw))
    return node;
  const [mantissa, exponent = "0"] = raw.toLowerCase().split("e");
  const places = (mantissa.split(".")[1]?.length || 0) - Number(exponent);
  if (Math.abs(places) > 1000) invalid();
  const digits = BigInt(mantissa.replace(".", ""));
  return places <= 0
    ? { num: (digits * 10n ** BigInt(-places)).toString() }
    : [
        "Rational",
        { num: digits.toString() },
        { num: (10n ** BigInt(places)).toString() },
      ];
}

// An explicit whitelist turns parsed MathJSON into small numeric closures.
// No eval/Function, assignments, loops, arbitrary JS, or engine calls per pixel.
function numeric(node, angle = "rad", level = 0) {
  if (level > 40) invalid();
  if (typeof node === "number") return () => node;
  if (
    node &&
    typeof node === "object" &&
    !Array.isArray(node) &&
    "num" in node
  ) {
    const n = Number(node.num);
    if (!Number.isFinite(n)) invalid();
    return () => n;
  }
  if (node === "x") return (x) => x;
  if (node === "Pi") return () => Math.PI;
  if (node === "ExponentialE") return () => Math.E;
  if (!Array.isArray(node)) invalid("unsupported");
  const [op, ...args] = node;
  const f = args.map((arg) => numeric(arg, angle, level + 1));
  const radians = angle === "deg" ? Math.PI / 180 : 1;
  const unary = {
    Negate: (x) => -x,
    Sqrt: Math.sqrt,
    Abs: Math.abs,
    Exp: Math.exp,
    Ln: Math.log,
    Log: Math.log10,
    Floor: Math.floor,
    Ceil: Math.ceil,
    Sin: (x) => Math.sin(x * radians),
    Cos: (x) => Math.cos(x * radians),
    Tan: (x) => Math.tan(x * radians),
    Arcsin: (x) => Math.asin(x) / radians,
    Arccos: (x) => Math.acos(x) / radians,
    Arctan: (x) => Math.atan(x) / radians,
    Sinh: Math.sinh,
    Cosh: Math.cosh,
    Tanh: Math.tanh,
    Square: (x) => x * x,
  };
  if (Object.hasOwn(unary, op) && f.length === 1)
    return (x) => unary[op](f[0](x));
  if (op === "Delimiter" && f.length === 1) return f[0];
  if (op === "Add" && f.length)
    return (x) => f.reduce((sum, a) => sum + a(x), 0);
  if ((op === "Multiply" || op === "InvisibleOperator") && f.length)
    return (x) => f.reduce((product, a) => product * a(x), 1);
  if (f.length === 2) {
    if (op === "Subtract") return (x) => f[0](x) - f[1](x);
    if (op === "Divide" || op === "Rational") return (x) => f[0](x) / f[1](x);
    if (op === "Power") return (x) => f[0](x) ** f[1](x);
    if (op === "Root")
      return (x) => {
        const v = f[0](x),
          n = f[1](x);
        return v < 0 && Number.isInteger(n) && n % 2
          ? -((-v) ** (1 / n))
          : v ** (1 / n);
      };
    if (op === "Log") return (x) => Math.log(f[0](x)) / Math.log(f[1](x));
  }
  invalid("unsupported");
}

// Validate BEFORE canonicalization: cancellation must never silently turn
// x/x = 1 or (x²-1)/(x-1) = 2 into an unrestricted polynomial equation.
function polynomial(node, level = 0) {
  if (level > 40) invalid();
  if (
    node === "x" ||
    typeof node === "number" ||
    node === "Pi" ||
    node === "ExponentialE"
  )
    return;
  if (node && typeof node === "object" && !Array.isArray(node) && "num" in node)
    return;
  if (!Array.isArray(node)) invalid("polynomialOnly");
  const [op, ...args] = node;
  if (
    [
      "Add",
      "Subtract",
      "Multiply",
      "InvisibleOperator",
      "Negate",
      "Delimiter",
    ].includes(op)
  ) {
    args.forEach((arg) => polynomial(arg, level + 1));
    return;
  }
  // Constant radical/fraction coefficients are fine; denominators and
  // exponents depending on x are not.
  if (["Divide", "Rational"].includes(op) && args.length === 2) {
    polynomial(args[0], level + 1);
    const denominator = engine.box(args[1]);
    if (denominator.unknowns.length || real(denominator) === 0)
      invalid("polynomialOnly");
    return;
  }
  if (
    op === "Power" &&
    args.length === 2 &&
    Number.isInteger(args[1]) &&
    args[1] >= 0 &&
    args[1] <= 2
  ) {
    polynomial(args[0], level + 1);
    return;
  }
  const constant = engine.box(node);
  if (constant.unknowns.length) invalid("polynomialOnly");
  real(constant);
}
function solve(expression) {
  const json = expression.json;
  const sides =
    Array.isArray(json) && json[0] === "Equal" ? json.slice(1) : [json, 0];
  if (sides.length !== 2) invalid("polynomialOnly");
  sides.forEach((side) => polynomial(side));
  const difference = engine.box(["Subtract", ...sides]).simplify();
  const coefficients = difference.polynomialCoefficients("x");
  if (!coefficients || coefficients.length > 3) invalid("polynomialOnly");
  const values = coefficients.map(real);
  if (values.length === 1)
    return {
      kind: values[0] === 0 ? "identity" : "none",
      roots: [],
      steps: [],
    };
  if (values.length === 2) {
    const [b, c] = coefficients;
    const root = engine.box(["Divide", ["Negate", c.json], b.json]);
    return {
      kind: "linear",
      roots: [display(root)],
      steps: [
        { key: "collect", latex: `${difference.latex}=0` },
        {
          key: "isolate",
          latex: `${b.latex}x=${engine.box(["Negate", c.json]).evaluate().latex}`,
        },
        {
          key: "divide",
          latex: `x=\\frac{${engine.box(["Negate", c.json]).evaluate().latex}}{${b.latex}}=${root.evaluate().latex}`,
        },
      ],
    };
  }
  const [a, b, c] = coefficients;
  const discriminant = engine
    .box(["Subtract", ["Square", b.json], ["Multiply", 4, a.json, c.json]])
    .evaluate();
  const d = real(discriminant);
  const steps = [
    { key: "collect", latex: `${difference.latex}=0` },
    {
      key: "coefficients",
      latex: `a=${a.latex},\\quad b=${b.latex},\\quad c=${c.latex}`,
    },
    {
      key: "discriminant",
      latex: `\\Delta=b^2-4ac=(${b.latex})^2-4(${a.latex})(${c.latex})=${discriminant.latex}`,
    },
  ];
  if (d < 0)
    return {
      kind: "none",
      roots: [],
      steps: [...steps, { key: "negativeDiscriminant", latex: "\\Delta<0" }],
    };
  const roots = [1, -1]
    .slice(0, d === 0 ? 1 : 2)
    .map((sign) =>
      display(
        engine.box([
          "Divide",
          [
            "Add",
            ["Negate", b.json],
            ["Multiply", sign, ["Sqrt", discriminant.json]],
          ],
          ["Multiply", 2, a.json],
        ]),
      ),
    );
  return {
    kind: "quadratic",
    roots,
    steps: [
      ...steps,
      {
        key: "quadraticFormula",
        latex: "x=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}",
        detail: [
          `x=\\frac{-(${b.latex})\\pm\\sqrt{${discriminant.latex}}}{2(${a.latex})}`,
          ...roots.map((root, i) => `x_{${i + 1}}=${root.latex}`),
        ],
      },
    ],
  };
}

function graph(latex, viewport, angle) {
  const expression = parse(latex);
  const json = expression.json;
  const body =
    Array.isArray(json) && json[0] === "Equal" && json[1] === "y"
      ? json[2]
      : json;
  const f = numeric(body, angle);
  const { xMin, xMax, yMin, yMax } = viewport;
  if (
    ![xMin, xMax, yMin, yMax].every(Number.isFinite) ||
    xMax <= xMin ||
    yMax <= yMin
  )
    invalid();
  const height = yMax - yMin;
  const segments = [];
  let current = [];
  for (let i = 0; i <= 1000; i++) {
    const x = xMin + ((xMax - xMin) * i) / 1000;
    const y = f(x);
    const previous = current.at(-1);
    const middle = previous ? f((previous[0] + x) / 2) : y;
    // Break at poles and jump discontinuities rather than drawing a vertical
    // connector that looks like part of the function.
    if (
      !Number.isFinite(y) ||
      Math.abs(y - (yMin + yMax) / 2) > height * 4 ||
      (previous &&
        (!Number.isFinite(middle) ||
          Math.abs(y - previous[1]) > height / 2 ||
          Math.abs(middle - (y + previous[1]) / 2) > height / 8))
    ) {
      if (current.length > 1) segments.push(current);
      current = [];
      continue;
    }
    current.push([x, y]);
  }
  if (current.length > 1) segments.push(current);
  const table = Array.from({ length: 9 }, (_, i) => {
    const x = xMin + ((xMax - xMin) * i) / 8;
    const y = f(x);
    return [x, Number.isFinite(y) ? y : null];
  });
  return { segments, table };
}

self.onmessage = ({ data }) => {
  const { id, kind, latex, angle, viewport } = data;
  try {
    engine.angularUnit = angle === "deg" ? "deg" : "rad";
    const result = engine.withTimeLimit(1200, () => {
      if (kind === "graphs") {
        if (!Array.isArray(data.curves) || data.curves.length > 3) invalid();
        return data.curves.map((curve) => {
          try {
            return {
              ...curve,
              plot: curve.latex.trim()
                ? graph(curve.latex, viewport, angle)
                : undefined,
            };
          } catch (error) {
            return {
              ...curve,
              error: ["invalid", "unsupported"].includes(error.message)
                ? error.message
                : "invalid",
            };
          }
        });
      }
      if (kind === "graph") return graph(latex, viewport, angle);
      const parsed = parse(latex);
      const expression =
        kind === "fraction" ? engine.box(rationalize(parsed.json)) : parsed;
      if (kind === "solve") return solve(expression);
      if (expression.unknowns.length) invalid();
      const result = display(expression);
      if (kind === "fraction") {
        const exact = expression.evaluate().json;
        if (
          typeof exact !== "number" &&
          !(
            exact &&
            typeof exact === "object" &&
            !Array.isArray(exact) &&
            "num" in exact &&
            /^[+-]?\d+$/.test(String(exact.num))
          ) &&
          !(Array.isArray(exact) && exact[0] === "Rational")
        )
          invalid("rationalOnly");
      }
      return result;
    });
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    const known = [
      "invalid",
      "domain",
      "unsupported",
      "polynomialOnly",
      "rationalOnly",
    ];
    self.postMessage({
      id,
      ok: false,
      error: known.includes(error.message) ? error.message : "invalid",
    });
  }
};
