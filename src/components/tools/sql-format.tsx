"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatSql } from "@/lib/text/sql";
import { ToolShell, useToolHistory } from "./shared";

export function SqlFormat() {
  const t = useTranslations("tools.sql-format");
  const log = useToolHistory("sql-format");
  const [input, setInput] = useState("select id, name from users where active = 1 order by name");

  const run = () => {
    const r = formatSql(input);
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log("format", "success");
  };

  return (
    <ToolShell toolId="sql-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64 font-mono" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
