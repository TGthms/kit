"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ToolId } from "@/lib/tools/registry";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { ToolHeader } from "@/components/shared/tool-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { downloadBlob, downloadText, formatBytes, bytesToBlob } from "@/lib/utils";
import { useHistoryStore } from "@/stores/history-store";
import { mergePdfs, splitPdf, organizePdf, watermarkPdf, redactPdf, getPdfPageCount } from "@/lib/pdf/core";
import {
  compressImage,
  resizeImage,
  cropImage,
  convertImage,
  stripMetadata,
  adjustImage,
  type ImageMime,
} from "@/lib/image/core";
import {
  formatJson,
  formatYaml,
  formatToml,
  markdownToHtml,
  htmlToMarkdown,
  csvToJson,
  jsonToCsv,
  textDiff,
  encodeBase64Text,
  decodeBase64Text,
  fileToBase64,
  base64ToBlob,
  urlEncode,
  urlDecode,
} from "@/lib/text/core";
import YAML from "yaml";
import JSZip from "jszip";

async function pdfjs() {
  return import("@/lib/pdf/pdfjs");
}

async function ffmpegApi() {
  return import("@/lib/media/ffmpeg");
}

function useToolHistory(toolId: ToolId) {
  const add = useHistoryStore((s) => s.add);
  return (summary: string, status: "success" | "failed", options?: Record<string, unknown>) =>
    add({ toolId, summary, status, options });
}

function ActionBar({
  onRun,
  loading,
  label,
  disabled,
}: {
  onRun: () => void;
  loading: boolean;
  label: string;
  disabled?: boolean;
}) {
  const t = useTranslations("common");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onRun} disabled={loading || disabled} className="min-w-32">
        {loading ? t("processing") : label}
      </Button>
    </div>
  );
}

export function ToolView({ toolId }: { toolId: ToolId }) {
  switch (toolId) {
    case "pdf-merge":
      return <PdfMerge />;
    case "pdf-split":
      return <PdfSplit />;
    case "pdf-organize":
      return <PdfOrganize />;
    case "pdf-compress":
      return <PdfCompress />;
    case "pdf-watermark":
      return <PdfWatermark />;
    case "pdf-redact":
      return <PdfRedact />;
    case "pdf-extract":
      return <PdfExtract />;
    case "image-compress":
      return <ImageCompress />;
    case "image-resize":
      return <ImageResize />;
    case "image-crop":
      return <ImageCrop />;
    case "image-convert":
      return <ImageConvert />;
    case "image-metadata":
      return <ImageMetadata />;
    case "image-adjust":
      return <ImageAdjust />;
    case "media-convert":
      return <MediaConvert />;
    case "media-trim":
      return <MediaTrim />;
    case "media-speed":
      return <MediaSpeed />;
    case "media-extract-audio":
      return <MediaExtractAudio />;
    case "convert-hub":
      return <ConvertHub />;
    case "json-format":
      return <JsonFormat />;
    case "yaml-format":
      return <YamlFormat />;
    case "toml-format":
      return <TomlFormat />;
    case "markdown-html":
      return <MarkdownHtml />;
    case "csv-json":
      return <CsvJson />;
    case "text-diff":
      return <TextDiff />;
    case "base64":
      return <Base64Tool />;
    case "url-encode":
      return <UrlEncodeTool />;
    default:
      return null;
  }
}

function Shell({ toolId, children }: { toolId: ToolId; children: React.ReactNode }) {
  return (
    <div>
      <ToolHeader toolId={toolId} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function PdfMerge() {
  const t = useTranslations("tools.pdf-merge");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-merge");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const loadThumbs = async (items: FileItem[]) => {
    setFiles(items);
    for (const item of items) {
      if (thumbs[item.id]) continue;
      try {
        const { renderPdfThumbnail } = await pdfjs();
        const url = await renderPdfThumbnail(await item.file.arrayBuffer());
        setThumbs((s) => ({ ...s, [item.id]: url }));
      } catch {
        /* ignore */
      }
    }
  };

  const run = async () => {
    if (files.length < 2) {
      toast.error(t("empty"));
      return;
    }
    setLoading(true);
    try {
      const buffers = await Promise.all(files.map((f) => f.file.arrayBuffer()));
      const out = await mergePdfs(buffers);
      downloadBlob(bytesToBlob(out, "application/pdf"), "merged.pdf");
      toast.success(t("success", { count: files.length }));
      log(`${files.length} files`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("merge failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="pdf-merge">
      <FileDropzone accept="application/pdf" files={files} onChange={loadThumbs} reorder />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((f) => (
            <div key={f.id} className="w-24 overflow-hidden rounded-xl border bg-card">
              {thumbs[f.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[f.id]} alt="" className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">PDF</div>
              )}
              <p className="truncate px-1 py-1 text-[10px]">{f.file.name}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{tc("reorder")}</p>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={files.length < 2} />
    </Shell>
  );
}

function PdfSplit() {
  const t = useTranslations("tools.pdf-split");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-split");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [range, setRange] = useState("1-1");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const out = await splitPdf(await files[0].file.arrayBuffer(), range);
      downloadBlob(bytesToBlob(out, "application/pdf"), "split.pdf");
      toast.success(t("success"));
      log(range, "success", { range });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="pdf-split">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("range")}</Label>
        <Input value={range} onChange={(e) => setRange(e.target.value)} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </Shell>
  );
}

function PdfOrganize() {
  const t = useTranslations("tools.pdf-organize");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-organize");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [deleted, setDeleted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const onFiles = async (items: FileItem[]) => {
    setFiles(items);
    if (!items[0]) return;
    const n = await getPdfPageCount(await items[0].file.arrayBuffer());
    setPageCount(n);
    setOrder(Array.from({ length: n }, (_, i) => i));
    setRotations({});
    setDeleted(new Set());
  };

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const out = await organizePdf(await files[0].file.arrayBuffer(), order, rotations, deleted);
      downloadBlob(bytesToBlob(out, "application/pdf"), "organized.pdf");
      toast.success(t("success"));
      log(`${pageCount} pages`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="pdf-organize">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={onFiles} />
      {pageCount > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {order.map((idx) => (
            <Card key={idx} className={deleted.has(idx) ? "opacity-40" : ""}>
              <CardContent className="flex items-center justify-between gap-2 p-3 text-sm">
                <span>
                  {tc("page")} {idx + 1}
                  {rotations[idx] ? ` · ${rotations[idx]}°` : ""}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setRotations((r) => ({ ...r, [idx]: ((r[idx] || 0) + 90) % 360 }))
                    }
                  >
                    {tc("rotate")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDeleted((d) => {
                        const n = new Set(d);
                        if (n.has(idx)) n.delete(idx);
                        else n.add(idx);
                        return n;
                      });
                    }}
                  >
                    {tc("delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </Shell>
  );
}

function PdfCompress() {
  const t = useTranslations("tools.pdf-compress");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-compress");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(0.65);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const { compressPdfLossy } = await pdfjs();
      const out = await compressPdfLossy(await files[0].file.arrayBuffer(), quality);
      downloadBlob(bytesToBlob(out, "application/pdf"), "compressed.pdf");
      toast.success(t("success"));
      log(`q=${quality}`, "success", { quality });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="pdf-compress">
      <p className="text-sm text-muted-foreground">{t("note")}</p>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>
          {tc("quality")}: {Math.round(quality * 100)}%
        </Label>
        <Slider value={[quality]} min={0.3} max={0.95} step={0.05} onValueChange={(v) => setQuality(v[0])} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </Shell>
  );
}

function PdfWatermark() {
  const t = useTranslations("tools.pdf-watermark");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-watermark");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [position, setPosition] = useState<"header" | "footer" | "center">("center");
  const [opacity, setOpacity] = useState(0.25);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const out = await watermarkPdf(await files[0].file.arrayBuffer(), text, position, opacity);
      downloadBlob(bytesToBlob(out, "application/pdf"), "watermarked.pdf");
      toast.success(t("success"));
      log(text, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="pdf-watermark">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("text")}</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("position")}</Label>
          <select
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={position}
            onChange={(e) => setPosition(e.target.value as typeof position)}
          >
            <option value="center">{t("center")}</option>
            <option value="header">{t("header")}</option>
            <option value="footer">{t("footer")}</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>
          {t("opacity")}: {Math.round(opacity * 100)}%
        </Label>
        <Slider value={[opacity]} min={0.05} max={0.8} step={0.05} onValueChange={(v) => setOpacity(v[0])} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0] || !text} />
    </Shell>
  );
}

function PdfRedact() {
  const t = useTranslations("tools.pdf-redact");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-redact");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      // Default center band redaction box in PDF points (visual cover)
      const out = await redactPdf(await files[0].file.arrayBuffer(), [
        { page: Math.max(0, page - 1), x: 72, y: 400, w: 400, h: 40 },
      ]);
      downloadBlob(bytesToBlob(out, "application/pdf"), "redacted.pdf");
      toast.success(t("success"));
      log(`page ${page}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="pdf-redact">
      <p className="text-sm text-amber-600 dark:text-amber-400">{t("note")}</p>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>
          {tc("page")} (1-based)
        </Label>
        <Input type="number" min={1} value={page} onChange={(e) => setPage(Number(e.target.value) || 1)} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </Shell>
  );
}

function PdfExtract() {
  const t = useTranslations("tools.pdf-extract");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-extract");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [mode, setMode] = useState<"text" | "images">("text");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const { extractPdfText, renderPdfThumbnail } = await pdfjs();
      if (mode === "text") {
        const text = await extractPdfText(await files[0].file.arrayBuffer());
        setResult(text);
        downloadText(text, "extract.txt");
      } else {
        // Image extract via page raster is covered by compress path; export first page thumbnail as demo image extract
        const url = await renderPdfThumbnail(await files[0].file.arrayBuffer(), 1, 1.5);
        const res = await fetch(url);
        const blob = await res.blob();
        downloadBlob(blob, "page-1.jpg");
        setResult("Image export: page 1 raster (embedded XObject extract is limited client-side).");
      }
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
    <Shell toolId="pdf-extract">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="flex gap-2">
        <Button variant={mode === "text" ? "default" : "outline"} onClick={() => setMode("text")}>
          {t("modeText")}
        </Button>
        <Button variant={mode === "images" ? "default" : "outline"} onClick={() => setMode("images")}>
          {t("modeImages")}
        </Button>
      </div>
      {result && <Textarea value={result} readOnly className="min-h-48" />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </Shell>
  );
}

function ImageCompress() {
  const t = useTranslations("tools.image-compress");
  const tc = useTranslations("common");
  const log = useToolHistory("image-compress");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(0.75);
  const [maxW, setMaxW] = useState(1920);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    setProgress(0);
    try {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const blob = await compressImage(f.file, {
          quality,
          maxWidth: maxW,
          maxHeight: maxW,
          mime: f.file.type === "image/png" ? "image/png" : "image/jpeg",
        });
        const name = f.file.name.replace(/\.\w+$/, "") + "-compressed.jpg";
        zip.file(name, blob);
        if (files.length === 1) downloadBlob(blob, name);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      if (files.length > 1) {
        const z = await zip.generateAsync({ type: "blob" });
        downloadBlob(z, "compressed-images.zip");
      }
      toast.success(t("success", { count: files.length }));
      log(`${files.length} images`, "success", { quality, maxW });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="image-compress">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            {tc("quality")}: {Math.round(quality * 100)}%
          </Label>
          <Slider value={[quality]} min={0.1} max={1} step={0.05} onValueChange={(v) => setQuality(v[0])} />
        </div>
        <div className="space-y-2">
          <Label>{tc("maxWidth")}</Label>
          <Input type="number" value={maxW} onChange={(e) => setMaxW(Number(e.target.value) || 1920)} />
        </div>
      </div>
      {loading && <Progress value={progress} />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </Shell>
  );
}

function ImageResize() {
  const t = useTranslations("tools.image-resize");
  const tc = useTranslations("common");
  const log = useToolHistory("image-resize");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(0);
  const [lock, setLock] = useState(true);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      for (const f of files) {
        const blob = await resizeImage(f.file, { width, height, lockAspect: lock });
        downloadBlob(blob, f.file.name.replace(/\.\w+$/, "") + "-resized.png");
      }
      toast.success(t("success", { count: files.length }));
      log(`${width}x${height}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="image-resize">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{tc("width")}</Label>
          <Input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>{tc("height")}</Label>
          <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <Switch checked={lock} onCheckedChange={setLock} id="lock" />
          <Label htmlFor="lock">{t("lockAspect")}</Label>
        </div>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </Shell>
  );
}

function ImageCrop() {
  const t = useTranslations("tools.image-crop");
  const tc = useTranslations("common");
  const log = useToolHistory("image-crop");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [w, setW] = useState(400);
  const [h, setH] = useState(300);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const blob = await cropImage(files[0].file, { x, y, w, h });
      downloadBlob(blob, "cropped.png");
      toast.success(t("success"));
      log(`${w}x${h}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="image-crop">
      <FileDropzone accept="image/*" multiple={false} files={files} onChange={setFiles} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["x", "y", "w", "h"] as const).map((k) => (
          <div key={k} className="space-y-2">
            <Label>{k.toUpperCase()}</Label>
            <Input
              type="number"
              value={{ x, y, w, h }[k]}
              onChange={(e) => {
                const n = Number(e.target.value) || 0;
                if (k === "x") setX(n);
                if (k === "y") setY(n);
                if (k === "w") setW(n);
                if (k === "h") setH(n);
              }}
            />
          </div>
        ))}
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </Shell>
  );
}

function ImageConvert() {
  const t = useTranslations("tools.image-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("image-convert");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [mime, setMime] = useState<ImageMime>("image/webp");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const ext = mime.split("/")[1];
      for (const f of files) {
        const blob = await convertImage(f.file, mime);
        downloadBlob(blob, f.file.name.replace(/\.\w+$/, "") + `.${ext}`);
      }
      toast.success(t("success", { count: files.length }));
      log(mime, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="image-convert">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{tc("format")}</Label>
        <select
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={mime}
          onChange={(e) => setMime(e.target.value as ImageMime)}
        >
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WEBP</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </Shell>
  );
}

function ImageMetadata() {
  const t = useTranslations("tools.image-metadata");
  const tc = useTranslations("common");
  const log = useToolHistory("image-metadata");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      for (const f of files) {
        const blob = await stripMetadata(f.file);
        downloadBlob(blob, f.file.name.replace(/\.\w+$/, "") + "-clean.jpg");
      }
      toast.success(t("success", { count: files.length }));
      log(`${files.length}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="image-metadata">
      <p className="text-sm text-muted-foreground">{t("note")}</p>
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </Shell>
  );
}

function ImageAdjust() {
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
      for (const f of files) {
        const blob = await adjustImage(f.file, { brightness, contrast, saturation });
        downloadBlob(blob, f.file.name.replace(/\.\w+$/, "") + "-adjusted.png");
      }
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
    <Shell toolId="image-adjust">
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
    </Shell>
  );
}

function MediaConvert() {
  const t = useTranslations("tools.media-convert");
  const tc = useTranslations("common");
  const [format, setFormat] = useState("mp4");
  return (
    <Shell toolId="media-convert">
      <p className="text-sm text-muted-foreground">{t("note")}</p>
      <div className="space-y-2">
        <Label>{tc("format")}</Label>
        <select
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="mp4">MP4</option>
          <option value="webm">WEBM</option>
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
        </select>
      </div>
      <MediaConvertInner format={format} />
    </Shell>
  );
}

function MediaConvertInner({ format }: { format: string }) {
  const t = useTranslations("tools.media-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("media-convert");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "bin";
      const input = `input.${ext}`;
      const output = `output.${format}`;
      let args: string[];
      if (format === "mp3") args = ["-i", input, "-vn", "-acodec", "libmp3lame", output];
      else if (format === "wav") args = ["-i", input, "-vn", output];
      else if (format === "webm") args = ["-i", input, "-c:v", "libvpx", "-c:a", "libvorbis", output];
      else args = ["-i", input, "-c", "copy", output];
      const { runFFmpeg } = await ffmpegApi();
      try {
        const out = await runFFmpeg(input, data, output, args, (p) => setProgress(Math.round(p * 100)));
        downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      } catch {
        // fallback re-encode
        const out = await runFFmpeg(
          input,
          data,
          output,
          ["-i", input, output],
          (p) => setProgress(Math.round(p * 100))
        );
        downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      }
      toast.success(t("success"));
      log(format, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FileDropzone accept="audio/*,video/*" multiple={false} files={files} onChange={setFiles} />
      {loading && <Progress value={progress} />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </>
  );
}

function MediaTrim() {
  const t = useTranslations("tools.media-trim");
  const tc = useTranslations("common");
  const log = useToolHistory("media-trim");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("10");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const input = `input.${ext}`;
      const output = `trim.${ext}`;
      const { runFFmpeg } = await ffmpegApi();
      const out = await runFFmpeg(
        input,
        data,
        output,
        ["-ss", start, "-to", end, "-i", input, "-c", "copy", output],
        (p) => setProgress(Math.round(p * 100))
      );
      downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      toast.success(t("success"));
      log(`${start}-${end}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="media-trim">
      <FileDropzone accept="audio/*,video/*" multiple={false} files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{tc("start")} (s)</Label>
          <Input value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{tc("end")} (s)</Label>
          <Input value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      {loading && <Progress value={progress} />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </Shell>
  );
}

function MediaSpeed() {
  const t = useTranslations("tools.media-speed");
  const tc = useTranslations("common");
  const log = useToolHistory("media-speed");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [speed, setSpeed] = useState(1.5);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const input = `input.${ext}`;
      const output = `processed.${ext}`;
      const atempo = Math.min(2, Math.max(0.5, speed));
      const { runFFmpeg } = await ffmpegApi();
      const out = await runFFmpeg(input, data, output, [
        "-i",
        input,
        "-filter_complex",
        `[0:v]setpts=${(1 / speed).toFixed(3)}*PTS[v];[0:a]atempo=${atempo},volume=${volume}[a]`,
        "-map",
        "[v]",
        "-map",
        "[a]",
        output,
      ]);
      downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      toast.success(t("success"));
      log(`speed=${speed}`, "success");
    } catch {
      // audio-only fallback
      try {
        const { runFFmpeg } = await ffmpegApi();
        const data = new Uint8Array(await files[0].file.arrayBuffer());
        const input = "input.mp3";
        const output = "processed.mp3";
        const out = await runFFmpeg(input, data, output, [
          "-i",
          input,
          "-filter:a",
          `atempo=${Math.min(2, Math.max(0.5, speed))},volume=${volume}`,
          output,
        ]);
        downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
        toast.success(t("success"));
        log(`audio speed=${speed}`, "success");
      } catch (e2) {
        toast.error(e2 instanceof Error ? e2.message : tc("error"));
        log("failed", "failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="media-speed">
      <FileDropzone accept="audio/*,video/*" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>
          {tc("speed")}: {speed.toFixed(2)}x
        </Label>
        <Slider value={[speed]} min={0.5} max={2} step={0.05} onValueChange={(v) => setSpeed(v[0])} />
      </div>
      <div className="space-y-2">
        <Label>
          {tc("volume")}: {volume.toFixed(2)}
        </Label>
        <Slider value={[volume]} min={0} max={2} step={0.05} onValueChange={(v) => setVolume(v[0])} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </Shell>
  );
}

function MediaExtractAudio() {
  const t = useTranslations("tools.media-extract-audio");
  const tc = useTranslations("common");
  const log = useToolHistory("media-extract-audio");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const { runFFmpeg } = await ffmpegApi();
      const out = await runFFmpeg(`input.${ext}`, data, "audio.mp3", [
        "-i",
        `input.${ext}`,
        "-vn",
        "-acodec",
        "libmp3lame",
        "audio.mp3",
      ]);
      downloadBlob(bytesToBlob(out, "audio/mpeg"), "audio.mp3");
      toast.success(t("success"));
      log(files[0].file.name, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="media-extract-audio">
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </Shell>
  );
}

function ConvertHub() {
  const t = useTranslations("tools.convert-hub");
  const tc = useTranslations("common");
  const log = useToolHistory("convert-hub");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("");
  const [output, setOutput] = useState("json");
  const [loading, setLoading] = useState(false);

  const detected = useMemo(() => {
    if (files[0]) {
      const n = files[0].file.name.toLowerCase();
      if (n.endsWith(".json")) return "json";
      if (n.endsWith(".yaml") || n.endsWith(".yml")) return "yaml";
      if (n.endsWith(".csv")) return "csv";
      if (n.endsWith(".zip")) return "zip";
      if (files[0].file.type.startsWith("image/")) return "image";
      return "file";
    }
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) return "json";
    if (text.includes(",") && text.includes("\n")) return "csv";
    return "text";
  }, [files, text]);

  const run = async () => {
    setLoading(true);
    try {
      let inputText = text;
      if (files[0] && !files[0].file.type.startsWith("image/")) {
        inputText = await files[0].file.text();
      }
      if (output === "json" && detected === "yaml") {
        const data = YAML.parse(inputText);
        downloadText(JSON.stringify(data, null, 2), "converted.json", "application/json");
      } else if (output === "yaml" && (detected === "json" || detected === "text")) {
        const data = JSON.parse(inputText);
        downloadText(YAML.stringify(data), "converted.yaml", "text/yaml");
      } else if (output === "json" && detected === "csv") {
        const r = csvToJson(inputText);
        if (!r.ok) throw new Error(r.error);
        downloadText(r.text, "converted.json", "application/json");
      } else if (output === "csv" && detected === "json") {
        const r = jsonToCsv(inputText);
        if (!r.ok) throw new Error(r.error);
        downloadText(r.text, "converted.csv", "text/csv");
      } else if (output === "zip" && files.length) {
        const zip = new JSZip();
        for (const f of files) zip.file(f.file.name, f.file);
        downloadBlob(await zip.generateAsync({ type: "blob" }), "archive.zip");
      } else if (detected === "image" && files[0]) {
        const mime = output === "png" ? "image/png" : output === "webp" ? "image/webp" : "image/jpeg";
        const blob = await convertImage(files[0].file, mime as ImageMime);
        downloadBlob(blob, `converted.${output}`);
      } else {
        throw new Error("Unsupported conversion pair");
      }
      toast.success(t("success"));
      log(`${detected}→${output}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell toolId="convert-hub">
      <FileDropzone files={files} onChange={setFiles} />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="JSON / YAML / CSV…" />
      <p className="text-sm text-muted-foreground">
        {t("detect")}: <strong>{detected}</strong>
      </p>
      <div className="space-y-2">
        <Label>{t("chooseOutput")}</Label>
        <select
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={output}
          onChange={(e) => setOutput(e.target.value)}
        >
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="csv">CSV</option>
          <option value="zip">ZIP</option>
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
          <option value="webp">WEBP</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} />
    </Shell>
  );
}

function JsonFormat() {
  const t = useTranslations("tools.json-format");
  const tc = useTranslations("common");
  const log = useToolHistory("json-format");
  const [input, setInput] = useState('{\n  "hello": "kit"\n}');
  const [error, setError] = useState("");

  const run = (minify = false) => {
    const r = formatJson(input, minify);
    if (!r.ok) {
      setError(r.error);
      toast.error(r.error);
      log("invalid", "failed");
      return;
    }
    setError("");
    setInput(r.text);
    toast.success(t("success"));
    log(minify ? "minify" : "format", "success");
  };

  return (
    <Shell toolId="json-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run(false)}>{tc("beautify")}</Button>
        <Button variant="secondary" onClick={() => run(true)}>
          {tc("minify")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(input);
            toast.success(tc("copied"));
          }}
        >
          {tc("copy")}
        </Button>
        <Button variant="outline" onClick={() => downloadText(input, "data.json", "application/json")}>
          {tc("download")}
        </Button>
      </div>
    </Shell>
  );
}

function YamlFormat() {
  const t = useTranslations("tools.yaml-format");
  const log = useToolHistory("yaml-format");
  const [input, setInput] = useState("hello: kit\n");
  const run = () => {
    const r = formatYaml(input);
    if (!r.ok) {
      toast.error(r.error);
      log("invalid", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log("format", "success");
  };
  return (
    <Shell toolId="yaml-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </Shell>
  );
}

function TomlFormat() {
  const t = useTranslations("tools.toml-format");
  const log = useToolHistory("toml-format");
  const [input, setInput] = useState('title = "Kit"\n');
  const run = () => {
    const r = formatToml(input);
    if (!r.ok) {
      toast.error(r.error);
      log("invalid", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log("format", "success");
  };
  return (
    <Shell toolId="toml-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </Shell>
  );
}

function MarkdownHtml() {
  const t = useTranslations("tools.markdown-html");
  const log = useToolHistory("markdown-html");
  const [input, setInput] = useState("# Hello Kit\n\nPrivate tools.");
  const [toHtml, setToHtml] = useState(true);
  const run = () => {
    try {
      const out = toHtml ? markdownToHtml(input) : htmlToMarkdown(input);
      setInput(out);
      toast.success(t("success"));
      log(toHtml ? "md→html" : "html→md", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "error");
      log("failed", "failed");
    }
  };
  return (
    <Shell toolId="markdown-html">
      <div className="flex gap-2">
        <Button variant={toHtml ? "default" : "outline"} onClick={() => setToHtml(true)}>
          {t("toHtml")}
        </Button>
        <Button variant={!toHtml ? "default" : "outline"} onClick={() => setToHtml(false)}>
          {t("toMd")}
        </Button>
      </div>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </Shell>
  );
}

function CsvJson() {
  const t = useTranslations("tools.csv-json");
  const log = useToolHistory("csv-json");
  const [input, setInput] = useState("name,role\nKit,toolkit\n");
  const [toJson, setToJson] = useState(true);
  const run = () => {
    const r = toJson ? csvToJson(input) : jsonToCsv(input);
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log(toJson ? "csv→json" : "json→csv", "success");
  };
  return (
    <Shell toolId="csv-json">
      <div className="flex gap-2">
        <Button variant={toJson ? "default" : "outline"} onClick={() => setToJson(true)}>
          {t("toJson")}
        </Button>
        <Button variant={!toJson ? "default" : "outline"} onClick={() => setToJson(false)}>
          {t("toCsv")}
        </Button>
      </div>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </Shell>
  );
}

function TextDiff() {
  const t = useTranslations("tools.text-diff");
  const log = useToolHistory("text-diff");
  const [left, setLeft] = useState("hello\nworld");
  const [right, setRight] = useState("hello\nkit");
  const [parts, setParts] = useState<ReturnType<typeof textDiff>>([]);

  const run = () => {
    const d = textDiff(left, right);
    setParts(d);
    toast.success(t("success"));
    log("diff", "success");
  };

  return (
    <Shell toolId="text-diff">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("left")}</Label>
          <Textarea value={left} onChange={(e) => setLeft(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("right")}</Label>
          <Textarea value={right} onChange={(e) => setRight(e.target.value)} />
        </div>
      </div>
      <Button onClick={run}>{t("run")}</Button>
      {parts.length > 0 && (
        <pre className="overflow-auto rounded-2xl border bg-card p-4 text-sm">
          {parts.map((p, i) => (
            <span
              key={i}
              className={
                p.added
                  ? "bg-green-500/20 text-green-800 dark:text-green-300"
                  : p.removed
                    ? "bg-red-500/20 text-red-800 dark:text-red-300"
                    : ""
              }
            >
              {p.value}
            </span>
          ))}
        </pre>
      )}
    </Shell>
  );
}

function Base64Tool() {
  const t = useTranslations("tools.base64");
  const tc = useTranslations("common");
  const log = useToolHistory("base64");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [kind, setKind] = useState<"text" | "file">("text");
  const [text, setText] = useState("Hello Kit");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [out, setOut] = useState("");

  const run = async () => {
    try {
      if (kind === "text") {
        const r = mode === "encode" ? encodeBase64Text(text) : decodeBase64Text(text);
        setOut(r);
        setText(r);
      } else if (files[0]) {
        if (mode === "encode") {
          const b64 = await fileToBase64(files[0].file);
          setOut(b64);
          downloadText(b64, files[0].file.name + ".b64.txt");
        } else {
          const blob = base64ToBlob(text);
          downloadBlob(blob, "decoded.bin");
          setOut(`Decoded ${formatBytes(blob.size)}`);
        }
      }
      toast.success(t("success"));
      log(`${mode}/${kind}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <Shell toolId="base64">
      <div className="flex flex-wrap gap-2">
        <Button variant={mode === "encode" ? "default" : "outline"} onClick={() => setMode("encode")}>
          {tc("encode")}
        </Button>
        <Button variant={mode === "decode" ? "default" : "outline"} onClick={() => setMode("decode")}>
          {tc("decode")}
        </Button>
        <Button variant={kind === "text" ? "default" : "outline"} onClick={() => setKind("text")}>
          {t("textMode")}
        </Button>
        <Button variant={kind === "file" ? "default" : "outline"} onClick={() => setKind("file")}>
          {t("fileMode")}
        </Button>
      </div>
      {kind === "file" ? (
        <FileDropzone multiple={false} files={files} onChange={setFiles} />
      ) : null}
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-40" />
      {out && kind === "file" && mode === "encode" && (
        <Textarea value={out} readOnly className="min-h-32" />
      )}
      <Button onClick={run}>{t("run")}</Button>
    </Shell>
  );
}

function UrlEncodeTool() {
  const t = useTranslations("tools.url-encode");
  const tc = useTranslations("common");
  const log = useToolHistory("url-encode");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [text, setText] = useState("hello world");

  const run = () => {
    try {
      setText(mode === "encode" ? urlEncode(text) : urlDecode(text));
      toast.success(t("success"));
      log(mode, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <Shell toolId="url-encode">
      <div className="flex gap-2">
        <Button variant={mode === "encode" ? "default" : "outline"} onClick={() => setMode("encode")}>
          {tc("encode")}
        </Button>
        <Button variant={mode === "decode" ? "default" : "outline"} onClick={() => setMode("decode")}>
          {tc("decode")}
        </Button>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={run}>{t("run")}</Button>
    </Shell>
  );
}

