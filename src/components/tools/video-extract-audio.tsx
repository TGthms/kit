"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Progress } from "@/components/ui/progress";
import { bytesToBlob } from "@/lib/utils";
import { videoExtractAudioArgs } from "@/lib/media/ffmpeg-args";
import { ActionBar, ToolShell, useToolHistory, loadFfmpeg } from "./shared";

export function VideoExtractAudio() {
  const t = useTranslations("tools.video-extract-audio");
  const tc = useTranslations("common");
  const log = useToolHistory("video-extract-audio");
  const [files, setFiles] = useState<FileItem[]>([]);
  const job = useToolJob([files]);

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const input = `input.${ext}`;
      const output = "audio.mp3";
      const { runFFmpeg } = await loadFfmpeg();
      const out = await runFFmpeg(
        input,
        data,
        output,
        videoExtractAudioArgs(input, output),
        (p) => job.report(ac, Math.round(p * 100)),
        ac.signal
      );
      if (!job.complete(ac, [{ blob: bytesToBlob(out, "audio/mpeg"), name: output }])) return;
      toast.success(t("success"));
      log("completed", "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      if (e instanceof DOMException && e.name === "AbortError") {
        toast.error(tc("cancel"));
      } else {
        toast.error(e instanceof Error ? e.message : tc("error"));
        log("failed", "failed");
      }
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="video-extract-audio">
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
      {job.loading && <Progress value={job.progress} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files[0]}
        onCancel={job.cancel}
      />
      <FileJobResult job={job} />
    </ToolShell>
  );
}
