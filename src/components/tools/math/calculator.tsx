"use client";
import { useRef, useState } from "react";
import type { MathfieldElement } from "mathlive";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ToolShell, useToolHistory } from "../shared";
import { MathInput, MathResult } from "./math-input";
import { useMath } from "./use-math";
import type { MathValue } from "@/lib/math/client";

function Calculator({ fraction = false }: { fraction?: boolean }) {
  const id = fraction ? "fraction-calculator" : "scientific-calculator";
  const t = useTranslations("math");
  const tc = useTranslations("common");
  const [value, setValue] = useState(
    fraction ? "\\frac{1}{2}+\\frac{1}{3}" : "",
  );
  const [angle, setAngle] = useState<"rad" | "deg">("rad");
  const field = useRef<MathfieldElement | null>(null);
  const { loading, reply, run, clear } = useMath<MathValue>();
  const log = useToolHistory(id);
  const calculate = async () => {
    if (!value.trim()) return;
    const result = await run({
      kind: fraction ? "fraction" : "calculate",
      latex: value,
      angle,
    });
    if (result.ok) log(result.result.decimal, "success");
  };
  const insert = (latex: string) => {
    const input = field.current;
    if (!input) return;
    input.focus();
    input.insert(latex);
    setValue(input.value);
    clear();
  };
  const keys = fraction
    ? ["\\frac{#0}{#?}", "(", ")", "\\div"]
    : [
        "\\sqrt{#0}",
        "#0^{#?}",
        "\\pi",
        "\\sin(#0)",
        "\\cos(#0)",
        "\\tan(#0)",
        "\\ln(#0)",
        "\\log(#0)",
        "\\exponentialE",
        "\\left|#0\\right|",
        "#0!",
        "10^{#?}",
      ];
  const names: Record<string, string> = {
    "\\frac{#0}{#?}": "a/b",
    "#0^{#?}": "xʸ",
    "\\sqrt{#0}": "√",
    "\\pi": "π",
    "\\div": "÷",
    "\\sin(#0)": "sin",
    "\\cos(#0)": "cos",
    "\\tan(#0)": "tan",
    "\\ln(#0)": "ln",
    "\\log(#0)": "log₁₀",
    "\\exponentialE": "e",
    "\\left|#0\\right|": "|x|",
    "#0!": "x!",
    "10^{#?}": "10ˣ",
  };
  return (
    <ToolShell toolId={id}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,1fr)]">
        <div className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
          {!fraction && (
            <SegmentedControl
              value={angle}
              onChange={(next) => {
                setAngle(next);
                clear();
              }}
              aria-label={t("angle")}
              options={[
                { value: "rad", label: t("radians") },
                { value: "deg", label: t("degrees") },
              ]}
            />
          )}
          <MathInput
            value={value}
            inputRef={field}
            label={t("expression")}
            onChange={(next) => {
              setValue(next);
              clear();
            }}
            onCommit={calculate}
          />
          <div className="grid grid-cols-4 gap-2" dir="ltr">
            {keys.map((key) => (
              <Button key={key} variant="secondary" onClick={() => insert(key)}>
                {names[key] || key}
              </Button>
            ))}
            {[
              "7",
              "8",
              "9",
              "\\div",
              "4",
              "5",
              "6",
              "\\times",
              "1",
              "2",
              "3",
              "-",
              "0",
              ".",
              "(",
              "+",
            ].map((key, i) => (
              <Button
                key={`${i}-${key}`}
                variant="outline"
                className="min-h-12 text-lg"
                onClick={() => insert(key)}
              >
                {key === "\\div" ? "÷" : key === "\\times" ? "×" : key}
              </Button>
            ))}
            <Button
              variant="secondary"
              onClick={() => {
                field.current?.executeCommand("deleteBackward");
                setValue(field.current?.value || "");
                clear();
              }}
              aria-label={t("backspace")}
            >
              ⌫
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setValue("");
                clear();
                field.current?.focus();
              }}
            >
              {tc("clear")}
            </Button>
            <Button variant="outline" onClick={() => insert(")")}>
              )
            </Button>
            <Button
              onClick={calculate}
              disabled={loading || !value.trim()}
              aria-label={t("calculate")}
            >
              =
            </Button>
          </div>
        </div>
        <section
          className="min-w-0 rounded-2xl border bg-card p-5"
          aria-label={tc("result")}
          aria-busy={loading}
        >
          <h2 className="text-sm font-medium text-muted-foreground">
            {tc("result")}
          </h2>
          {loading ? (
            <p className="mt-4 text-sm" role="status">
              {tc("processing")}
            </p>
          ) : reply?.ok ? (
            <div className="mt-3 space-y-4">
              <MathResult latex={reply.result.latex} label={tc("result")} />
              {(reply.result.approximate ||
                reply.result.plain !== reply.result.decimal) && (
                <div>
                  {reply.result.approximate && (
                    <p className="text-xs text-muted-foreground">
                      {t("decimal")}
                    </p>
                  )}
                  <p className="mt-1 break-all font-mono text-xl" dir="ltr">
                    {reply.result.approximate ? "≈" : "="}{" "}
                    {reply.result.decimal}
                  </p>
                </div>
              )}
              <CopyButton
                value={fraction ? reply.result.plain : reply.result.decimal}
              />
            </div>
          ) : reply && !reply.ok && reply.error !== "canceled" ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {t(`errors.${reply.error}`)}
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("calculateHint")}
            </p>
          )}
        </section>
      </div>
      {fraction && (
        <p className="text-sm text-muted-foreground">{t("fractionHint")}</p>
      )}
    </ToolShell>
  );
}
export function ScientificCalculator() {
  return <Calculator />;
}
export function FractionCalculator() {
  return <Calculator fraction />;
}
