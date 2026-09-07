"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { ActionBar, ToolShell, useToolHistory } from "./shared";
import { splitPdf } from "@/lib/pdf/core";

export function PdfSplit() {
  const t = useTranslations("tools.pdf-split");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-split");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [range, setRange] = useState("1-1");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const out = await splitPdf(await files[0].file.arrayBuffer(), range);
      downloadBlob(bytesToBlob(out, "application/pdf"), "split.pdf");
      toast.success(t("success"));
      log("completed", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-split">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("range")}</Label>
        <Input value={range} onChange={(e) => setRange(e.target.value)} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}
