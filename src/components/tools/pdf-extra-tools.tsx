"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import JSZip from "jszip";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob, downloadMany, bytesToBlob } from "@/lib/utils";
import {
  numberPdfPages,
  flattenPdfForms,
  getPdfMetadata,
  setPdfMetadata,
  stripPdfMetadata,
  type PageNumberPosition,
  type PdfMeta,
} from "@/lib/pdf/core";
import { lockPdf, unlockPdf } from "@/lib/pdf/protect";
import { ActionBar, ToolLimits, ToolShell, useToolHistory, useToolJob, loadPdfjs } from "./shared";
import { Progress } from "@/components/ui/progress";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

export function PdfToImages() {
  const t = useTranslations("tools.pdf-to-images");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-to-images");
  const [files, setFiles] = useState<FileItem[]>([]);
  const job = useToolJob();

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const { renderPdfPagesToBlobs } = await loadPdfjs();
      const raster = await renderPdfPagesToBlobs(await files[0].file.arrayBuffer(), {
        mime: "image/jpeg",
        scale: 1.6,
        signal: ac.signal,
        onProgress: (ratio) => job.setProgress(Math.round(ratio * 100)),
      });
      if (raster.truncated) {
        toast.warning(tc("pdfPageCap", { total: raster.totalPages, processed: raster.processedPages }));
      }
      const zip = new JSZip();
      raster.blobs.forEach((blob: Blob, i: number) => zip.file(`page-${String(i + 1).padStart(3, "0")}.jpg`, blob));
      downloadBlob(await zip.generateAsync({ type: "blob" }), "pdf-pages.zip");
      toast.success(t("success", { count: raster.blobs.length }));
      log(`${raster.blobs.length} pages`, "success");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") toast.error(tc("cancel"));
      else toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop();
    }
  };

  return (
    <ToolShell toolId="pdf-to-images">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      {job.loading && <Progress value={job.progress} aria-label={t("run")} />}
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

export function PdfFlatten() {
  const t = useTranslations("tools.pdf-flatten");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-flatten");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const { bytes, fieldCount } = await flattenPdfForms(await files[0].file.arrayBuffer());
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "flattened.pdf");
      toast.success(t("success", { count: fieldCount }));
      log(`${fieldCount} fields`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-flatten">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}

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

export function PdfSign() {
  const t = useTranslations("tools.pdf-sign");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-sign");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0] || !text.trim()) return;
    setLoading(true);
    try {
      const { stampPdfSignature } = await import("@/lib/pdf/core");
      const out = await stampPdfSignature(await files[0].file.arrayBuffer(), text.trim(), "all");
      downloadBlob(bytesToBlob(out, "application/pdf"), "signed.pdf");
      toast.success(t("success"));
      log("sign", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-sign">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("signature")}</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0] || !text.trim()} />
    </ToolShell>
  );
}

export function PdfProtect() {
  const t = useTranslations("tools.pdf-protect");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-protect");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [mode, setMode] = useState<"lock" | "unlock">("lock");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0] || !password) return;
    setLoading(true);
    try {
      const buf = await files[0].file.arrayBuffer();
      const out = mode === "lock" ? await lockPdf(buf, password) : await unlockPdf(buf, password);
      downloadBlob(
        bytesToBlob(out, "application/pdf"),
        mode === "lock" ? "locked.pdf" : "unlocked.pdf"
      );
      toast.success(t("success"));
      log(mode, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-protect">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <div className="flex gap-2">
        <Button type="button" variant={mode === "lock" ? "default" : "outline"} onClick={() => setMode("lock")}>
          {t("lock")}
        </Button>
        <Button type="button" variant={mode === "unlock" ? "default" : "outline"} onClick={() => setMode("unlock")}>
          {t("unlock")}
        </Button>
      </div>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("password")}</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0] || !password} />
    </ToolShell>
  );
}
