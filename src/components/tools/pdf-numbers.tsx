"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadMany, bytesToBlob } from "@/lib/utils";
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
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items: Array<{ blob: Blob; name: string }> = [];
      for (const f of files) {
        const out = await numberPdfPages(await f.file.arrayBuffer(), { template, position, start });
        items.push({
          blob: bytesToBlob(out, "application/pdf"),
          name: f.file.name.replace(/\.pdf$/i, "") + "-numbered.pdf",
        });
      }
      await downloadMany(items, "numbered-pdfs.zip");
      toast.success(t("success"));
      log(template, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-numbers">
      <FileDropzone accept="application/pdf" files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("template")}</Label>
          <Input value={template} onChange={(e) => setTemplate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("start")}</Label>
          <Input type="number" min={1} value={start} onChange={(e) => setStart(Number(e.target.value) || 1)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("position")}</Label>
        <select className={selectClass} value={position} onChange={(e) => setPosition(e.target.value as PageNumberPosition)}>
          <option value="header-left">{t("headerLeft")}</option>
          <option value="header-center">{t("headerCenter")}</option>
          <option value="header-right">{t("headerRight")}</option>
          <option value="footer-left">{t("footerLeft")}</option>
          <option value="footer-center">{t("footerCenter")}</option>
          <option value="footer-right">{t("footerRight")}</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}
