"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Viewport } from "@/lib/math/client";
import { validView } from "@/lib/math/viewport";
export function GraphSettings({
  view,
  onApply,
  grid,
  setGrid,
  angle,
  setAngle,
}: {
  view: Viewport;
  onApply: (v: Viewport) => void;
  grid: boolean;
  setGrid: (v: boolean) => void;
  angle: "rad" | "deg";
  setAngle: (value: "rad" | "deg") => void;
}) {
  const t = useTranslations("math.graph"),
    tm = useTranslations("math"),
    tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        container.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    container.current?.addEventListener("keydown", escape);
    const node = container.current;
    return () => {
      document.removeEventListener("pointerdown", outside);
      node?.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div ref={container} className="relative">
      <Button
        size="icon"
        variant={open ? "secondary" : "ghost"}
        className="size-9 rounded-lg"
        title={t("settings")}
        aria-label={t("settings")}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Settings2 className="size-4" />
      </Button>
      {open && (
        <section
          aria-label={t("settings")}
          className="absolute end-0 top-11 z-30 max-h-[min(70dvh,520px)] w-[min(290px,calc(100vw-3rem))] overflow-y-auto overscroll-contain rounded-xl border bg-card p-4 text-sm shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-semibold">{t("settings")}</h2>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label={tc("close")}
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <Bounds
            key={Object.values(view).join(":")}
            view={view}
            onApply={(next) => {
              onApply(next);
              setOpen(false);
            }}
          />
          <div className="mt-4 space-y-3 border-t pt-3">
            <label className="flex min-h-9 items-center gap-2">
              <input
                type="checkbox"
                checked={grid}
                onChange={(e) => setGrid(e.target.checked)}
              />
              {t("grid")}
            </label>
            <SegmentedControl
              value={angle}
              onChange={setAngle}
              aria-label={tm("angle")}
              options={[
                { value: "rad", label: tm("radians") },
                { value: "deg", label: tm("degrees") },
              ]}
            />
          </div>
        </section>
      )}
    </div>
  );
}
function Bounds({
  view,
  onApply,
}: {
  view: Viewport;
  onApply: (v: Viewport) => void;
}) {
  const t = useTranslations("math.graph");
  const [values, setValues] = useState(
    Object.fromEntries(
      Object.entries(view).map(([key, value]) => [
        key,
        Number(
          value.toPrecision(
            Math.min(
              17,
              Math.max(
                6,
                Math.ceil(
                  Math.log10(
                    Math.max(1, Math.abs(value)) /
                      (key.startsWith("x")
                        ? view.xMax - view.xMin
                        : view.yMax - view.yMin),
                  ),
                ) + 6,
              ),
            ),
          ),
        ).toString(),
      ]),
    ),
  );
  const [submitted, setSubmitted] = useState(false);
  const proposed = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value.trim() ? Number(value) : NaN,
    ]),
  ) as Viewport;
  const valid = validView(proposed);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (valid) onApply(proposed);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        {(["xMin", "xMax", "yMin", "yMax"] as const).map((key) => (
          <Field key={key} label={t(key)}>
            <Input
              type="number"
              step="any"
              className="h-9 rounded-lg font-mono text-base md:text-xs"
              value={values[key]}
              onChange={(e) =>
                setValues((old) => ({ ...old, [key]: e.target.value }))
              }
              aria-invalid={(submitted && !valid) || undefined}
            />
          </Field>
        ))}
      </div>
      {submitted && !valid && (
        <p role="alert" className="text-xs text-destructive">
          {t("boundsError")}
        </p>
      )}
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="w-full rounded-lg"
      >
        {t("apply")}
      </Button>
    </form>
  );
}
