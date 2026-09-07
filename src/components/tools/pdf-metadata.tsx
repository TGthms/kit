"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { getPdfMetadata, setPdfMetadata, stripPdfMetadata, type PdfMeta } from "@/lib/pdf/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

const emptyMeta = (): PdfMeta => ({
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
});

export function PdfMetadata() {
  const t = useTranslations("tools.pdf-metadata");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-metadata");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [meta, setMeta] = useState<PdfMeta>(emptyMeta());
  const [loading, setLoading] = useState(false);

  const onFiles = async (items: FileItem[]) => {
    setFiles(items);
    if (!items[0]) {
      setMeta(emptyMeta());
      return;
    }
    try {
      setMeta(await getPdfMetadata(await items[0].file.arrayBuffer()));
    } catch {
      setMeta(emptyMeta());
    }
  };

  const save = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const out = await setPdfMetadata(await files[0].file.arrayBuffer(), meta);
      downloadBlob(bytesToBlob(out, "application/pdf"), "metadata.pdf");
      toast.success(t("saved"));
      log("edit", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  const strip = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const out = await stripPdfMetadata(await files[0].file.arrayBuffer());
      downloadBlob(bytesToBlob(out, "application/pdf"), "metadata-stripped.pdf");
      toast.success(t("stripped"));
      log("strip", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-metadata">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={onFiles} />
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["title", meta.title],
            ["author", meta.author],
            ["subject", meta.subject],
            ["keywords", meta.keywords],
            ["creator", meta.creator],
            ["producer", meta.producer],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <Label>{t(key)}</Label>
            <Input
              value={value}
              onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionBar onRun={save} loading={loading} label={t("run")} disabled={!files[0]} />
        <button
          type="button"
          className="text-sm text-primary underline-offset-4 hover:underline"
          onClick={strip}
          disabled={!files[0] || loading}
        >
          {t("strip")}
        </button>
      </div>
    </ToolShell>
  );
}
