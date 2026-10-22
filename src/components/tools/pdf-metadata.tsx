"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { getPdfMetadata, setPdfMetadata, stripPdfMetadata, type PdfMeta } from "@/lib/pdf/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";
import { useTaskScope } from "@/lib/react/task-scope";

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
  const [reading, setReading] = useState(false);
  const [ready, setReady] = useState(false);
  const source = useTaskScope();

  const onFiles = async (items: FileItem[]) => {
    const current = source.begin();
    setFiles(items);
    setMeta(emptyMeta());
    setReady(false);
    setLoading(false);
    setReading(Boolean(items[0]));
    if (!items[0]) {
      setMeta(emptyMeta());
      return;
    }
    try {
      const next = await getPdfMetadata(await items[0].file.arrayBuffer());
      if (!current()) return;
      setMeta(next);
      setReady(true);
    } catch (error) {
      if (current()) toast.error(error instanceof Error ? error.message : tc("error"));
    } finally {
      if (current()) setReading(false);
    }
  };

  const save = async () => {
    if (!files[0] || !ready || loading) return;
    const current = source.capture();
    setLoading(true);
    try {
      const out = await setPdfMetadata(await files[0].file.arrayBuffer(), meta);
      if (!current()) return;
      downloadBlob(bytesToBlob(out, "application/pdf"), "metadata.pdf");
      toast.success(t("saved"));
      log("edit", "success");
    } catch (e) {
      if (!current()) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      if (current()) setLoading(false);
    }
  };

  const strip = async () => {
    if (!files[0] || !ready || loading) return;
    const current = source.capture();
    setLoading(true);
    try {
      const out = await stripPdfMetadata(await files[0].file.arrayBuffer());
      if (!current()) return;
      downloadBlob(bytesToBlob(out, "application/pdf"), "metadata-stripped.pdf");
      toast.success(t("stripped"));
      log("strip", "success");
    } catch (e) {
      if (!current()) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      if (current()) setLoading(false);
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
          <Field key={key} className="space-y-2" label={t(key)}>
            <Input
              disabled={!ready || loading}
              value={value}
              onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))}
            />
          </Field>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionBar onRun={save} loading={loading} label={t("run")} disabled={!ready} status={reading ? tc("loading") : undefined} />
        <button
          type="button"
          className="text-sm text-primary underline-offset-4 hover:underline"
          onClick={strip}
          disabled={!ready || loading}
        >
          {t("strip")}
        </button>
      </div>
    </ToolShell>
  );
}
