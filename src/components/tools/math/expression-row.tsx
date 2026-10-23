"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal, Trash2 } from "lucide-react";
import type { MathfieldElement } from "mathlive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { MathInput } from "./math-input";
export type GraphExpression = {
  id: number;
  name: string;
  latex: string;
  color: string;
  hidden: boolean;
};
export function ExpressionRow({
  curve,
  index,
  error,
  autoFocus,
  onChange,
  onRemove,
  onCommit,
}: {
  curve: GraphExpression;
  index: number;
  error?: string;
  autoFocus: boolean;
  onChange: (value: Partial<GraphExpression>) => void;
  onRemove: () => void;
  onCommit: () => void;
}) {
  const register = useRef<MathfieldElement | null>(null);
  const [options, setOptions] = useState(false);
  const t = useTranslations("math.graph");
  const tm = useTranslations("math");
  const tc = useTranslations("common");
  return (
    <div
      className={`graph-expression group border-b border-border/60 px-3 py-3 transition-colors focus-within:bg-primary/[0.035] ${curve.hidden ? "opacity-65" : ""}`}
      data-expression-id={curve.id}
    >
      <div className="flex min-w-0 items-start gap-2">
        <button
          type="button"
          className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
          title={`${curve.hidden ? t("show") : t("hide")} ${curve.name}(x)`}
          aria-label={`${curve.hidden ? t("show") : t("hide")} ${curve.name}(x)`}
          aria-pressed={!curve.hidden}
          onClick={() => onChange({ hidden: !curve.hidden })}
        >
          <span
            className="flex size-7 items-center justify-center rounded-full border-2 text-[11px] font-medium"
            style={{
              borderColor: curve.color,
              background: curve.hidden ? "transparent" : curve.color,
              color: curve.hidden ? curve.color : "white",
            }}
            aria-hidden
          >
            {index + 1}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex h-7 items-center justify-between gap-2">
            <span
              className="font-mono text-xs font-medium text-muted-foreground"
              dir="ltr"
            >
              {curve.name || "?"}(x)
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-md text-muted-foreground"
              aria-label={`${tc("options")} ${curve.name}(x)`}
              aria-expanded={options}
              onClick={() => setOptions(!options)}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
          <MathInput
            id={`graph-expression-input-${curve.id}`}
            compact
            value={curve.latex}
            label={`${curve.name || "?"}(x) =`}
            inputRef={register}
            autoFocus={autoFocus}
            onChange={(latex) => onChange({ latex })}
            onCommit={onCommit}
          />
          {error && error !== "canceled" && (
            <p
              role="status"
              className="mt-2 text-xs leading-relaxed text-destructive"
            >
              {tm(`errors.${error}`)}
            </p>
          )}
        </div>
      </div>
      {options && (
        <div className="ms-11 mt-3 space-y-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <Field label={t("name")}>
              <Input
                aria-label={`${t("name")} ${index + 1}`}
                className="h-9 font-mono"
                maxLength={1}
                value={curve.name}
                onChange={(e) =>
                  onChange({ name: e.target.value.toLowerCase() })
                }
              />
            </Field>
            <label className="flex flex-col gap-2 text-sm">
              <span>{t("color")}</span>
              <input
                type="color"
                aria-label={`${t("color")} ${curve.name}(x)`}
                value={curve.color}
                className="h-9 w-11 cursor-pointer rounded-lg border bg-background p-1"
                onInput={(e) => onChange({ color: e.currentTarget.value })}
                onChange={(e) => onChange({ color: e.target.value })}
              />
            </label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-0 text-destructive hover:text-destructive"
            aria-label={`${tc("remove")} ${curve.name}(x)`}
            onClick={onRemove}
          >
            <Trash2 className="size-3.5" />
            {tc("remove")}
          </Button>
        </div>
      )}
    </div>
  );
}
