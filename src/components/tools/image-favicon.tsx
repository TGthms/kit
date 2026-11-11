"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";

import { exportFavicons } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ImageFavicon() {
  const t = useTranslations("tools.image-favicon");
  const tc = useTranslations("common");
  const log = useToolHistory("image-favicon");
  const [files, setFiles] = useState<FileItem[]>([]);
  const job = useToolJob([files]);
  const loading = job.loading;

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const items = await exportFavicons(files[0].file);
      if (!job.complete(ac, items)) return;
      toast.success(t("success"));
      log(`${items.length} sizes`, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="image-favicon" result={<FileJobResult job={job} />}>
      <p className="text-sm text-muted-foreground">{t("note")}</p>
      <FileDropzone accept="image/*" multiple={false} files={files} onChange={setFiles} />
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />

    </ToolShell>
  );
}
