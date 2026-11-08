"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Popover } from "@heroui/react/popover";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { useLocale } from "next-intl";
import { HeroButton } from "@/components/ui/hero-button";
import { hideMathKeyboard } from "@/lib/math/keyboard";
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
  const locale = useLocale();
  return (
    <I18nProvider locale={locale}>
      <Popover
        isOpen={open}
        onOpenChange={(next) => {
          if (next) hideMathKeyboard();
          setOpen(next);
        }}
      >
        <HeroButton
          isIconOnly
          variant="ghost"
          className="size-9 rounded-lg"
          aria-label={t("settings")}
          aria-expanded={open}
        >
          <Settings2 className="size-4" />
        </HeroButton>
        <Popover.Content
          className="kit-hero w-[min(290px,calc(100vw-3rem))]"
          placement="bottom end"
        >
          <Popover.Dialog
            aria-label={t("settings")}
            className="max-h-[min(70dvh,520px)] overflow-y-auto overscroll-contain p-4 text-sm outline-none"
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
                glass
                value={angle}
                onChange={setAngle}
                aria-label={tm("angle")}
                options={[
                  { value: "rad", label: tm("radians") },
                  { value: "deg", label: tm("degrees") },
                ]}
              />
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </I18nProvider>
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
