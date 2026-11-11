"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { extensionForMime } from "@/lib/utils";
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
  const job = useToolJob([files, text, position]);
  const loading = job.loading;

  const run = async () => {
    if (!files.length || !text.trim()) return;
    const ac = job.start();
    try {
      const items = [];
      for (const f of files) {
        if (ac.signal.aborted) return;
        const blob = await watermarkImage(f.file, { text: text.trim(), position });
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-marked.${extensionForMime(blob.type, "png")}`,
        });
      }
      if (!job.complete(ac, items)) return;
      toast.success(t("success", { count: files.length }));
      log(position, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="image-watermark" result={<FileJobResult job={job} original={files[0]?.file} />}>
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <Field className="space-y-2" label={t("text")}>
        <Input value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <Field className="space-y-2" label={t("position")}>
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
      </Field>
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files.length || !text.trim()} />

    </ToolShell>
  );
}
