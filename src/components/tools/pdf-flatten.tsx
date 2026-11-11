"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { bytesToBlob } from "@/lib/utils";
import { flattenPdfForms } from "@/lib/pdf/core";
import { ActionBar, ToolLimits, ToolShell, useToolHistory } from "./shared";

export function PdfFlatten() {
  const t = useTranslations("tools.pdf-flatten");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-flatten");
  const [files, setFiles] = useState<FileItem[]>([]);
  const job = useToolJob([files]);
  const loading = job.loading;

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const { bytes, fieldCount } = await flattenPdfForms(await files[0].file.arrayBuffer());
      if (!job.complete(ac, [{ blob: bytesToBlob(bytes, "application/pdf"), name: "flattened.pdf" }])) return;
      toast.success(t("success", { count: fieldCount }));
      log(`${fieldCount} fields`, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="pdf-flatten">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
      <FileJobResult job={job} />
    </ToolShell>
  );
}
