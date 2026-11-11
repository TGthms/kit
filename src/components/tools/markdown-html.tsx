"use client";
import { TextWorkspace } from "./text-workspace";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { markdownToHtml, htmlToMarkdown } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function MarkdownHtml() {
  const fieldText = useTranslations("common");
  const t = useTranslations("tools.markdown-html");
  const log = useToolHistory("markdown-html");
  const [input, setInput] = useState("# Hello Kit\n\nPrivate tools.");
  const [toHtml, setToHtml] = useState(true);
  const [derived, setDerived] = useState<{ key: string; text: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const sourceKey = input + String(toHtml);
  const output = derived?.key === sourceKey ? derived.text : null;
  const run = () => {
    try {
      const out = toHtml ? markdownToHtml(input) : htmlToMarkdown(input);
      setDerived({ key: sourceKey, text: out });
    setFailure(null);
      toast.success(t("success"));
      log(toHtml ? "md→html" : "html→md", "success");
    } catch (e) {
      setFailure(e instanceof Error ? e.message : String(e));
      toast.error(e instanceof Error ? e.message : "error");
      log("failed", "failed");
    }
  };
  return (
    <ToolShell toolId="markdown-html">
      <div className="flex gap-2">
        <Button variant={toHtml ? "default" : "outline"} onClick={() => setToHtml(true)}>
          {t("toHtml")}
        </Button>
        <Button variant={!toHtml ? "default" : "outline"} onClick={() => setToHtml(false)}>
          {t("toMd")}
        </Button>
      </div>
      <TextWorkspace output={output} error={failure} filename="converted.txt">
      <Textarea aria-label={fieldText("input")} value={input} onChange={(e) => { setFailure(null); setInput(e.target.value); }} className="min-h-64" />
      </TextWorkspace>
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
