"use client";
import { useTranslations } from "next-intl";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/utils";
import type { ReactNode } from "react";

/** Keep the source editable and the derived output distinct. Output is never
 * rendered as HTML, including conversions containing untrusted markup. */
export function TextWorkspace({ children, output, error, filename = "kit-result.txt" }: { children: ReactNode; output: string | null; error?: string | null; filename?: string }) {
  const t = useTranslations("common");
  return <div className="grid min-w-0 gap-4 xl:grid-cols-2">
    <div className="min-w-0"><Field label={t("input")} error={error}>{children}</Field></div>
    <section aria-label={t("output")} className="min-w-0 space-y-2">
      <p className="text-sm font-medium">{t("output")}</p>
      <Textarea aria-label={t("output")} value={output ?? ""} readOnly className="min-h-64 font-mono" />
      <div className="flex flex-wrap gap-2"><CopyButton value={output ?? ""} /><Button type="button" variant="outline" disabled={output === null} onClick={() => output !== null && downloadText(output, filename)}>{t("download")}</Button></div>
    </section>
  </div>;
}
