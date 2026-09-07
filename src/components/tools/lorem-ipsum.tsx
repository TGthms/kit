"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateLorem, type LoremMode } from "@/lib/text/lorem";
import { ToolShell, useToolHistory } from "./shared";
import { selectClass } from "./text-extra-shared";

export function LoremIpsum() {
  const t = useTranslations("tools.lorem-ipsum");
  const log = useToolHistory("lorem-ipsum");
  const [count, setCount] = useState(2);
  const [mode, setMode] = useState<LoremMode>("paragraphs");
  const [out, setOut] = useState("");

  const run = () => {
    const text = generateLorem(count, mode);
    setOut(text);
    toast.success(t("success"));
    log(`${mode}:${count}`, "success");
  };

  return (
    <ToolShell toolId="lorem-ipsum">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("count")}</Label>
          <Input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} />
        </div>
        <div className="space-y-2">
          <Label>{t("mode")}</Label>
          <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as LoremMode)}>
            <option value="paragraphs">{t("paragraphs")}</option>
            <option value="sentences">{t("sentences")}</option>
            <option value="words">{t("words")}</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <CopyButton value={out} disabled={!out} />
      </div>
      {out ? <Textarea value={out} readOnly className="min-h-48" /> : null}
    </ToolShell>
  );
}
