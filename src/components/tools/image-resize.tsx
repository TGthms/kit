"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { extensionForMime } from "@/lib/utils";
import { resizeImage } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ImageResize() {
  const t = useTranslations("tools.image-resize");
  const tc = useTranslations("common");
  const log = useToolHistory("image-resize");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(0);
  const [lock, setLock] = useState(true);
  const job = useToolJob([files, width, height, lock]);
  const loading = job.loading;

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    try {
      const items = [];
      for (const f of files) {
        if (ac.signal.aborted) return;
        const blob = await resizeImage(f.file, { width, height, lockAspect: lock });
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-resized.${extensionForMime(blob.type, "png")}`,
        });
      }
      if (!job.complete(ac, items)) return;
      toast.success(t("success", { count: files.length }));
      log(`${width}x${height}`, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="image-resize" result={<FileJobResult job={job} original={files[0]?.file} />}>
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="grid grid-cols-2 gap-4">
        <Field className="space-y-2" label={tc("width")}>
          <Input type="number" min={0} value={width} onChange={(e) => setWidth(Number(e.target.value) || 0)} />
        </Field>
        <Field className="space-y-2" label={tc("height")}>
          <Input type="number" min={0} value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} />
        </Field>
        <div className="col-span-2 flex items-center gap-2">
          <Switch checked={lock} onCheckedChange={setLock} id="lock" />
          <Label htmlFor="lock">{t("lockAspect")}</Label>
        </div>
      </div>
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files.length} />

    </ToolShell>
  );
}
