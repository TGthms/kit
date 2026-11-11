"use client";
import { TextWorkspace } from "./text-workspace";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatYaml } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function YamlFormat() {
  const fieldText = useTranslations("common");
  const t = useTranslations("tools.yaml-format");
  const log = useToolHistory("yaml-format");
  const [input, setInput] = useState("hello: kit\n");
  const [derived, setDerived] = useState<{ key: string; text: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const sourceKey = input;
  const output = derived?.key === sourceKey ? derived.text : null;
  const run = () => {
    const r = formatYaml(input);
    if (!r.ok) {
      setFailure(r.error);
      toast.error(r.error);
      log("invalid", "failed");
      return;
    }
    setDerived({ key: sourceKey, text: r.text });
    setFailure(null);
    toast.success(t("success"));
    log("format", "success");
  };
  return (
    <ToolShell toolId="yaml-format">
      <TextWorkspace output={output} error={failure} filename="data.yaml">
      <Textarea aria-label={fieldText("input")} value={input} onChange={(e) => { setFailure(null); setInput(e.target.value); }} className="min-h-64" />
      </TextWorkspace>
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
