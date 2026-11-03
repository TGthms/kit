"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
const ModalSurface = dynamic(() =>
  import("@/components/ui/modal-surface").then((module) => module.ModalSurface),
);
import { useTranslations } from "next-intl";

const headings = {
  roots: "√ · sqrt",
  powers: "xⁿ · ^",
  fractions: "a/b · /",
  functions: "sin · log · π",
  editing: "← → · ⌫",
  scope: "f(x) · y=",
};
const examples = [
  ["roots", "sqrt → √     sqrt(9) → 3"],
  ["powers", "x^2     2^(3+1) → 16     -2^2 → -4"],
  ["fractions", "1/2 + 1/3 → 5/6     2(3+4) → 14"],
  [
    "functions",
    "sin(x), cos(x), tan(x), arcsin(x), arccos(x), arctan(x)\nln(x), log(x), exp(x), abs(x), floor(x), ceil(x)\npi, e · 5! → 120",
  ],
  ["editing", "←  →  ↑  ↓     Space     Backspace     Enter"],
  ["scope", "y = a·x² + b·x + c     x² - 5x + 6 = 0"],
] as const;
export function InputGuide() {
  const t = useTranslations("math.guide");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="mx-1 inline-flex min-h-9 items-center rounded text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        onClick={() => setOpen(true)}
      >
        {t("open")}
      </button>
      {open && (
        <ModalSurface
          open={open}
          onOpenChange={setOpen}
          title={t("title")}
          closeLabel={tc("close")}
        >
          <div className="space-y-5 p-4 sm:p-6">
            {examples.map(([key, sample]) => (
              <section key={key}>
                <h3 className="font-mono text-sm font-medium" dir="ltr">
                  {headings[key]}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(key)}
                </p>
                <pre
                  className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-secondary/60 p-3 font-mono text-xs leading-relaxed"
                  dir="ltr"
                >
                  {sample}
                </pre>
              </section>
            ))}
          </div>
        </ModalSurface>
      )}
    </>
  );
}
