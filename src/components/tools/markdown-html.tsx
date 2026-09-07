"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { markdownToHtml, htmlToMarkdown } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function MarkdownHtml() {
  const t = useTranslations("tools.markdown-html");
  const log = useToolHistory("markdown-html");
  const [input, setInput] = useState("# Hello Kit\n\nPrivate tools.");
  const [toHtml, setToHtml] = useState(true);
  const run = () => {
    try {
      const out = toHtml ? markdownToHtml(input) : htmlToMarkdown(input);
      setInput(out);
      toast.success(t("success"));
      log(toHtml ? "md→html" : "html→md", "success");
    } catch (e) {
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
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
