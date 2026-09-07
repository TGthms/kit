"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { decodeHtmlEntities, encodeHtmlEntities } from "@/lib/text/entities";
import { ToolShell, useToolHistory } from "./shared";

export function HtmlEntities() {
  const t = useTranslations("tools.html-entities");
  const log = useToolHistory("html-entities");
  const [text, setText] = useState("<Hello & goodbye>");
  const [encode, setEncode] = useState(true);

  const run = () => {
    setText(encode ? encodeHtmlEntities(text) : decodeHtmlEntities(text));
    toast.success(t("success"));
    log(encode ? "enc" : "dec", "success");
  };

  return (
    <ToolShell toolId="html-entities">
      <div className="flex gap-2">
        <Button variant={encode ? "default" : "outline"} onClick={() => setEncode(true)}>
          {t("encode")}
        </Button>
        <Button variant={!encode ? "default" : "outline"} onClick={() => setEncode(false)}>
          {t("decode")}
        </Button>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-40 font-mono" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
