"use client";
import { TextWorkspace } from "./text-workspace";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatSql } from "@/lib/text/sql";
import { ToolShell, useToolHistory } from "./shared";

export function SqlFormat() {
  const fieldText = useTranslations("common");
  const t = useTranslations("tools.sql-format");
  const log = useToolHistory("sql-format");
  const [input, setInput] = useState("select id, name from users where active = 1 order by name");

  const [derived, setDerived] = useState<{ key: string; text: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const sourceKey = input;
  const output = derived?.key === sourceKey ? derived.text : null;
  const run = () => {
    const r = formatSql(input);
    if (!r.ok) {
      setFailure(r.error);
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setDerived({ key: sourceKey, text: r.text });
    setFailure(null);
    toast.success(t("success"));
    log("format", "success");
  };

  return (
    <ToolShell toolId="sql-format">
      <TextWorkspace output={output} error={failure} filename="query.sql">
      <Textarea aria-label={fieldText("input")} value={input} onChange={(e) => { setFailure(null); setInput(e.target.value); }} className="min-h-64 font-mono" />
      </TextWorkspace>
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
