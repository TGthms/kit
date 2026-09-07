"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/textarea";
import { jsonToTypescript } from "@/lib/text/json-types";
import { ToolShell, useToolHistory } from "./shared";

export function JsonTypes() {
  const t = useTranslations("tools.json-types");
  const log = useToolHistory("json-types");
  const [input, setInput] = useState('{\n  "name": "Kit",\n  "ok": true\n}');

  const run = () => {
    const r = jsonToTypescript(input, "Root");
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log("types", "success");
  };

  return (
    <ToolShell toolId="json-types">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64 font-mono" />
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <CopyButton value={input} />
      </div>
    </ToolShell>
  );
}
