"use client";
import { TextWorkspace } from "./text-workspace";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { decodeHtmlEntities, encodeHtmlEntities } from "@/lib/text/entities";
import { ToolShell, useToolHistory } from "./shared";

export function HtmlEntities() {
  const fieldText = useTranslations("common");
  const t = useTranslations("tools.html-entities");
  const log = useToolHistory("html-entities");
  const [text, setText] = useState("<Hello & goodbye>");
  const [encode, setEncode] = useState(true);

  const [derived, setDerived] = useState<{ key: string; text: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const sourceKey = text + String(encode);
  const output = derived?.key === sourceKey ? derived.text : null;
  const run = () => {
    setDerived({ key: sourceKey, text: encode ? encodeHtmlEntities(text) : decodeHtmlEntities(text) });
    setFailure(null);
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
      <TextWorkspace output={output} error={failure} filename="converted.txt">
      <Textarea aria-label={fieldText("input")} value={text} onChange={(e) => { setFailure(null); setText(e.target.value); }} className="min-h-40 font-mono" />
      </TextWorkspace>
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
