"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatYaml } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function YamlFormat() {
  const t = useTranslations("tools.yaml-format");
  const log = useToolHistory("yaml-format");
  const [input, setInput] = useState("hello: kit\n");
  const run = () => {
    const r = formatYaml(input);
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
    <ToolShell toolId="yaml-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
