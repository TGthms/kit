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
import { numberPdfPages, type PageNumberPosition } from "@/lib/pdf/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PdfNumbers() {
  const t = useTranslations("tools.pdf-numbers");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-numbers");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [template, setTemplate] = useState("{page} / {pages}");
  const [position, setPosition] = useState<PageNumberPosition>("footer-center");
  const [start, setStart] = useState(1);
  const job = useToolJob([files, template, position, start]);
  const loading = job.loading;

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    try {
      const items: Array<{ blob: Blob; name: string }> = [];
      for (const f of files) {
        if (ac.signal.aborted) return;
        const out = await numberPdfPages(await f.file.arrayBuffer(), { template, position, start });
        items.push({
          blob: bytesToBlob(out, "application/pdf"),
          name: f.file.name.replace(/\.pdf$/i, "") + "-numbered.pdf",
        });
      }
      if (!job.complete(ac, items)) return;
      toast.success(t("success"));
      log(template, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="pdf-numbers">
      <FileDropzone accept="application/pdf" files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field className="space-y-2 sm:col-span-2" label={t("template")}>
          <Input value={template} onChange={(e) => setTemplate(e.target.value)} />
        </Field>
        <Field className="space-y-2" label={t("start")}>
          <Input type="number" min={1} value={start} onChange={(e) => setStart(Number(e.target.value) || 1)} />
        </Field>
      </div>
      <Field className="space-y-2" label={t("position")}>
        <select className={selectClass} value={position} onChange={(e) => setPosition(e.target.value as PageNumberPosition)}>
          <option value="header-left">{t("headerLeft")}</option>
          <option value="header-center">{t("headerCenter")}</option>
          <option value="header-right">{t("headerRight")}</option>
          <option value="footer-left">{t("footerLeft")}</option>
          <option value="footer-center">{t("footerCenter")}</option>
          <option value="footer-right">{t("footerRight")}</option>
        </select>
      </Field>
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
      <FileJobResult job={job} />
    </ToolShell>
  );
}
