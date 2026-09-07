"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateUuids } from "@/lib/text/uuid";
import { ToolShell, useToolHistory } from "./shared";
import { selectClass } from "./text-extra-shared";

export function UuidGenerator() {
  const t = useTranslations("tools.uuid-generator");
  const log = useToolHistory("uuid-generator");
  const [count, setCount] = useState(5);
  const [version, setVersion] = useState<4 | 7>(4);
  const [out, setOut] = useState("");

  const run = () => {
    const list = generateUuids(count, version);
    setOut(list.join("\n"));
    toast.success(t("success"));
    log(`v${version}×${count}`, "success");
  };

  return (
    <ToolShell toolId="uuid-generator">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("count")}>
          <Input type="number" min={1} max={1000} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} />
        </Field>
        <Field label={t("version")}>
          <select
            className={selectClass}
            value={version}
            onChange={(e) => setVersion(Number(e.target.value) as 4 | 7)}
          >
            <option value={4}>UUID v4</option>
            <option value={7}>UUID v7</option>
          </select>
        </Field>
      </div>
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <CopyButton value={out} disabled={!out} />
      </div>
      {out ? <Textarea value={out} readOnly className="min-h-40 font-mono" /> : null}
    </ToolShell>
  );
}
