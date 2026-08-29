"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob, downloadText, downloadMany, bytesToBlob } from "@/lib/utils";
import JSZip from "jszip";
import { Progress } from "@/components/ui/progress";
import { runSequentialBatch, stemmedName } from "@/lib/jobs/batch";
import { ActionBar, ToolLimits, ToolShell, useToolHistory, loadPdfjs } from "./shared";
import { mergePdfs, splitPdf, organizePdf, watermarkPdf, coverPdfContent, getPdfPageCount } from "@/lib/pdf/core";


export function PdfMerge() {
  const t = useTranslations("tools.pdf-merge");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-merge");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const loadThumbs = async (items: FileItem[]) => {
    setFiles(items);
    try {
      const { renderPdfThumbnail } = await loadPdfjs();
      const rendered = await Promise.all(
        items.map(async (item) => {
          try {
            return { id: item.id, url: await renderPdfThumbnail(await item.file.arrayBuffer()) };
          } catch {
            return null;
          }
        })
      );
      const next = Object.fromEntries(
        rendered
          .filter((item): item is { id: string; url: string } => Boolean(item))
          .map((item) => [item.id, item.url])
      );
      setThumbs((current) => ({ ...current, ...next }));
    } catch {
      /* thumbnails are optional */
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
    <ToolShell toolId="pdf-merge">
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
    </ToolShell>
  );
}

export function PdfSplit() {
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
      log("completed", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-split">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("range")}</Label>
        <Input value={range} onChange={(e) => setRange(e.target.value)} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}

export function PdfOrganize() {
  const t = useTranslations("tools.pdf-organize");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-organize");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const dragPage = useRef<number | null>(null);
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
    <ToolShell toolId="pdf-organize">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={onFiles} />
      {pageCount > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {order.map((idx) => (
            <Card
              key={idx}
              draggable
              onDragStart={() => {
                dragPage.current = idx;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const fromPage = dragPage.current;
                if (fromPage === null || fromPage === idx) return;
                setOrder((current) => {
                  const from = current.indexOf(fromPage);
                  const to = current.indexOf(idx);
                  if (from < 0 || to < 0) return current;
                  const next = [...current];
                  const [moved] = next.splice(from, 1);
                  next.splice(to, 0, moved);
                  return next;
                });
                dragPage.current = null;
              }}
              onDragEnd={() => {
                dragPage.current = null;
              }}
              className={deleted.has(idx) ? "cursor-grab opacity-40" : "cursor-grab"}
            >
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
    </ToolShell>
  );
}

export function PdfCompress() {
  const t = useTranslations("tools.pdf-compress");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-compress");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(0.65);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [controller, setController] = useState<AbortController | null>(null);

  const run = async () => {
    if (!files.length) return;
    const ac = new AbortController();
    setController(ac);
    setLoading(true);
    setProgress(0);
    try {
      const { compressPdfLossy } = await loadPdfjs();
      const items = await runSequentialBatch(
        files,
        async (f, index) => {
          const out = await compressPdfLossy(await f.file.arrayBuffer(), quality, 1.2, {
            signal: ac.signal,
            onProgress: (pageRatio) =>
              setProgress(Math.round(((index + pageRatio) / files.length) * 100)),
          });
          return {
            blob: bytesToBlob(out, "application/pdf"),
            name: stemmedName(f.file.name, "-compressed", "pdf"),
          };
        },
        { signal: ac.signal }
      );
      await downloadMany(items, "compressed-pdfs.zip");
      toast.success(t("success"));
      log(`q=${quality} n=${files.length}`, "success", { quality, count: files.length });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") toast.error(tc("cancel"));
      else toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
      setController(null);
    }
  };

  return (
    <ToolShell toolId="pdf-compress">
      <ToolLimits>
        <p>{t("note")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>
          {tc("quality")}: {Math.round(quality * 100)}%
        </Label>
        <Slider value={[quality]} min={0.3} max={0.95} step={0.05} onValueChange={(v) => setQuality(v[0])} />
      </div>
      {loading && <Progress value={progress} />}
      <ActionBar
        onRun={run}
        loading={loading}
        label={t("run")}
        disabled={!files.length}
        onCancel={() => controller?.abort()}
      />
    </ToolShell>
  );
}

export function PdfWatermark() {
  const t = useTranslations("tools.pdf-watermark");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-watermark");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [position, setPosition] = useState<"header" | "footer" | "center">("center");
  const [opacity, setOpacity] = useState(0.25);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [controller, setController] = useState<AbortController | null>(null);

  const run = async () => {
    if (!files.length) return;
    const ac = new AbortController();
    setController(ac);
    setLoading(true);
    setProgress(0);
    try {
      const items = await runSequentialBatch(
        files,
        async (f) => {
          const out = await watermarkPdf(await f.file.arrayBuffer(), text, position, opacity);
          return {
            blob: bytesToBlob(out, "application/pdf"),
            name: stemmedName(f.file.name, "-watermarked", "pdf"),
          };
        },
        { signal: ac.signal, onProgress: (r) => setProgress(Math.round(r * 100)) }
      );
      await downloadMany(items, "watermarked-pdfs.zip");
      toast.success(t("success"));
      log(`n=${files.length}`, "success");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") toast.error(tc("cancel"));
      else toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
      setController(null);
    }
  };

  return (
    <ToolShell toolId="pdf-watermark">
      <FileDropzone accept="application/pdf" files={files} onChange={setFiles} />
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
      {loading && <Progress value={progress} />}
      <ActionBar
        onRun={run}
        loading={loading}
        label={t("run")}
        disabled={!files.length || !text}
        onCancel={() => controller?.abort()}
      />
    </ToolShell>
  );
}

export function PdfRedact() {
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
      // Default center band cover box in PDF points (visual cover only)
      const out = await coverPdfContent(await files[0].file.arrayBuffer(), [
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
    <ToolShell toolId="pdf-redact">
      <ToolLimits>
        <p className="text-amber-700 dark:text-amber-300">{t("note")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>
          {tc("page")} (1-based)
        </Label>
        <Input type="number" min={1} value={page} onChange={(e) => setPage(Number(e.target.value) || 1)} />
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}

export function PdfExtract() {
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
      const { extractPdfText, renderPdfPagesToBlobs } = await loadPdfjs();
      if (mode === "text") {
        const text = await extractPdfText(await files[0].file.arrayBuffer());
        setResult(text);
        downloadText(text, "extract.txt");
      } else {
        const blobs = await renderPdfPagesToBlobs(await files[0].file.arrayBuffer(), {
          mime: "image/jpeg",
          scale: 1.5,
        });
        const zip = new JSZip();
        blobs.forEach((blob, i) => zip.file(`page-${String(i + 1).padStart(3, "0")}.jpg`, blob));
        downloadBlob(await zip.generateAsync({ type: "blob" }), "pdf-pages.zip");
        setResult(t("imagesReady", { count: blobs.length }));
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
    <ToolShell toolId="pdf-extract">
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
    </ToolShell>
  );
}

