"use client";
import { TextWorkspace } from "./text-workspace";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatJson } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function JsonFormat() {
  const t = useTranslations("tools.json-format");
  const tc = useTranslations("common");
  const log = useToolHistory("json-format");
  const [input, setInput] = useState('{\n  "hello": "kit"\n}');
  const [derived, setDerived] = useState<{ key: string; text: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const sourceKey = input;
  const output = derived?.key === sourceKey ? derived.text : null;
  const liveError = useMemo(() => {
    const r = formatJson(input, false);
    return r.ok ? "" : r.error;
  }, [input]);

  const run = (minify = false) => {
    const r = formatJson(input, minify);
    if (!r.ok) {
      setFailure(r.error);
      log("invalid", "failed");
      return;
    }
    setDerived({ key: sourceKey, text: r.text });
    setFailure(null);
    toast.success(t("success"));
    log(minify ? "minify" : "format", "success");
  };

  return (
    <ToolShell toolId="json-format">
      <TextWorkspace output={output} error={failure ?? liveError} filename="data.json">
      <Textarea aria-label={tc("input")}
        value={input}
        onChange={(e) => { setFailure(null); setInput(e.target.value); }}
        className="min-h-64"
      />
      </TextWorkspace>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run(false)}>{tc("beautify")}</Button>
        <Button variant="secondary" onClick={() => run(true)}>
          {tc("minify")}
        </Button>

      </div>
    </ToolShell>
  );
}
