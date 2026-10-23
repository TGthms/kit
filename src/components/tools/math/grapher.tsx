"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolShell } from "../shared";
import { MathInput } from "./math-input";
import { MathClient, type Plot, type Viewport } from "@/lib/math/client";
import {
  DEFAULT_VIEW,
  gridTicks,
  panView,
  zoomView,
} from "@/lib/math/viewport";

const COLORS = ["#2563eb", "#db2777", "#059669"];
type Curve = { id: number; latex: string };
type CurvePlot = { id: number; latex: string; plot?: Plot; error?: string };
function shown(value: number) {
  return Number(value.toPrecision(5)).toString();
}

export function FunctionGrapher() {
  const t = useTranslations("math");
  const tc = useTranslations("common");
  const [curves, setCurves] = useState<Curve[]>([{ id: 0, latex: "\\sin(x)" }]);
  const nextId = useRef(1);
  const [view, setView] = useState<Viewport>(DEFAULT_VIEW);
  const [plots, setPlots] = useState<CurvePlot[]>([]);
  const [loading, setLoading] = useState(false);
  const graph = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const client = useRef<MathClient | null>(null);
  const [plottedView, setPlottedView] = useState<Viewport | null>(null);
  useEffect(() => {
    let current = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      client.current ??= new MathClient();
      const reply = await client.current.run<CurvePlot[]>({
        kind: "graphs",
        latex: "",
        curves,
        viewport: view,
      });
      if (current) {
        setPlots(
          reply.ok
            ? reply.result
            : curves.map((curve) => ({ ...curve, error: reply.error })),
        );
        setPlottedView(view);
        setLoading(false);
      }
    }, 160);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [curves, view]);
  useEffect(() => () => client.current?.dispose(), []);
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
  }, []);
  const px = (x: number) => ((x - view.xMin) / (view.xMax - view.xMin)) * 800;
  const py = (y: number) => ((view.yMax - y) / (view.yMax - view.yMin)) * 600;
  const xticks = gridTicks(view.xMin, view.xMax),
    yticks = gridTicks(view.yMin, view.yMax);
  const matching = plots.filter((plot) =>
    curves.some((curve) => curve.id === plot.id && curve.latex === plot.latex),
  );
  return (
    <ToolShell toolId="function-grapher">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(250px,0.8fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          {curves.map((curve, i) => {
            const result = matching.find((plot) => plot.id === curve.id);
            return (
              <div
                key={curve.id}
                className="relative min-w-0 space-y-2 rounded-2xl border bg-card p-4"
                style={{
                  borderInlineStartColor: COLORS[i],
                  borderInlineStartWidth: 3,
                }}
              >
                {curves.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute end-1 top-1 z-10 size-8"
                    aria-label={`${tc("remove")} f${i + 1}`}
                    onClick={() =>
                      setCurves((all) => all.filter((c) => c.id !== curve.id))
                    }
                  >
                    <X className="size-4" />
                  </Button>
                )}
                <MathInput
                  value={curve.latex}
                  label={`f${i + 1}(x)`}
                  onChange={(latex) =>
                    setCurves((all) =>
                      all.map((c) => (c.id === curve.id ? { ...c, latex } : c)),
                    )
                  }
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
            disabled={curves.length >= 3}
            onClick={() =>
              setCurves((all) => [...all, { id: nextId.current++, latex: "" }])
            }
          >
            <Plus className="size-4" />
            {t("addFunction")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("graphScope")}</p>
        </div>
        <div className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
              <span className="text-xs text-muted-foreground" role="status">
                {loading ? tc("processing") : t("radians")}
              </span>
              <div className="flex gap-1">
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
                <clipPath id="kit-plot-clip">
                  <rect width="800" height="600" />
                </clipPath>
              </defs>
              <g aria-hidden="true">
                {xticks.map((x) => (
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
                {yticks.map((y) => (
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
                <g clipPath="url(#kit-plot-clip)">
                  {matching.map((curve) => (
                    <path
                      key={curve.id}
                      d={
                        curve.plot?.segments
                          .map((segment) =>
                            segment
                              .map(
                                ([x, y], i) =>
                                  `${i ? "L" : "M"}${px(x).toFixed(2)},${py(y).toFixed(2)}`,
                              )
                              .join(" "),
                          )
                          .join(" ") || ""
                      }
                      fill="none"
                      stroke={
                        COLORS[curves.findIndex((c) => c.id === curve.id)]
                      }
                      strokeWidth={2.5}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>
              </g>
            </svg>
          </div>
          <p className="text-xs text-muted-foreground" id="kit-graph-hint">
            {t("graphHint")}
          </p>
          <p className="font-mono text-xs text-muted-foreground" dir="ltr">
            x: {shown(view.xMin)} … {shown(view.xMax)} · y: {shown(view.yMin)} …{" "}
            {shown(view.yMax)}
          </p>
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
                    {curves.map((curve, i) => (
                      <th key={curve.id} scope="col" className="p-2 text-start">
                        f{i + 1}(x)
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
                        const fresh =
                          plottedView &&
                          Object.keys(view).every(
                            (key) =>
                              view[key as keyof Viewport] ===
                              plottedView[key as keyof Viewport],
                          );
                        const y = !fresh
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
          </details>
        </div>
      </div>
    </ToolShell>
  );
}
