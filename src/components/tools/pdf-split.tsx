"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { bytesToBlob } from "@/lib/utils";
import { ActionBar, ToolShell, useToolHistory } from "./shared";
import { splitPdf } from "@/lib/pdf/core";

export function PdfSplit() {
  const t = useTranslations("tools.pdf-split");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-split");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [range, setRange] = useState("1-1");
  const job = useToolJob([files, range]);
  const loading = job.loading;

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const out = await splitPdf(await files[0].file.arrayBuffer(), range);
      if (!job.complete(ac, [{ blob: bytesToBlob(out, "application/pdf"), name: "split.pdf" }])) return;
      toast.success(t("success"));
      log("completed", "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="pdf-split">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <Field className="space-y-2" label={t("range")}>
        <Input value={range} onChange={(e) => setRange(e.target.value)} />
      </Field>
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
      <FileJobResult job={job} />
    </ToolShell>
  );
}
