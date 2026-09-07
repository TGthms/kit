"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadMany, extensionForMime } from "@/lib/utils";
import { watermarkImage } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";
import { selectClass } from "./image-extra-shared";

export function ImageWatermark() {
  const t = useTranslations("tools.image-watermark");
  const tc = useTranslations("common");
  const log = useToolHistory("image-watermark");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("");
  const [position, setPosition] = useState<"center" | "bottom-right" | "bottom-left" | "top-right">(
    "bottom-right"
  );
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length || !text.trim()) return;
    setLoading(true);
    try {
      const items = [];
      for (const f of files) {
        const blob = await watermarkImage(f.file, { text: text.trim(), position });
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-marked.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "watermarked-images.zip");
      toast.success(t("success", { count: files.length }));
      log(position, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-watermark">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("text")}</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t("position")}</Label>
        <select
          className={selectClass}
          value={position}
          onChange={(e) => setPosition(e.target.value as typeof position)}
        >
          <option value="bottom-right">{t("bottomRight")}</option>
          <option value="bottom-left">{t("bottomLeft")}</option>
          <option value="top-right">{t("topRight")}</option>
          <option value="center">{t("center")}</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length || !text.trim()} />
    </ToolShell>
  );
}
