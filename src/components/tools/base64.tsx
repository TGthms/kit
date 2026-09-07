"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob, downloadText, formatBytes } from "@/lib/utils";
import { encodeBase64Text, decodeBase64Text, fileToBase64, base64ToBlob } from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function Base64Tool() {
  const t = useTranslations("tools.base64");
  const tc = useTranslations("common");
  const log = useToolHistory("base64");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [kind, setKind] = useState<"text" | "file">("text");
  const [text, setText] = useState("Hello Kit");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [out, setOut] = useState("");

  const run = async () => {
    try {
      if (kind === "text") {
        const r = mode === "encode" ? encodeBase64Text(text) : decodeBase64Text(text);
        setOut(r);
        setText(r);
      } else if (files[0]) {
        if (mode === "encode") {
          const b64 = await fileToBase64(files[0].file);
          setOut(b64);
          downloadText(b64, files[0].file.name + ".b64.txt");
        } else {
          const blob = base64ToBlob(text);
          downloadBlob(blob, "decoded.bin");
          setOut(`Decoded ${formatBytes(blob.size)}`);
        }
      }
      toast.success(t("success"));
      log(`${mode}/${kind}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="base64">
      <div className="flex flex-wrap gap-2">
        <Button variant={mode === "encode" ? "default" : "outline"} onClick={() => setMode("encode")}>
          {tc("encode")}
        </Button>
        <Button variant={mode === "decode" ? "default" : "outline"} onClick={() => setMode("decode")}>
          {tc("decode")}
        </Button>
        <Button variant={kind === "text" ? "default" : "outline"} onClick={() => setKind("text")}>
          {t("textMode")}
        </Button>
        <Button variant={kind === "file" ? "default" : "outline"} onClick={() => setKind("file")}>
          {t("fileMode")}
        </Button>
      </div>
      {kind === "file" ? (
        <FileDropzone multiple={false} files={files} onChange={setFiles} />
      ) : null}
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-40" />
      {out && kind === "file" && mode === "encode" && (
        <Textarea value={out} readOnly className="min-h-32" />
      )}
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}
