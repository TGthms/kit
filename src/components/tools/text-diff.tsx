"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { textDiff } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function TextDiff() {
  const t = useTranslations("tools.text-diff");
  const log = useToolHistory("text-diff");
  const [left, setLeft] = useState("hello\nworld");
  const [right, setRight] = useState("hello\nkit");
  const [parts, setParts] = useState<ReturnType<typeof textDiff>>([]);

  const run = () => {
    try {
      const d = textDiff(left, right);
      setParts(d);
      toast.success(t("success"));
      log("diff", "success");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "error");
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="text-diff">
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="space-y-2" label={t("left")}>
          <Textarea value={left} onChange={(e) => setLeft(e.target.value)} />
        </Field>
        <Field className="space-y-2" label={t("right")}>
          <Textarea value={right} onChange={(e) => setRight(e.target.value)} />
        </Field>
      </div>
      <Button onClick={run}>{t("run")}</Button>
      {parts.length > 0 && (
        <pre className="overflow-auto rounded-2xl border bg-card p-4 text-sm">
          {parts.map((p, i) => (
            <span
              key={i}
              className={
                p.added
                  ? "bg-green-500/20 text-green-800 dark:text-green-300"
                  : p.removed
                    ? "bg-red-500/20 text-red-800 dark:text-red-300"
                    : ""
              }
            >
              {p.value}
            </span>
          ))}
        </pre>
      )}
    </ToolShell>
  );
}
