"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Viewport } from "@/lib/math/client";
import { validView } from "@/lib/math/viewport";
export function GraphSettings({
  view,
  onApply,
  grid,
  setGrid,
}: {
  view: Viewport;
  onApply: (view: Viewport) => void;
  grid: boolean;
  setGrid: (value: boolean) => void;
}) {
  const t = useTranslations("math.graph");
  return (
    <details className="rounded-xl border bg-card text-sm">
      <summary className="cursor-pointer px-4 py-3 font-medium">
        {t("settings")}
      </summary>
      <Bounds
        key={Object.values(view).join(":")}
        view={view}
        onApply={onApply}
      />
      <label className="mx-4 mb-4 flex min-h-10 items-center gap-2">
        <input
          type="checkbox"
          checked={grid}
          onChange={(e) => setGrid(e.target.checked)}
        />
        {t("grid")}
      </label>
    </details>
  );
}
function Bounds({
  view,
  onApply,
}: {
  view: Viewport;
  onApply: (view: Viewport) => void;
}) {
  const t = useTranslations("math.graph");
  const [values, setValues] = useState(
    Object.fromEntries(
      Object.entries(view).map(([key, value]) => [key, String(value)]),
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
      className="space-y-3 p-4 pt-1"
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
        <p className="text-xs text-destructive" role="alert">
          {t("boundsError")}
        </p>
      )}
      <Button type="submit" variant="outline" size="sm">
        {t("apply")}
      </Button>
    </form>
  );
}
