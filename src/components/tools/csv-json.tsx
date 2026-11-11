"use client";
import { TextWorkspace } from "./text-workspace";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { csvToJson, jsonToCsv } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function CsvJson() {
  const fieldText = useTranslations("common");
  const t = useTranslations("tools.csv-json");
  const log = useToolHistory("csv-json");
  const [input, setInput] = useState("name,role\nKit,toolkit\n");
  const [spreadsheetSafe, setSpreadsheetSafe] = useState(true);
  const [toJson, setToJson] = useState(true);
  const [derived, setDerived] = useState<{ key: string; text: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const sourceKey = input + String(toJson) + String(spreadsheetSafe);
  const output = derived?.key === sourceKey ? derived.text : null;
  const run = () => {
    const r = toJson ? csvToJson(input) : jsonToCsv(input, spreadsheetSafe);
    if (!r.ok) {
      setFailure(r.error);
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setDerived({ key: sourceKey, text: r.text });
    setFailure(null);
    toast.success(t("success"));
    log(toJson ? "csv→json" : "json→csv", "success");
  };
  return (
    <ToolShell toolId="csv-json">
      <div className="flex gap-2">
        <Button variant={toJson ? "default" : "outline"} onClick={() => setToJson(true)}>
          {t("toJson")}
        </Button>
        <Button variant={!toJson ? "default" : "outline"} onClick={() => setToJson(false)}>
          {t("toCsv")}
        </Button>
      </div>
      {!toJson && <label className="flex items-center gap-3 text-sm"><Switch checked={spreadsheetSafe} onCheckedChange={setSpreadsheetSafe} />{fieldText("spreadsheetSafe")}</label>}
      <TextWorkspace output={output} error={failure} filename="converted.txt">
      <Textarea aria-label={fieldText("input")} value={input} onChange={(e) => { setFailure(null); setInput(e.target.value); }} className="min-h-64" />
      </TextWorkspace>
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
