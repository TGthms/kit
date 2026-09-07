"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { downloadMany, extensionForMime } from "@/lib/utils";
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
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items = [];
      for (const f of files) {
        const blob = await adjustImage(f.file, { brightness, contrast, saturation });
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-adjusted.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "adjusted-images.zip");
      toast.success(t("success", { count: files.length }));
      log("adjusted", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-adjust">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      {(
        [
          [t("brightness"), brightness, setBrightness],
          [t("contrast"), contrast, setContrast],
          [t("saturation"), saturation, setSaturation],
        ] as const
      ).map(([label, val, set]) => (
        <div key={label} className="space-y-2">
          <Label>
            {label}: {val}%
          </Label>
          <Slider value={[val]} min={0} max={200} step={1} onValueChange={(v) => set(v[0])} />
        </div>
      ))}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}
