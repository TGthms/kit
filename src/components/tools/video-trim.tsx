"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { MediaTimeline } from "@/components/shared/media-timeline";
import { trimArgs } from "@/lib/media/ffmpeg-args";
import { ActionBar, ToolShell, useToolHistory, useToolJob, loadFfmpeg } from "./shared";
import { clampMediaTimes } from "./video-shared";

export function VideoTrim() {
  const t = useTranslations("tools.video-trim");
  const tc = useTranslations("common");
  const log = useToolHistory("video-trim");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [duration, setDuration] = useState(0);
  const job = useToolJob();
  const setRange = (nextStart: number, nextEnd: number, dur = duration) => {
    const next = clampMediaTimes(nextStart, nextEnd, dur);
    setStart(next.start);
    setEnd(next.end);
  };

  const run = async () => {
    const range = clampMediaTimes(start, end, duration);
    if (!files[0] || !(range.end > range.start)) {
      toast.error(tc("error"));
      return;
    }
    const ac = job.start();
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const input = `input.${ext}`;
      const output = `trim.${ext}`;
      const { runFFmpeg } = await loadFfmpeg();
      const out = await runFFmpeg(
        input,
        data,
        output,
        trimArgs(input, output, range.start, range.end),
        (p) => job.setProgress(Math.round(p * 100)),
        ac.signal
      );
      downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      toast.success(t("success"));
      log("completed", "success");
    } catch (e) {
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
    <ToolShell toolId="video-trim">
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
      <MediaTimeline
        file={files[0]?.file ?? null}
        start={start}
        end={end}
        onChange={(a, b) => setRange(a, b)}
        onDuration={(dur) => {
          setDuration(dur);
          setRange(start, end, dur);
        }}
        startLabel={tc("start")}
        endLabel={tc("end")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            {tc("start")} (s)
          </Label>
          <Input
            value={start}
            onChange={(e) => setRange(Number(e.target.value) || 0, end)}
            inputMode="decimal"
          />
        </div>
        <div className="space-y-2">
          <Label>
            {tc("end")} (s)
          </Label>
          <Input
            value={end}
            onChange={(e) => setRange(start, Number(e.target.value) || 0)}
            inputMode="decimal"
          />
        </div>
      </div>
      {job.loading && <Progress value={job.progress} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files[0]}
        onCancel={job.cancel}
      />
    </ToolShell>
  );
}
