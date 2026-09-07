"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/textarea";
import { downloadText } from "@/lib/utils";
import { formatJson } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function JsonFormat() {
  const t = useTranslations("tools.json-format");
  const tc = useTranslations("common");
  const log = useToolHistory("json-format");
  const [input, setInput] = useState('{\n  "hello": "kit"\n}');
  const liveError = useMemo(() => {
    const r = formatJson(input, false);
    return r.ok ? "" : r.error;
  }, [input]);

  const run = (minify = false) => {
    const r = formatJson(input, minify);
    if (!r.ok) {
      log("invalid", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log(minify ? "minify" : "format", "success");
  };

  return (
    <ToolShell toolId="json-format">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-64"
      />
      {liveError ? <p className="text-sm text-destructive">{liveError}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run(false)}>{tc("beautify")}</Button>
        <Button variant="secondary" onClick={() => run(true)}>
          {tc("minify")}
        </Button>
        <CopyButton value={input} />
        <Button variant="outline" onClick={() => downloadText(input, "data.json", "application/json")}>
          {tc("download")}
        </Button>
      </div>
    </ToolShell>
  );
}
