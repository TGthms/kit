"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { generatePassword } from "@/lib/text/password";
import { ToolShell, useToolHistory } from "./shared";

export function PasswordGenerator() {
  const t = useTranslations("tools.password-generator");
  const tc = useTranslations("common");
  const log = useToolHistory("password-generator");
  const [length, setLength] = useState(20);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [out, setOut] = useState("");

  const run = () => {
    try {
      const pw = generatePassword({ length, lower, upper, digits, symbols });
      setOut(pw);
      toast.success(t("success"));
      log(String(length), "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="password-generator">
      <div className="space-y-2">
        <Label htmlFor="password-length">{t("length")}</Label>
        <Input id="password-length" type="number" min={4} max={128} value={length} onChange={(e) => setLength(Number(e.target.value) || 16)} />
      </div>
      {(
        [
          ["lower", lower, setLower],
          ["upper", upper, setUpper],
          ["digits", digits, setDigits],
          ["symbols", symbols, setSymbols],
        ] as const
      ).map(([key, val, set]) => (
        <div key={key} className="flex items-center gap-2">
          <Switch checked={val} onCheckedChange={set} id={key} />
          <Label htmlFor={key}>{t(key)}</Label>
        </div>
      ))}
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <CopyButton value={out} disabled={!out} />
      </div>
      {out ? <Input readOnly value={out} className="font-mono" /> : null}
    </ToolShell>
  );
}
