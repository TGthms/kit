"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { flattenPdfForms } from "@/lib/pdf/core";
import { ActionBar, ToolLimits, ToolShell, useToolHistory } from "./shared";

export function PdfFlatten() {
  const t = useTranslations("tools.pdf-flatten");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-flatten");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const { bytes, fieldCount } = await flattenPdfForms(await files[0].file.arrayBuffer());
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "flattened.pdf");
      toast.success(t("success", { count: fieldCount }));
      log(`${fieldCount} fields`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-flatten">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}
