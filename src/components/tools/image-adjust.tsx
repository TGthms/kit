"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Field } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { extensionForMime } from "@/lib/utils";
import { adjustImage } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ImageAdjust() {
  const t = useTranslations("tools.image-adjust");
  const tc = useTranslations("common");
  const log = useToolHistory("image-adjust");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const job = useToolJob([files, brightness, contrast, saturation]);
  const loading = job.loading;

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    try {
      const items = [];
      for (const f of files) {
        if (ac.signal.aborted) return;
        const blob = await adjustImage(f.file, { brightness, contrast, saturation });
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-adjusted.${extensionForMime(blob.type, "png")}`,
        });
      }
      if (!job.complete(ac, items)) return;
      toast.success(t("success", { count: files.length }));
      log("adjusted", "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="image-adjust" result={<FileJobResult job={job} original={files[0]?.file} />}>
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      {(
        [
          [t("brightness"), brightness, setBrightness],
          [t("contrast"), contrast, setContrast],
          [t("saturation"), saturation, setSaturation],
        ] as const
      ).map(([label, val, set]) => (
        <Field key={label} className="space-y-2" label={<>{label}: {val}%</>}>
          <Slider aria-label={label} value={[val]} min={0} max={200} step={1} onValueChange={(v) => set(v[0])} />
        </Field>
      ))}
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files.length} />

    </ToolShell>
  );
}
