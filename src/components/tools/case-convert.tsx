"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { convertCase, type CaseStyle } from "@/lib/text/case";
import { ToolShell, useToolHistory } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CaseConvert() {
  const t = useTranslations("tools.case-convert");
  const log = useToolHistory("case-convert");
  const [text, setText] = useState("Hello Kit World");
  const [style, setStyle] = useState<CaseStyle>("camel");

  const run = () => {
    setText(convertCase(text, style));
    toast.success(t("success"));
    log(style, "success");
  };

  return (
    <ToolShell toolId="case-convert">
      <div className="space-y-2">
        <Label>{t("style")}</Label>
        <select className={selectClass} value={style} onChange={(e) => setStyle(e.target.value as CaseStyle)}>
          <option value="camel">camelCase</option>
          <option value="pascal">PascalCase</option>
          <option value="snake">snake_case</option>
          <option value="kebab">kebab-case</option>
          <option value="constant">CONSTANT_CASE</option>
          <option value="title">Title Case</option>
          <option value="sentence">Sentence case</option>
          <option value="lower">lower case</option>
          <option value="upper">UPPER CASE</option>
        </select>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <CopyButton value={text} />
      </div>
    </ToolShell>
  );
}
