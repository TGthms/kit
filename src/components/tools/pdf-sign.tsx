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
import { ActionBar, ToolLimits, ToolShell, useToolHistory } from "./shared";

export function PdfSign() {
  const t = useTranslations("tools.pdf-sign");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-sign");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("");
  const job = useToolJob([files, text]);
  const loading = job.loading;

  const run = async () => {
    if (!files[0] || !text.trim()) return;
    const ac = job.start();
    try {
      const { stampPdfSignature } = await import("@/lib/pdf/core");
      const out = await stampPdfSignature(await files[0].file.arrayBuffer(), text.trim());
      if (!job.complete(ac, [{ blob: bytesToBlob(out, "application/pdf"), name: "signed.pdf" }])) return;
      toast.success(t("success"));
      log("sign", "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="pdf-sign">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <Field className="space-y-2" label={t("signature")}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} />
      </Field>
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files[0] || !text.trim()} />
      <FileJobResult job={job} />
    </ToolShell>
  );
}
