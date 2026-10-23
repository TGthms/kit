"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Crosshair,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { GraphSettings } from "./graph-settings";
import {
  compileNumeric,
  DEFAULT_PARAMETERS,
  type Parameters,
} from "@/lib/math/numeric";
import { ToolShell } from "../shared";
import { MathInput } from "./math-input";
import { GraphClient, type Plot, type Viewport } from "@/lib/math/client";
import {
  DEFAULT_VIEW,
  gridTicks,
  panView,
  zoomView,
} from "@/lib/math/viewport";

const COLORS = [
  "#2563eb",
  "#db2777",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
  "#4d7c0f",
];
const NAMES = ["f", "g", "h", "d", "p", "q", "r", "s"];
const MAX_FUNCTIONS = 8;
type Curve = {
  id: number;
  latex: string;
  name: string;
  color: string;
  hidden: boolean;
};
type CurvePlot = {
  id: number;
  latex: string;
  parameters?: (keyof Parameters)[];
  plot?: Plot;
  error?: string;
};
function shown(value: number) {
  return Number(value.toPrecision(5)).toString();
}

// Exiting replaces the portal with a new normal workspace, so restore focus
// to its current control rather than the disconnected button from before exit.
function focusWorkspaceControl(
  workspace: React.RefObject<HTMLDivElement | null>,
) {
  workspace.current
    ?.querySelector<HTMLButtonElement>("[data-expand-control]")
    ?.focus();
}

export function FunctionGrapher() {
  const t = useTranslations("math");
  const tg = useTranslations("math.graph");
  const clipId = useId();
  const tc = useTranslations("common");
  const [curves, setCurves] = useState<Curve[]>([
    { id: 0, name: "f", color: COLORS[0], hidden: false, latex: "\\sin(x)" },
  ]);
  const nextId = useRef(1);
  const [view, setView] = useState<Viewport>(DEFAULT_VIEW);
  const [plots, setPlots] = useState<CurvePlot[]>([]);
  const [parameters, setParameters] = useState<Parameters>(DEFAULT_PARAMETERS);
  const [angle, setAngle] = useState<"rad" | "deg">("rad");
  const [grid, setGrid] = useState(true);
  const [expressionsOpen, setExpressionsOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const workspace = useRef<HTMLDivElement>(null);
  const [trace, setTrace] = useState(false);
  const [traceText, setTraceText] = useState("0");
  const sampleCurves = useMemo(
    () =>
      curves.map(({ id, name, latex, hidden }) => ({
        id,
        name,
        latex,
        hidden,
      })),
    [curves],
  );
  const requestKey = JSON.stringify({
    curves: sampleCurves,
    parameters,
    angle,
    view,
  });
  const [plottedKey, setPlottedKey] = useState("");
  const [loading, setLoading] = useState(false);
  const graph = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const client = useRef<GraphClient | null>(null);

  const graphSession = useRef(0);
  const latestRequest = useRef("");
  useEffect(() => {
    const session = graphSession.current;
    latestRequest.current = requestKey;
    const run = async () => {
      setLoading(true);
      client.current ??= new GraphClient();
      const reply = await client.current.run<CurvePlot[]>({
        kind: "graphs",
        latex: "",
        curves: sampleCurves,
        parameters,
        angle,
        viewport: view,
      });
      if (
        graphSession.current === session &&
        (reply.ok || reply.error !== "canceled")
      ) {
        setPlots(
          reply.ok
            ? reply.result
            : curves.map((curve) => ({ ...curve, error: reply.error })),
        );
        setPlottedKey(requestKey);
        if (latestRequest.current === requestKey) setLoading(false);
      }
    };
    void run();
    // Request key excludes cosmetic color changes and includes every numeric input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);
  useEffect(
    () => () => {
      graphSession.current++;
      client.current?.dispose();
      client.current = null;
    },
    [],
  );
  useEffect(() => {
    if (!expanded) return;
    const oldOverflow = document.body.style.overflow;
    const oldFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.body.style.overflow = "hidden";
    const inertSiblings: { element: HTMLElement; inert: boolean }[] = [];
    let branch: HTMLElement | null = workspace.current;
    while (branch?.parentElement && branch !== document.body) {
      for (const sibling of branch.parentElement.children)
        if (
          sibling !== branch &&
          sibling instanceof HTMLElement &&
          !["SCRIPT", "STYLE"].includes(sibling.tagName) &&
          !sibling.classList.contains("ML__keyboard")
        ) {
          inertSiblings.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      branch = branch.parentElement;
    }
    graph.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Tab" && !document.querySelector("dialog[open]")) {
        const controls = Array.from(
          workspace.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), summary, [tabindex="0"]',
          ) || [],
        ).filter((control) => control.getClientRects().length > 0);
        const first = controls[0],
          last = controls.at(-1),
          active = document.activeElement;
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first?.focus();
        }
      }
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = oldOverflow;
      for (const { element, inert } of inertSiblings) element.inert = inert;
      window.removeEventListener("keydown", escape);
      if (oldFocus?.isConnected && oldFocus !== document.body) oldFocus.focus();
      else focusWorkspaceControl(workspace);
    };
  }, [expanded]);
  // Native listener is deliberately non-passive: zoom only while the plot has
  // focus, leaving ordinary page scrolling alone elsewhere.
  useEffect(() => {
    const element = graph.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (document.activeElement !== element) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const rx = (event.clientX - rect.left) / rect.width;
      const ry = (event.clientY - rect.top) / rect.height;
      setView((v) =>
        zoomView(
          v,
          Math.exp(Math.max(-0.3, Math.min(0.3, event.deltaY * 0.002))),
          v.xMin + rx * (v.xMax - v.xMin),
          v.yMax - ry * (v.yMax - v.yMin),
        ),
      );
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [expanded]);
  const px = (x: number) => ((x - view.xMin) / (view.xMax - view.xMin)) * 800;
  const py = (y: number) => ((view.yMax - y) / (view.yMax - view.yMin)) * 600;
  const xticks = gridTicks(view.xMin, view.xMax),
    yticks = gridTicks(view.yMin, view.yMax);
  const matching = plots.filter((plot) =>
    curves.some((curve) => curve.id === plot.id && curve.latex === plot.latex),
  );
  const fresh = requestKey === plottedKey;
  const traceX = traceText.trim() ? Number(traceText) : NaN;
  const compiled = useMemo(
    () =>
      new Map(
        plots.flatMap((curve) => {
          if (!curve.plot) return [];
          try {
            return [
              [
                curve.id,
                compileNumeric(
                  curve.plot.expression,
                  angle,
                  parameters,
                  curve.plot.definitions,
                ),
              ] as const,
            ];
          } catch {
            return [];
          }
        }),
      ),
    [plots, angle, parameters],
  );
  const activeParameters = [
    ...new Set(plots.flatMap((plot) => plot.parameters || [])),
  ].sort();
  const tracePoints =
    fresh && Number.isFinite(traceX)
      ? curves
          .filter((curve) => !curve.hidden)
          .map((curve) => {
            let value: number | undefined;
            try {
              value = compiled.get(curve.id)?.(traceX);
            } catch {
              value = undefined;
            }
            return {
              ...curve,
              y: value != null && Number.isFinite(value) ? value : null,
            };
          })
      : [];
  const paths = useMemo(
    () =>
      plots.flatMap((plot) => {
        const curve = curves.find(
          (curve) => curve.id === plot.id && curve.latex === plot.latex,
        );
        if (!curve || curve.hidden || !plot.plot) return [];
        return [
          {
            id: curve.id,
            color: curve.color,
            d: plot.plot.segments
              .map((segment) =>
                segment
                  .map(
                    ([x, y], i) =>
                      `${i ? "L" : "M"}${(((x - view.xMin) / (view.xMax - view.xMin)) * 800).toFixed(2)},${(((view.yMax - y) / (view.yMax - view.yMin)) * 600).toFixed(2)}`,
                  )
                  .join(" "),
              )
              .join(" "),
          },
        ];
      }),
    [plots, curves, view],
  );
  const updateCurve = (id: number, change: Partial<Curve>) =>
    setCurves((all) =>
      all.map((curve) => (curve.id === id ? { ...curve, ...change } : curve)),
    );
  const content = (
    <div
      ref={workspace}
      role={expanded ? "region" : undefined}
      aria-label={expanded ? t("graphLabel") : undefined}
      className={
        expanded
          ? "fixed inset-2 z-[70] overflow-y-auto overscroll-contain rounded-2xl border bg-background p-4 shadow-xl sm:inset-4 sm:p-6"
          : ""
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {tg("functionCount", { count: curves.length, max: MAX_FUNCTIONS })}
        </span>
        <Button
          className="lg:hidden"
          size="sm"
          variant="outline"
          aria-expanded={expressionsOpen}
          aria-controls="kit-graph-expressions"
          onClick={() => setExpressionsOpen((open) => !open)}
        >
          {t("expression")}
        </Button>
        <Button
          data-expand-control
          size="sm"
          variant="outline"
          aria-pressed={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
          {expanded ? tg("restore") : tg("expand")}
        </Button>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(240px,0.7fr)_minmax(0,2fr)]">
        <div
          id="kit-graph-expressions"
          className={`${expressionsOpen ? "block" : "hidden lg:block"} space-y-4 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto lg:overscroll-contain lg:pe-1`}
        >
          {curves.map((curve, i) => {
            const result = matching.find((plot) => plot.id === curve.id);
            return (
              <div
                key={curve.id}
                className="min-w-0 space-y-2 rounded-2xl border bg-card p-3"
                style={{
                  borderInlineStartColor: curve.color,
                  borderInlineStartWidth: 3,
                }}
              >
                <div className="flex items-center gap-2">
                  <label
                    className="relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border"
                    style={{ background: curve.color }}
                  >
                    <span className="sr-only">
                      {tg("color")} {curve.name}(x)
                    </span>
                    <input
                      type="color"
                      aria-label={`${tg("color")} ${curve.name}(x)`}
                      value={curve.color}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onInput={(e) =>
                        updateCurve(curve.id, { color: e.currentTarget.value })
                      }
                      onChange={(e) =>
                        updateCurve(curve.id, { color: e.target.value })
                      }
                    />
                  </label>
                  <Input
                    aria-label={`${tg("name")} ${i + 1}`}
                    className="h-9 w-12 px-2 text-center font-mono"
                    maxLength={1}
                    value={curve.name}
                    onChange={(e) =>
                      updateCurve(curve.id, {
                        name: e.target.value.toLowerCase(),
                      })
                    }
                  />
                  <span className="font-mono text-sm">(x)</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ms-auto size-9"
                    aria-label={`${curve.hidden ? tg("show") : tg("hide")} ${curve.name}(x)`}
                    aria-pressed={!curve.hidden}
                    onClick={() =>
                      updateCurve(curve.id, { hidden: !curve.hidden })
                    }
                  >
                    {curve.hidden ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-9"
                    disabled={curves.length === 1}
                    aria-label={`${tc("remove")} ${curve.name}(x)`}
                    onClick={() =>
                      setCurves((all) => all.filter((c) => c.id !== curve.id))
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <MathInput
                  value={curve.latex}
                  label={`${curve.name || "?"}(x) =`}
                  onChange={(latex) => updateCurve(curve.id, { latex })}
                />
                {result?.error && result.error !== "canceled" && (
                  <p role="status" className="text-xs text-destructive">
                    {t(`errors.${result.error}`)}
                  </p>
                )}
              </div>
            );
          })}
          <Button
            variant="outline"
            disabled={curves.length >= MAX_FUNCTIONS}
            onClick={() =>
              setCurves((all) => [
                ...all,
                {
                  id: nextId.current++,
                  name:
                    NAMES.find(
                      (name) => !all.some((curve) => curve.name === name),
                    ) || "t",
                  color:
                    COLORS.find(
                      (color) => !all.some((curve) => curve.color === color),
                    ) || COLORS[all.length % COLORS.length],
                  hidden: false,
                  latex: "",
                },
              ])
            }
          >
            <Plus className="size-4" />
            {t("addFunction")}
          </Button>
          <p className="text-xs text-muted-foreground">{tg("scope")}</p>
          {activeParameters.length > 0 && (
            <section className="space-y-5 rounded-2xl border bg-card p-4">
              <h2 className="text-sm font-medium">{tg("parameters")}</h2>
              {activeParameters.map((key) => (
                <ParameterControl
                  key={key}
                  name={key}
                  value={parameters[key]}
                  onChange={(value) =>
                    setParameters((old) => ({ ...old, [key]: value }))
                  }
                />
              ))}
            </section>
          )}
          <GraphSettings
            view={view}
            onApply={setView}
            grid={grid}
            setGrid={setGrid}
          />
          <SegmentedControl
            value={angle}
            onChange={setAngle}
            aria-label={t("angle")}
            options={[
              { value: "rad", label: t("radians") },
              { value: "deg", label: t("degrees") },
            ]}
          />
        </div>
        <div className="min-w-0 space-y-3 lg:sticky lg:top-20">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
              <span className="text-xs text-muted-foreground" role="status">
                {loading
                  ? tc("processing")
                  : t(angle === "deg" ? "degrees" : "radians")}
              </span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant={trace ? "secondary" : "ghost"}
                  aria-label={tg("trace")}
                  aria-pressed={trace}
                  onClick={() => setTrace((value) => !value)}
                >
                  <Crosshair className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("zoomIn")}
                  onClick={() => setView((v) => zoomView(v, 0.7))}
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("zoomOut")}
                  onClick={() => setView((v) => zoomView(v, 1 / 0.7))}
                >
                  <Minus className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={tc("reset")}
                  onClick={() => setView(DEFAULT_VIEW)}
                >
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            </div>
            <svg
              ref={graph}
              viewBox="0 0 800 600"
              className="block aspect-[4/3] w-full touch-none select-none outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-ring"
              tabIndex={0}
              role="application"
              aria-label={t("graphLabel")}
              aria-describedby="kit-graph-hint"
              onKeyDown={(event) => {
                if (event.altKey || event.ctrlKey || event.metaKey) return;
                if (
                  trace &&
                  (event.key === "ArrowLeft" || event.key === "ArrowRight")
                ) {
                  event.preventDefault();
                  setTraceText(
                    shown(
                      (Number.isFinite(traceX) ? traceX : 0) +
                        ((view.xMax - view.xMin) /
                          (event.shiftKey ? 100 : 1000)) *
                          (event.key === "ArrowLeft" ? -1 : 1),
                    ),
                  );
                  return;
                }
                const dx = (view.xMax - view.xMin) * 0.1,
                  dy = (view.yMax - view.yMin) * 0.1;
                const actions: Record<string, () => void> = {
                  ArrowLeft: () => setView(panView(view, -dx, 0)),
                  ArrowRight: () => setView(panView(view, dx, 0)),
                  ArrowUp: () => setView(panView(view, 0, dy)),
                  ArrowDown: () => setView(panView(view, 0, -dy)),
                  "+": () => setView(zoomView(view, 0.7)),
                  "=": () => setView(zoomView(view, 0.7)),
                  "-": () => setView(zoomView(view, 1 / 0.7)),
                  Home: () => setView(DEFAULT_VIEW),
                };
                if (actions[event.key]) {
                  event.preventDefault();
                  actions[event.key]();
                }
              }}
              onPointerDown={(event) => {
                event.currentTarget.focus();
                event.currentTarget.setPointerCapture(event.pointerId);
                if (trace) {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setTraceText(
                    shown(
                      view.xMin +
                        ((event.clientX - rect.left) / rect.width) *
                          (view.xMax - view.xMin),
                    ),
                  );
                }
                pointers.current.set(event.pointerId, {
                  x: event.clientX,
                  y: event.clientY,
                });
              }}
              onPointerUp={(event) => pointers.current.delete(event.pointerId)}
              onPointerCancel={(event) =>
                pointers.current.delete(event.pointerId)
              }
              onLostPointerCapture={(event) =>
                pointers.current.delete(event.pointerId)
              }
              onPointerMove={(event) => {
                const old = pointers.current.get(event.pointerId);
                if (trace && pointers.current.size <= 1) {
                  if (old || event.pointerType === "mouse") {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setTraceText(
                      shown(
                        view.xMin +
                          ((event.clientX - rect.left) / rect.width) *
                            (view.xMax - view.xMin),
                      ),
                    );
                  }
                  return;
                }
                if (!old) return;
                const all = [...pointers.current.entries()];
                const other = all.find(([id]) => id !== event.pointerId)?.[1];
                const rect = event.currentTarget.getBoundingClientRect();
                const now = { x: event.clientX, y: event.clientY };
                setView((v) => {
                  let moved = panView(
                    v,
                    ((-(now.x - old.x) / rect.width) * (v.xMax - v.xMin)) /
                      (other ? 2 : 1),
                    (((now.y - old.y) / rect.height) * (v.yMax - v.yMin)) /
                      (other ? 2 : 1),
                  );
                  if (other) {
                    const before = Math.hypot(old.x - other.x, old.y - other.y),
                      after = Math.hypot(now.x - other.x, now.y - other.y);
                    if (after > 8 && before > 8) {
                      const rx =
                          ((now.x + other.x) / 2 - rect.left) / rect.width,
                        ry = ((now.y + other.y) / 2 - rect.top) / rect.height;
                      moved = zoomView(
                        moved,
                        before / after,
                        moved.xMin + rx * (moved.xMax - moved.xMin),
                        moved.yMax - ry * (moved.yMax - moved.yMin),
                      );
                    }
                  }
                  return moved;
                });
                pointers.current.set(event.pointerId, now);
              }}
            >
              <defs>
                <clipPath id={clipId}>
                  <rect width="800" height="600" />
                </clipPath>
              </defs>
              <g aria-hidden="true">
                {xticks
                  .filter((x) => grid || x === 0)
                  .map((x) => (
                    <line
                      key={`x${x}`}
                      x1={px(x)}
                      x2={px(x)}
                      y1={0}
                      y2={600}
                      stroke="currentColor"
                      opacity={x === 0 ? 0.45 : 0.1}
                    />
                  ))}
                {yticks
                  .filter((y) => grid || y === 0)
                  .map((y) => (
                    <line
                      key={`y${y}`}
                      y1={py(y)}
                      y2={py(y)}
                      x1={0}
                      x2={800}
                      stroke="currentColor"
                      opacity={y === 0 ? 0.45 : 0.1}
                    />
                  ))}
                {xticks
                  .filter((x) => x !== 0)
                  .map((x) => (
                    <text
                      key={`xl${x}`}
                      x={px(x) + 4}
                      y={Math.min(582, Math.max(18, py(0) + 20))}
                      fill="currentColor"
                      fontSize="16"
                      opacity="0.65"
                    >
                      {shown(x)}
                    </text>
                  ))}
                {yticks
                  .filter((y) => y !== 0)
                  .map((y) => (
                    <text
                      key={`yl${y}`}
                      x={Math.min(745, Math.max(5, px(0) + 5))}
                      y={py(y) - 5}
                      fill="currentColor"
                      fontSize="16"
                      opacity="0.65"
                    >
                      {shown(y)}
                    </text>
                  ))}
                <g clipPath={`url(#${clipId})`}>
                  {paths.map((path) => (
                    <path
                      key={path.id}
                      d={path.d}
                      fill="none"
                      stroke={path.color}
                      strokeWidth={2.5}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {trace &&
                    tracePoints
                      .filter(
                        (point) =>
                          point.y != null &&
                          point.y >= view.yMin &&
                          point.y <= view.yMax &&
                          traceX >= view.xMin &&
                          traceX <= view.xMax,
                      )
                      .map((point) => (
                        <circle
                          key={`trace-${point.id}`}
                          cx={px(traceX)}
                          cy={py(point.y!)}
                          r={5}
                          fill={point.color}
                          stroke="var(--card)"
                          strokeWidth={2}
                        />
                      ))}
                </g>
              </g>
            </svg>
          </div>
          <p className="text-xs text-muted-foreground" id="kit-graph-hint">
            {trace ? tg("traceHint") : t("graphHint")}
          </p>
          <p className="font-mono text-xs text-muted-foreground" dir="ltr">
            x: {shown(view.xMin)} … {shown(view.xMax)} · y: {shown(view.yMin)} …{" "}
            {shown(view.yMax)}
          </p>
          {trace && (
            <section
              className="space-y-3 rounded-xl border bg-card p-4"
              aria-label={tg("trace")}
            >
              <Field label={tg("traceX")}>
                <Input
                  type="number"
                  step="any"
                  value={traceText}
                  onChange={(e) => setTraceText(e.target.value)}
                />
              </Field>
              <div
                className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-sm"
                dir="ltr"
              >
                {tracePoints.map((point) => (
                  <p key={point.id} style={{ color: point.color }}>
                    {point.name}({Number.isFinite(traceX) ? shown(traceX) : "—"}
                    ) = {point.y == null ? "—" : shown(point.y)}
                  </p>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {tg("approximate")}
              </p>
            </section>
          )}
          <details className="rounded-xl border p-3 text-sm">
            <summary className="cursor-pointer font-medium">
              {t("valueTable")}
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-start font-mono" dir="ltr">
                <caption className="sr-only">{t("valueTable")}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="p-2 text-start">
                      x
                    </th>
                    {curves.map((curve) => (
                      <th key={curve.id} scope="col" className="p-2 text-start">
                        {curve.name}(x)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 9 }, (_, i) => (
                    <tr key={i} className="border-t">
                      <th scope="row" className="p-2 text-start font-normal">
                        {shown(view.xMin + ((view.xMax - view.xMin) * i) / 8)}
                      </th>
                      {curves.map((curve) => {
                        const y =
                          !fresh || curve.hidden
                            ? null
                            : matching.find((plot) => plot.id === curve.id)
                                ?.plot?.table[i]?.[1];
                        return (
                          <td key={curve.id} className="p-2">
                            {y == null ? "—" : shown(y)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
  return (
    <ToolShell toolId="function-grapher">
      {expanded ? createPortal(content, document.body) : content}
    </ToolShell>
  );
}

function ParameterControl({
  name,
  value,
  onChange,
}: {
  name: keyof Parameters;
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations("math.graph");
  const [draft, setDraft] = useState(String(value));
  const valid =
    draft.trim() &&
    Number.isFinite(Number(draft)) &&
    Math.abs(Number(draft)) <= 1e6;
  return (
    <div className="space-y-3">
      <Field label={`${t("parameter")} ${name}`}>
        <Input
          type="number"
          step="any"
          value={draft}
          aria-invalid={!valid || undefined}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            if (
              next.trim() &&
              Number.isFinite(Number(next)) &&
              Math.abs(Number(next)) <= 1e6
            )
              onChange(Number(next));
          }}
        />
      </Field>
      <Slider
        aria-label={`${t("parameter")} ${name}`}
        min={Math.min(-10, value)}
        max={Math.max(10, value)}
        step={0.1}
        value={[value]}
        onValueChange={([next]) => {
          const rounded = Number(next.toFixed(5));
          setDraft(String(rounded));
          onChange(rounded);
        }}
      />
    </div>
  );
}
