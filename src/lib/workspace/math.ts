import type { GraphExpression } from "@/components/tools/math/expression-row";
import type { Viewport } from "@/lib/math/client";
import { DEFAULT_VIEW, validView } from "@/lib/math/viewport";
import { DEFAULT_PARAMETERS, type Parameters } from "@/lib/math/numeric";

export const MATH_DRAFT_KEYS = [
  "graph",
  "scientific-calculator",
  "fraction-calculator",
  "equation-solver",
] as const;
export type MathDraftKey = (typeof MATH_DRAFT_KEYS)[number];
export const DRAFT_ENABLED_KEY = "kit-math-recovery";
export const DRAFT_EVENT = "kit:math-recovery";
export const GRAPH_LIBRARY_KEY = "kit-graphs-v1";
export type GraphDocument = {
  curves: GraphExpression[];
  view: Viewport;
  parameters: Parameters;
  angle: "rad" | "deg";
  grid: boolean;
};
export type SavedGraph = { id: string; name: string; document: GraphDocument };
export function freshGraph(): GraphDocument {
  return {
    curves: [
      { id: 0, name: "f", latex: "\\sin(x)", color: "#2563eb", hidden: false },
    ],
    view: { ...DEFAULT_VIEW },
    parameters: { ...DEFAULT_PARAMETERS },
    angle: "rad",
    grid: true,
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function parseGraph(value: unknown): GraphDocument | null {
  if (
    !record(value) ||
    !Array.isArray(value.curves) ||
    !value.curves.length ||
    value.curves.length > 8
  )
    return null;
  const curves: GraphExpression[] = [];
  for (const curve of value.curves) {
    if (
      !record(curve) ||
      typeof curve.name !== "string" ||
      !/^[a-zA-Z]$/.test(curve.name) ||
      typeof curve.latex !== "string" ||
      curve.latex.length > 4000 ||
      typeof curve.color !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(curve.color) ||
      typeof curve.hidden !== "boolean"
    )
      return null;
    curves.push({
      id: curves.length,
      name: curve.name,
      latex: curve.latex,
      color: curve.color,
      hidden: curve.hidden,
    });
  }
  if (
    !record(value.view) ||
    !validView(value.view as Viewport) ||
    !record(value.parameters) ||
    !["a", "b", "c"].every(
      (key) =>
        typeof value.parameters === "object" &&
        Number.isFinite(
          (value.parameters as Parameters)[key as keyof Parameters],
        ) &&
        Math.abs((value.parameters as Parameters)[key as keyof Parameters]) <=
          1e6,
    ) ||
    !["rad", "deg"].includes(value.angle as string) ||
    typeof value.grid !== "boolean"
  )
    return null;
  const { xMin, xMax, yMin, yMax } = value.view as Viewport;
  const { a, b, c } = value.parameters as Parameters;
  return {
    curves,
    view: { xMin, xMax, yMin, yMax },
    parameters: { a, b, c },
    angle: value.angle as "rad" | "deg",
    grid: value.grid,
  };
}
export type SimpleMathDraft = { value: string; angle?: "rad" | "deg" };
export function parseMathDraft(
  key: MathDraftKey,
  value: unknown,
): GraphDocument | SimpleMathDraft | null {
  if (key === "graph") return parseGraph(value);
  if (
    !record(value) ||
    typeof value.value !== "string" ||
    value.value.length > 4000
  )
    return null;
  return { value: value.value, angle: value.angle === "deg" ? "deg" : "rad" };
}
export function draftKey(key: MathDraftKey) {
  return `kit-math-draft-${key}`;
}
export function recoveryEnabled(): boolean {
  return localStorage.getItem(DRAFT_ENABLED_KEY) !== "false";
}
export function setRecoveryEnabled(enabled: boolean) {
  localStorage.setItem(DRAFT_ENABLED_KEY, String(enabled));
  if (!enabled)
    for (const key of MATH_DRAFT_KEYS) localStorage.removeItem(draftKey(key));
  window.dispatchEvent(new Event(DRAFT_EVENT));
}
export function parseGraphLibrary(value: unknown): SavedGraph[] {
  if (!Array.isArray(value) || value.length > 20) throw new Error("invalid");
  const ids = new Set<string>();
  return value.map((entry) => {
    if (
      !record(entry) ||
      typeof entry.id !== "string" ||
      !/^[a-z0-9-]{1,64}$/i.test(entry.id) ||
      ids.has(entry.id) ||
      typeof entry.name !== "string" ||
      !entry.name.trim() ||
      entry.name.length > 80
    )
      throw new Error("invalid");
    const document = parseGraph(entry.document);
    if (!document) throw new Error("invalid");
    ids.add(entry.id);
    return { id: entry.id, name: entry.name.trim(), document };
  });
}

/** Portable graph files carry only reviewed math state, never preferences or
 * application storage keys. Import adds a saved graph before replacing work. */
export function parseGraphFile(text: string): { name: string; document: GraphDocument } {
  if (text.length > 40000) throw new Error("invalid");
  const value: unknown = JSON.parse(text);
  if (!record(value) || value.kind !== "kit-graph" || value.version !== 1 || typeof value.name !== "string" || !value.name.trim() || value.name.length > 80) throw new Error("invalid");
  const document = parseGraph(value.document);
  if (!document) throw new Error("invalid");
  return { name: value.name.trim(), document };
}
export function graphFile(name: string, document: GraphDocument): string {
  const text = JSON.stringify({ kind: "kit-graph", version: 1, name: name.trim() || "Kit", document }, null, 2);
  parseGraphFile(text);
  return text;
}
