"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  Maximize2,
  Minimize2,
  Crosshair,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Table2,
  MousePointer2,
} from "lucide-react";
import { InputGuide } from "./input-guide";
import { ExpressionRow, type GraphExpression } from "./expression-row";
import { GraphSettings } from "./graph-settings";
import { hideMathKeyboard, mathKeyboardHeight } from "@/lib/math/keyboard";
import {
  compileNumeric,
  DEFAULT_PARAMETERS,
  type Parameters,
} from "@/lib/math/numeric";
import { ToolShell } from "../shared";
import { GraphClient, type Plot, type Viewport } from "@/lib/math/client";
import {
  DEFAULT_VIEW,
  gridTicks,
  panView,
  zoomView,
  viewForAspect,
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
type Curve = GraphExpression;
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
  const [focusId, setFocusId] = useState<number | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
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
  const [canvas, setCanvas] = useState({ width: 800, height: 600 });
  const squareUnits = useRef(true);
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
          !sibling.classList.contains("ML__keyboard") &&
          !sibling.classList.contains("math-keyboard-accessory")
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
        const done = document.querySelector<HTMLElement>(
          ".math-keyboard-accessory button",
        );
        if (done) controls.push(done);
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
        if (mathKeyboardHeight()) {
          hideMathKeyboard();
          return;
        }
        setFocusId(null);
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
  useEffect(() => {
    const node = graph.current;
    if (!node) return;
    const resize = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      setCanvas((old) =>
        old.width === Math.round(width) && old.height === Math.round(height)
          ? old
          : { width: Math.round(width), height: Math.round(height) },
      );
      if (squareUnits.current)
        setView((old) => {
          const next = viewForAspect(old, width, height);
          return next.yMin === old.yMin && next.yMax === old.yMax ? old : next;
        });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded, expressionsOpen]);
  const resetView = () => {
    squareUnits.current = true;
    setView(viewForAspect(DEFAULT_VIEW, canvas.width, canvas.height));
  };
  const px = (x: number) =>
    ((x - view.xMin) / (view.xMax - view.xMin)) * canvas.width;
  const py = (y: number) =>
    ((view.yMax - y) / (view.yMax - view.yMin)) * canvas.height;
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
                      `${i ? "L" : "M"}${(((x - view.xMin) / (view.xMax - view.xMin)) * canvas.width).toFixed(2)},${(((view.yMax - y) / (view.yMax - view.yMin)) * canvas.height).toFixed(2)}`,
                  )
                  .join(" "),
              )
              .join(" "),
          },
        ];
      }),
    [plots, curves, view, canvas],
  );
  const addExpression = () => {
    if (curves.length >= MAX_FUNCTIONS) return;
    const id = nextId.current++;
    const name =
      NAMES.find((name) => !curves.some((curve) => curve.name === name)) || "t";
    const color =
      COLORS.find((color) => !curves.some((curve) => curve.color === color)) ||
      COLORS[curves.length % COLORS.length];
    setCurves((all) => [...all, { id, name, color, hidden: false, latex: "" }]);
    setExpressionsOpen(true);
    setFocusId(id);
  };
  const removeExpression = (id: number) => {
    if (curves.length === 1) {
      const replacement = nextId.current++;
      setCurves([
        {
          id: replacement,
          name: "f",
          color: COLORS[0],
          hidden: false,
          latex: "",
        },
      ]);
      setFocusId(replacement);
    } else setCurves((all) => all.filter((curve) => curve.id !== id));
  };
  const updateCurve = (id: number, change: Partial<Curve>) =>
    setCurves((all) =>
      all.map((curve) => (curve.id === id ? { ...curve, ...change } : curve)),
    );
  const content = (
    <div
      ref={workspace}
      data-graph-expanded={expanded || undefined}
      role={expanded ? "region" : undefined}
      aria-label={expanded ? t("graphLabel") : undefined}
      className={
        expanded
          ? "fixed inset-2 z-[70] overflow-y-auto overscroll-contain rounded-2xl bg-background shadow-xl sm:inset-4"
          : ""
      }
    >
      <div className="graph-workbench overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="graph-workbench-toolbar flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-border/60 px-2 py-1.5 sm:px-3">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 gap-2 rounded-lg px-2"
              aria-expanded={expressionsOpen}
              aria-controls="kit-graph-expressions"
              onClick={() => setExpressionsOpen((open) => !open)}
            >
              {expressionsOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
              <span className="text-xs font-medium">{tg("expressions")}</span>
              <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {curves.length}/{MAX_FUNCTIONS}
              </span>
            </Button>
          </div>
          <div className="flex items-center gap-0.5">
            <InputGuide />
            <GraphSettings
              view={view}
              onApply={(next) => {
                squareUnits.current = false;
                setView(next);
              }}
              grid={grid}
              setGrid={setGrid}
              angle={angle}
              setAngle={setAngle}
            />
            <Button
              data-expand-control
              size="icon"
              variant="ghost"
              className="size-9 rounded-lg"
              title={expanded ? tg("restore") : tg("expand")}
              aria-label={expanded ? tg("restore") : tg("expand")}
              aria-pressed={expanded}
              onClick={() => {
                hideMathKeyboard();
                setFocusId(null);
                setExpanded((value) => !value);
              }}
            >
              {expanded ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
          </div>
        </div>
        <div
          data-expressions-open={expressionsOpen || undefined}
          className={`graph-workbench-body grid ${expressionsOpen ? "lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]" : ""}`}
        >
          <aside
            id="kit-graph-expressions"
            aria-label={tg("expressions")}
            className={`${expressionsOpen ? "flex" : "hidden"} graph-expression-panel order-2 min-h-0 flex-col border-t border-border/60 lg:order-1 lg:border-e lg:border-t-0`}
          >
            <div
              data-math-scroll
              className="graph-expression-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              {curves.map((curve, index) => (
                <ExpressionRow
                  key={curve.id}
                  curve={curve}
                  index={index}
                  autoFocus={focusId === curve.id}
                  error={matching.find((plot) => plot.id === curve.id)?.error}
                  onChange={(change) => updateCurve(curve.id, change)}
                  onRemove={() => removeExpression(curve.id)}
                  onCommit={() => {
                    const next = curves[index + 1];
                    if (next)
                      document
                        .getElementById(`graph-expression-input-${next.id}`)
                        ?.focus();
                    else if (curve.latex.trim()) addExpression();
                  }}
                />
              ))}
              <div className="px-3 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full justify-start rounded-lg border border-dashed border-border/70 text-sm text-muted-foreground hover:text-foreground"
                  disabled={curves.length >= MAX_FUNCTIONS}
                  onClick={addExpression}
                >
                  <Plus className="size-4" />
                  {t("addFunction")}
                </Button>
              </div>
              {activeParameters.length > 0 && (
                <section
                  aria-label={tg("parameters")}
                  className="space-y-4 border-t border-border/60 px-4 py-4"
                >
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {tg("parameters")}
                  </h2>
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
            </div>
            <div
              className="hidden border-t border-border/60 bg-secondary/20 px-4 py-2 text-[11px] text-muted-foreground lg:block"
              role="status"
            >
              {tg("functionCount", {
                count: curves.length,
                max: MAX_FUNCTIONS,
              })}
            </div>
          </aside>
          <div className="graph-plot-panel relative order-1 min-w-0 lg:order-2">
            <div
              className="absolute start-3 top-3 z-10 inline-flex gap-1 rounded-xl border border-border/60 bg-card/95 p-1 shadow-sm"
              role="group"
              aria-label={t("graphLabel")}
            >
              <Button
                size="sm"
                variant={!trace ? "secondary" : "ghost"}
                className="h-8 gap-1.5 rounded-lg px-2 text-xs"
                aria-label={tg("pan")}
                title={tg("pan")}
                aria-pressed={!trace}
                onClick={() => setTrace(false)}
              >
                <MousePointer2 className="size-3.5" />
                <span className="hidden sm:inline">{tg("pan")}</span>
              </Button>
              <Button
                size="sm"
                variant={trace ? "secondary" : "ghost"}
                className="h-8 gap-1.5 rounded-lg px-2 text-xs"
                aria-label={tg("trace")}
                title={tg("trace")}
                aria-pressed={trace}
                onClick={() => setTrace(true)}
              >
                <Crosshair className="size-3.5" />
                <span className="hidden sm:inline">{tg("trace")}</span>
              </Button>
            </div>
            <div className="absolute end-3 top-3 z-10 flex flex-col gap-0.5 rounded-xl border border-border/60 bg-card/95 p-1 shadow-sm">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg"
                aria-label={t("zoomIn")}
                title={t("zoomIn")}
                onClick={() => setView((v) => zoomView(v, 0.7))}
              >
                <Plus className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg"
                aria-label={t("zoomOut")}
                title={t("zoomOut")}
                onClick={() => setView((v) => zoomView(v, 1 / 0.7))}
              >
                <Minus className="size-4" />
              </Button>
              <div className="mx-1 border-t border-border/60" />
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg"
                aria-label={tc("reset")}
                title={tc("reset")}
                onClick={resetView}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
            <svg
              ref={graph}
              viewBox={`0 0 ${canvas.width} ${canvas.height}`}
              className="graph-canvas block h-full w-full touch-none select-none outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-ring"
              preserveAspectRatio="none"
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
                  Home: resetView,
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
                  <rect width={canvas.width} height={canvas.height} />
                </clipPath>
              </defs>
              <g aria-hidden="true">
                {grid && (
                  <g stroke="currentColor" opacity={0.035}>
                    {gridTicks(view.xMin, view.xMax, 40).map((x) => (
                      <line
                        key={`minor-x${x}`}
                        x1={px(x)}
                        x2={px(x)}
                        y1={0}
                        y2={canvas.height}
                      />
                    ))}
                    {gridTicks(view.yMin, view.yMax, 40).map((y) => (
                      <line
                        key={`minor-y${y}`}
                        y1={py(y)}
                        y2={py(y)}
                        x1={0}
                        x2={canvas.width}
                      />
                    ))}
                  </g>
                )}

                {xticks
                  .filter((x) => grid || x === 0)
                  .map((x) => (
                    <line
                      key={`x${x}`}
                      x1={px(x)}
                      x2={px(x)}
                      y1={0}
                      y2={canvas.height}
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
                      x2={canvas.width}
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
                      y={Math.min(canvas.height - 18, Math.max(18, py(0) + 20))}
                      fill="currentColor"
                      fontSize="12"
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
                      x={Math.min(canvas.width - 55, Math.max(5, px(0) + 5))}
                      y={py(y) - 5}
                      fill="currentColor"
                      fontSize="12"
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
            </svg>{" "}
            <div
              className={`pointer-events-none absolute bottom-3 start-3 flex items-center gap-2 text-[10px] text-muted-foreground ${trace ? "hidden" : ""}`}
            >
              <span
                className={`size-1.5 rounded-full ${loading ? "animate-pulse bg-primary" : "bg-muted-foreground/40"}`}
                aria-hidden
              />
              <span role="status">
                {loading
                  ? tc("processing")
                  : t(angle === "deg" ? "degrees" : "radians")}
              </span>
            </div>
            {trace && (
              <section
                aria-label={tg("trace")}
                className="absolute inset-x-0 bottom-0 z-10 flex max-h-[40%] flex-wrap items-center gap-x-5 gap-y-2 overflow-y-auto border-t border-border/60 bg-card/95 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`${clipId}-trace`}
                    className="text-xs text-muted-foreground"
                  >
                    {tg("traceX")}
                  </label>
                  <Input
                    id={`${clipId}-trace`}
                    type="number"
                    step="any"
                    value={traceText}
                    className="h-8 w-24 rounded-lg font-mono text-base md:text-xs"
                    onChange={(e) => setTraceText(e.target.value)}
                  />
                </div>
                <div
                  className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-base md:text-xs"
                  dir="ltr"
                >
                  {tracePoints.map((point) => (
                    <p key={point.id} className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: point.color }}
                        aria-hidden
                      />
                      <span>
                        {point.name}(
                        {Number.isFinite(traceX) ? shown(traceX) : "—"}) ={" "}
                        {point.y == null ? "—" : shown(point.y)}
                      </span>
                    </p>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
        <div className="graph-workbench-footer flex min-h-11 items-center justify-between gap-3 border-t border-border/60 bg-secondary/10 px-3 py-2">
          <p
            id="kit-graph-hint"
            className="min-w-0 text-[11px] text-muted-foreground"
          >
            {trace ? tg("traceHint") : t("graphHint")}
          </p>
          <Button
            size="sm"
            variant={tableOpen ? "secondary" : "ghost"}
            className="h-8 shrink-0 gap-1.5 rounded-lg px-2 text-xs"
            aria-expanded={tableOpen}
            aria-controls="kit-graph-table"
            onClick={() => setTableOpen((open) => !open)}
          >
            <Table2 className="size-3.5" />
            <span className="hidden sm:inline">{t("valueTable")}</span>
            <span className="sr-only sm:hidden">{t("valueTable")}</span>
          </Button>
        </div>
        {tableOpen && (
          <div
            id="kit-graph-table"
            className="max-h-64 overflow-auto border-t border-border/60 p-3 text-xs"
          >
            {" "}
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
                          : matching.find((plot) => plot.id === curve.id)?.plot
                              ?.table[i]?.[1];
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
        )}
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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`graph-parameter-${name}`}
          className="font-mono text-sm"
        >
          {name}
        </label>
        <Input
          id={`graph-parameter-${name}`}
          aria-label={`${t("parameter")} ${name}`}
          className="h-8 w-24 rounded-lg px-2 text-end font-mono text-base md:text-xs"
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
      </div>
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
