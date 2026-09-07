"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { findReplace, sortLines, uniqueLines } from "@/lib/text/lines";
import { ToolShell, useToolHistory } from "./shared";

export function TextLines() {
  const t = useTranslations("tools.text-lines");
  const log = useToolHistory("text-lines");
  const [text, setText] = useState("banana\napple\nbanana\nCherry\n10\n2");
  const [find, setFind] = useState("banana");
  const [replace, setReplace] = useState("orange");
  const [caseInsensitive, setCaseInsensitive] = useState(false);

  const apply = (next: string, summary: string) => {
    setText(next);
    log(summary, "success");
    toast.success(t("success"));
  };

  return (
    <ToolShell toolId="text-lines">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-48 font-mono" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("find")}>
          <Input value={find} onChange={(e) => setFind(e.target.value)} />
        </Field>
        <Field label={t("replace")}>
          <Input value={replace} onChange={(e) => setReplace(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={caseInsensitive} onChange={(e) => setCaseInsensitive(e.target.checked)} className="h-4 w-4 rounded border" />
        {t("caseInsensitive")}
      </label>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => apply(findReplace(text, find, replace, { all: true, caseInsensitive }), "replace")}>{t("runReplace")}</Button>
        <Button variant="outline" onClick={() => apply(sortLines(text), "sort")}>{t("sort")}</Button>
        <Button variant="outline" onClick={() => apply(sortLines(text, { reverse: true }), "sort-desc")}>{t("sortDesc")}</Button>
        <Button variant="outline" onClick={() => apply(sortLines(text, { numeric: true }), "sort-num")}>{t("sortNumeric")}</Button>
        <Button variant="outline" onClick={() => apply(uniqueLines(text, { keepOrder: true }), "unique")}>{t("unique")}</Button>
        <CopyButton value={text} disabled={!text} />
      </div>
    </ToolShell>
  );
}
