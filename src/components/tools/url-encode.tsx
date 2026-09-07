"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { urlEncode, urlDecode } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function UrlEncodeTool() {
  const t = useTranslations("tools.url-encode");
  const tc = useTranslations("common");
  const log = useToolHistory("url-encode");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [text, setText] = useState("hello world");

  const run = () => {
    try {
      setText(mode === "encode" ? urlEncode(text) : urlDecode(text));
      toast.success(t("success"));
      log(mode, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="url-encode">
      <div className="flex gap-2">
        <Button variant={mode === "encode" ? "default" : "outline"} onClick={() => setMode("encode")}>
          {tc("encode")}
        </Button>
        <Button variant={mode === "decode" ? "default" : "outline"} onClick={() => setMode("decode")}>
          {tc("decode")}
        </Button>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
