"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ean13Check, ibanCheck, isbn10Check, isbn13Check } from "@/lib/text/check-digits";
import { ToolShell, useToolHistory } from "./shared";

export function CheckDigits() {
  const t = useTranslations("tools.check-digits");
  const log = useToolHistory("check-digits");
  const [kind, setKind] = useState<"isbn13" | "isbn10" | "ean13" | "iban">("isbn13");
  const [value, setValue] = useState("9780306406157");

  const result = useMemo(() => {
    if (kind === "isbn13") return isbn13Check(value);
    if (kind === "isbn10") return isbn10Check(value);
    if (kind === "ean13") return ean13Check(value);
    return ibanCheck(value);
  }, [kind, value]);

  return (
    <ToolShell toolId="check-digits">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <SegmentedControl
        value={kind}
        aria-label={t("kind")}
        onChange={setKind}
        options={[
          { value: "isbn13", label: "ISBN-13" },
          { value: "isbn10", label: "ISBN-10" },
          { value: "ean13", label: "EAN-13" },
          { value: "iban", label: "IBAN" },
        ]}
      />
      <Field label={t("value")}>
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
      </Field>
      <div className={`rounded-2xl border p-4 ${result.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-destructive/40 bg-destructive/10"}`}>
        <p className="text-lg font-semibold">{result.ok ? t("valid") : t("invalid")}</p>
        {result.normalized ? (
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {t("normalized")}: {result.normalized}
          </p>
        ) : null}
      </div>
      <Button
        variant="outline"
        onClick={() => {
          log(`${kind}:${result.ok ? "ok" : "fail"}`, result.ok ? "success" : "failed");
          toast.success(t("saved"));
        }}
      >
        {t("record")}
      </Button>
    </ToolShell>
  );
}
