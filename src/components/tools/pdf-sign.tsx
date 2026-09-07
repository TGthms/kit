"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { ActionBar, ToolLimits, ToolShell, useToolHistory } from "./shared";

export function PdfSign() {
  const t = useTranslations("tools.pdf-sign");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-sign");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0] || !text.trim()) return;
    setLoading(true);
    try {
      const { stampPdfSignature } = await import("@/lib/pdf/core");
      const out = await stampPdfSignature(await files[0].file.arrayBuffer(), text.trim());
      downloadBlob(bytesToBlob(out, "application/pdf"), "signed.pdf");
      toast.success(t("success"));
      log("sign", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-sign">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("signature")}</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0] || !text.trim()} />
    </ToolShell>
  );
}
