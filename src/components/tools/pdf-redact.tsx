"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { bytesToBlob } from "@/lib/utils";
import { ActionBar, ToolLimits, ToolShell, useToolHistory } from "./shared";
import { coverPdfContent } from "@/lib/pdf/core";
import { PdfCoverEditor, type CoverBox } from "./pdf-cover-editor";

export function PdfRedact() {
  const t = useTranslations("tools.pdf-redact");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-redact");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [boxes, setBoxes] = useState<CoverBox[]>([]);
  const job = useToolJob([files, boxes]);
  const loading = job.loading;

  const run = async () => {
    if (!files[0] || !boxes.length) return;
    const ac = job.start();
    try {
      const out = await coverPdfContent(await files[0].file.arrayBuffer(), boxes);
      if (!job.complete(ac, [{ blob: bytesToBlob(out, "application/pdf"), name: "covered.pdf" }])) return;
      toast.success(t("success"));
      log(`${boxes.length} boxes`, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="pdf-redact">
      <p className="text-sm text-amber-800 dark:text-amber-300">{t("note")}</p>
      <ToolLimits>
        <p>{t("note")}</p>
      </ToolLimits>
      <FileDropzone
        accept="application/pdf"
        multiple={false}
        files={files}
        onChange={(items) => {
          setFiles(items);
          setBoxes([]);
        }}
      />
      <PdfCoverEditor file={files[0]} boxes={boxes} onChange={setBoxes} />
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files[0] || !boxes.length} />
      <FileJobResult job={job} />
    </ToolShell>
  );
}
