"use client";
import { TextWorkspace } from "./text-workspace";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { convertCase, type CaseStyle } from "@/lib/text/case";
import { ToolShell, useToolHistory } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CaseConvert() {
  const fieldText = useTranslations("common");
  const t = useTranslations("tools.case-convert");
  const log = useToolHistory("case-convert");
  const [text, setText] = useState("Hello Kit World");
  const [style, setStyle] = useState<CaseStyle>("camel");

  const [derived, setDerived] = useState<{ key: string; text: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const sourceKey = text + style;
  const output = derived?.key === sourceKey ? derived.text : null;
  const run = () => {
    setDerived({ key: sourceKey, text: convertCase(text, style) });
    setFailure(null);
    toast.success(t("success"));
    log(style, "success");
  };

  return (
    <ToolShell toolId="case-convert">
      <Field className="space-y-2" label={t("style")}>
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
      </Field>
      <TextWorkspace output={output} error={failure} filename="converted.txt">
      <Textarea aria-label={fieldText("input")} value={text} onChange={(e) => { setFailure(null); setText(e.target.value); }} />
      </TextWorkspace>
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
      </div>
    </ToolShell>
  );
}
