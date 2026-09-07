"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { csvToJson, jsonToCsv } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function CsvJson() {
  const t = useTranslations("tools.csv-json");
  const log = useToolHistory("csv-json");
  const [input, setInput] = useState("name,role\nKit,toolkit\n");
  const [toJson, setToJson] = useState(true);
  const run = () => {
    const r = toJson ? csvToJson(input) : jsonToCsv(input);
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setInput(r.text);
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
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
