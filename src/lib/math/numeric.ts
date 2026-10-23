/** A bounded interpreter for parsed MathJSON. Shared by sampling and tracing;
 * never executes generated JavaScript or calls the symbolic engine per pixel. */
export type Parameters = { a: number; b: number; c: number };
export const DEFAULT_PARAMETERS: Parameters = { a: 1, b: 1, c: 1 };
export function compileNumeric(
  node: unknown,
  angle = "rad",
  parameters: Parameters = DEFAULT_PARAMETERS,
  definitions: Record<string, unknown> = {},
): (x: number) => number {
  const compiled = new Map<string, (x: number) => number>();
  const visiting = new Set<string>();
  let budget = 0;
  let evaluations = 0;
  const named = (name: string): ((x: number) => number) => {
    const held = compiled.get(name);
    if (held) return held;
    if (!Object.hasOwn(definitions, name)) throw new Error("missingFunction");
    if (visiting.has(name)) throw new Error("circularFunction");
    visiting.add(name);
    const fn = build(definitions[name]);
    visiting.delete(name);
    const values = new Map<number, number>();
    const bounded = (x: number) => {
      if (values.has(x)) return values.get(x)!;
      if (++evaluations > 1000) throw new Error("unsupported");
      const value = fn(x);
      if (values.size >= 128) values.delete(values.keys().next().value!);
      values.set(x, value);
      return value;
    };
    compiled.set(name, bounded);
    return bounded;
  };
  function build(node: unknown, level = 0): (x: number) => number {
    const unsupported = (): never => {
      throw new Error("unsupported");
    };
    if (level > 40 || ++budget > 4000) return unsupported();
    if (typeof node === "number" && Number.isFinite(node)) return () => node;
    if (
      node &&
      typeof node === "object" &&
      !Array.isArray(node) &&
      "num" in node
    ) {
      const n = Number(node.num);
      if (!Number.isFinite(n)) return unsupported();
      return () => n;
    }
    if (node === "x") return (x) => x;
    if (node === "Pi") return () => Math.PI;
    if (node === "ExponentialE") return () => Math.E;
    if (node === "a" || node === "b" || node === "c") {
      const value = parameters[node];
      if (!Number.isFinite(value) || Math.abs(value) > 1e6)
        return unsupported();
      return () => value;
    }
    if (!Array.isArray(node)) return unsupported();
    const [op, ...args] = node;
    if (op === "InvisibleOperator") {
      const factors: ((x: number) => number)[] = [];
      for (let i = 0; i < args.length; i++) {
        const name = args[i],
          next = args[i + 1];
        if (
          typeof name === "string" &&
          /^[dfghj-wz]$/.test(name) &&
          Array.isArray(next) &&
          next[0] === "Delimiter" &&
          next.length === 2
        ) {
          const fn = named(name),
            arg = build(next[1], level + 1);
          factors.push((x) => fn(arg(x)));
          i++;
        } else factors.push(build(args[i], level + 1));
      }
      return (x) => factors.reduce((product, factor) => product * factor(x), 1);
    }
    if (
      typeof op === "string" &&
      /^[dfghj-wz]$/.test(op) &&
      args.length === 1
    ) {
      const fn = named(op),
        arg = build(args[0], level + 1);
      return (x) => fn(arg(x));
    }
    const f = args.map((arg) => build(arg, level + 1));
    const radians = angle === "deg" ? Math.PI / 180 : 1;
    const unary: Record<string, (x: number) => number> = {
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
    if (typeof op === "string" && Object.hasOwn(unary, op) && f.length === 1)
      return (x) => unary[op](f[0](x));
    if (op === "Delimiter" && f.length === 1) return f[0];
    if (op === "Add" && f.length)
      return (x) => f.reduce((sum, a) => sum + a(x), 0);
    if ((op === "Multiply" || op === "InvisibleOperator") && f.length)
      return (x) => f.reduce((sum, a) => sum * a(x), 1);
    if (f.length === 2) {
      if (op === "Subtract") return (x) => f[0](x) - f[1](x);
      if (op === "Divide" || op === "Rational") return (x) => f[0](x) / f[1](x);
      if (op === "Power") return (x) => f[0](x) ** f[1](x);
      if (op === "Log") return (x) => Math.log(f[0](x)) / Math.log(f[1](x));
      if (op === "Root")
        return (x) => {
          const v = f[0](x),
            n = f[1](x);
          return v < 0 && Number.isInteger(n) && n % 2
            ? -((-v) ** (1 / n))
            : v ** (1 / n);
        };
    }
    return unsupported();
  }
  const root = build(node);
  return (x) => {
    evaluations = 0;
    return root(x);
  };
}
export function parameterNames(node: unknown, level = 0): (keyof Parameters)[] {
  if (level > 40) return [];
  if (node === "a" || node === "b" || node === "c") return [node];
  if (!Array.isArray(node)) return [];
  return [
    ...new Set(node.slice(1).flatMap((arg) => parameterNames(arg, level + 1))),
  ];
}

/** Prove equality to the displayed base-ten value using integer arithmetic.
 * Irrational/symbolic results stay approximate even if Number rounds them to
 * the same floating-point value. */
export function decimalIsExact(expression: unknown, decimal: string): boolean {
  function parts(node: unknown): [bigint, bigint] | null {
    if (Array.isArray(node) && node[0] === "Rational" && node.length === 3) {
      const a = parts(node[1]),
        b = parts(node[2]);
      return a && b && b[0] !== BigInt(0) ? [a[0] * b[1], a[1] * b[0]] : null;
    }
    const raw =
      typeof node === "number"
        ? String(node)
        : typeof node === "string"
          ? node
          : node && typeof node === "object" && "num" in node
            ? String(node.num)
            : "";
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) return null;
    const [mantissa, exp = "0"] = raw.toLowerCase().split("e");
    const places = (mantissa.split(".")[1]?.length || 0) - Number(exp);
    if (Math.abs(places) > 1000 || raw.length > 1100) return null;
    const digits = BigInt(mantissa.replace(".", ""));
    return places <= 0
      ? [digits * BigInt(10) ** BigInt(-places), BigInt(1)]
      : [digits, BigInt(10) ** BigInt(places)];
  }
  const a = parts(expression),
    b = parts(decimal);
  return Boolean(a && b && a[0] * b[1] === b[0] * a[1]);
}
