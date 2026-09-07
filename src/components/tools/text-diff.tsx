"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { textDiff } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function TextDiff() {
  const t = useTranslations("tools.text-diff");
  const log = useToolHistory("text-diff");
  const [left, setLeft] = useState("hello\nworld");
  const [right, setRight] = useState("hello\nkit");
  const [parts, setParts] = useState<ReturnType<typeof textDiff>>([]);

  const run = () => {
    const d = textDiff(left, right);
    setParts(d);
    toast.success(t("success"));
    log("diff", "success");
  };

  return (
    <ToolShell toolId="text-diff">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("left")}</Label>
          <Textarea value={left} onChange={(e) => setLeft(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("right")}</Label>
          <Textarea value={right} onChange={(e) => setRight(e.target.value)} />
        </div>
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
