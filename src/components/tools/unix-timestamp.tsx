"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { nowTimestamp, parseTimestamp } from "@/lib/text/timestamp";
import { ToolShell, useToolHistory } from "./shared";

export function UnixTimestamp() {
  const t = useTranslations("tools.unix-timestamp");
  const tc = useTranslations("common");
  const log = useToolHistory("unix-timestamp");
  const [value, setValue] = useState(() => String(nowTimestamp().unix));
  const parsed = parseTimestamp(value);

  return (
    <ToolShell toolId="unix-timestamp">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setValue(String(nowTimestamp().unix));
            log("now", "success");
          }}
        >
          {t("now")}
        </Button>
      </div>
      <Field label={tc("input")}>
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
      </Field>
      {parsed.ok ? (
        <div className="space-y-1 rounded-2xl border bg-card p-4 text-sm">
          <p>
            <strong>Unix</strong> {parsed.unix}
          </p>
          <p>
            <strong>ISO</strong> {parsed.iso}
          </p>
          <p>
            <strong>UTC</strong> {parsed.utc}
          </p>
          <p>
            <strong>Local</strong> {parsed.local}
          </p>
          <CopyButton value={parsed.iso} label={`${tc("copy")} ISO`} />
        </div>
      ) : (
        <p className="text-sm text-destructive">{parsed.error}</p>
      )}
    </ToolShell>
  );
}
