"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatToml } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function TomlFormat() {
  const t = useTranslations("tools.toml-format");
  const log = useToolHistory("toml-format");
  const [input, setInput] = useState('title = "Kit"\n');
  const run = () => {
    const r = formatToml(input);
    if (!r.ok) {
      toast.error(r.error);
      log("invalid", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log("format", "success");
  };
  return (
    <ToolShell toolId="toml-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
