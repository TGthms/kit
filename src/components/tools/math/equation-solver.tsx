"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { ToolShell, useToolHistory } from "../shared";
import { MathInput, MathResult } from "./math-input";
import { useMath } from "./use-math";
import type { Solution } from "@/lib/math/client";

export function EquationSolver() {
  const t = useTranslations("math");
  const tc = useTranslations("common");
  const [value, setValue] = useState("x^2-5x+6=0");
  const { loading, reply, run, clear } = useMath<Solution>();
  const log = useToolHistory("equation-solver");
  const solve = async () => {
    const reply = await run({ kind: "solve", latex: value });
    if (reply.ok)
      log(
        reply.result.roots.map((root) => root.decimal).join(", ") ||
          reply.result.kind,
        "success",
      );
  };
  return (
    <ToolShell toolId="equation-solver">
      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
        <MathInput
          value={value}
          label={t("equation")}
          onChange={(next) => {
            setValue(next);
            clear();
          }}
          onCommit={solve}
        />
        <div className="flex flex-wrap gap-2">
          {["2(x+3)=10", "x^2-5x+6=0", "x^2=2"].map((example) => (
            <Button
              key={example}
              size="sm"
              variant="outline"
              onClick={() => {
                setValue(example);
                clear();
              }}
            >
              {example}
            </Button>
          ))}
        </div>
        <Button onClick={solve} disabled={loading || !value.trim()}>
          {loading ? tc("processing") : t("solve")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("solverScope")}</p>
      </div>
      {reply && !reply.ok && reply.error !== "canceled" && (
        <p className="text-sm text-destructive" role="alert">
          {t(`errors.${reply.error}`)}
        </p>
      )}
      {reply?.ok && (
        <section
          className="space-y-4 rounded-2xl border bg-card p-5"
          aria-label={tc("result")}
        >
          <h2 className="font-medium">
            {reply.result.kind === "identity"
              ? t("allReal")
              : reply.result.kind === "none"
                ? t("noReal")
                : t("solutions")}
          </h2>
          {reply.result.roots.map((root, i) => (
            <div key={i} className="min-w-0">
              <MathResult
                latex={`x=${root.latex}`}
                label={`${t("solutions")} ${i + 1}`}
              />
              {(root.approximate || root.plain !== root.decimal) && (
                <p
                  className="mt-1 font-mono text-sm text-muted-foreground"
                  dir="ltr"
                >
                  x {root.approximate ? "≈" : "="} {root.decimal}
                </p>
              )}
              <CopyButton
                value={`x = ${root.plain}`}
                aria-label={`${tc("copy")} · ${t("solutions")} ${i + 1}`}
                size="sm"
                className="mt-2"
              />
            </div>
          ))}
          {reply.result.steps.length > 0 && (
            <details className="border-t pt-4">
              <summary className="cursor-pointer font-medium">
                {t("showSteps")}
              </summary>
              <ol className="mt-5 space-y-6">
                {reply.result.steps.map((step, i) => (
                  <li key={step.key} className="space-y-2">
                    <p className="text-sm">
                      <span className="me-2 text-primary">{i + 1}.</span>
                      {t(`steps.${step.key}`)}
                    </p>
                    <MathResult
                      latex={step.latex}
                      label={t(`steps.${step.key}`)}
                    />
                    {step.detail?.map((latex, n) => (
                      <MathResult
                        key={n}
                        latex={latex}
                        label={t(`steps.${step.key}`)}
                      />
                    ))}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>
      )}
    </ToolShell>
  );
}
