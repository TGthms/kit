"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { xmlToJsonText, jsonToXmlText } from "@/lib/text/xml";
import { ToolShell, useToolHistory } from "./shared";

export function XmlJson() {
  const t = useTranslations("tools.xml-json");
  const log = useToolHistory("xml-json");
  const [input, setInput] = useState("<note><to>Kit</to></note>");
  const [toJson, setToJson] = useState(true);

  const run = () => {
    const r = toJson ? xmlToJsonText(input) : jsonToXmlText(input, "root");
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log(toJson ? "xml→json" : "json→xml", "success");
  };

  return (
    <ToolShell toolId="xml-json">
      <div className="flex gap-2">
        <Button variant={toJson ? "default" : "outline"} onClick={() => setToJson(true)}>
          {t("toJson")}
        </Button>
        <Button variant={!toJson ? "default" : "outline"} onClick={() => setToJson(false)}>
          {t("toXml")}
        </Button>
      </div>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
