"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { ActionBar, ToolShell, useToolHistory, loadPdfjs } from "./shared";
import { organizePdf, getPdfPageCount } from "@/lib/pdf/core";
import { replaceObjectUrlRecord, revokeObjectUrls } from "@/lib/files/object-url";
import { useTaskScope } from "@/lib/react/task-scope";
import { ArrowUp, ArrowDown } from "lucide-react";

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
  const [reading, setReading] = useState(false);
  const source = useTaskScope();

  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const thumbsRef = useRef(thumbs);
  const replaceThumbs = (next: Record<number, string>) => {
    thumbsRef.current = replaceObjectUrlRecord(thumbsRef.current, next);
    setThumbs(next);
  };

  useEffect(
    () => () => {
      revokeObjectUrls(Object.values(thumbsRef.current));
    },
    []
  );

  const resetPages = () => {
    setPageCount(0);
    setOrder([]);
    setRotations({});
    setDeleted(new Set());
    dragPage.current = null;
    replaceThumbs({});
  };

  const onFiles = async (items: FileItem[]) => {
    const current = source.begin();
    setFiles(items);
    resetPages();
    setLoading(false);
    setReading(Boolean(items[0]));
    if (!items[0]) {
      return;
    }
    try {
      const buffer = await items[0].file.arrayBuffer();
      const n = await getPdfPageCount(buffer);
      if (!current()) return;
      setPageCount(n);
      setOrder(Array.from({ length: n }, (_, i) => i));
      setRotations({});
      setDeleted(new Set());
      setReading(false);
      /* Thumbnails are a convenience. A long document is left without them
         rather than spending the memory to rasterize every page. */
      if (n <= 24) {
        const { renderPdfThumbnails } = await loadPdfjs();
        if (!current()) return;
        const urls = await renderPdfThumbnails(
          buffer,
          Array.from({ length: n }, (_, i) => i + 1),
          0.28
        );
        const next: Record<number, string> = {};
        urls.forEach((url, index) => {
          if (url) next[index] = url;
        });
        if (!current()) {
          revokeObjectUrls(Object.values(next));
          return;
        }
        replaceThumbs(next);
      }
    } catch (e) {
      if (!current()) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
    } finally {
      if (current()) setReading(false);
    }
  };

  const run = async () => {
    if (!files[0] || reading || loading || !pageCount) return;
    const current = source.capture();
    if (deleted.size >= pageCount) {
      toast.error(t("keepOne"));
      return;
    }
    setLoading(true);
    try {
      const out = await organizePdf(await files[0].file.arrayBuffer(), order, rotations, deleted);
      if (!current()) return;
      downloadBlob(bytesToBlob(out, "application/pdf"), "organized.pdf");
      toast.success(t("success"));
      log(`${pageCount} pages`, "success");
    } catch (e) {
      if (!current()) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      if (current()) setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-organize">
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={onFiles} />
      {pageCount > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {order.map((idx, position) => (
            <Card
              key={idx}
              draggable={!loading}
              onDragStart={() => {
                dragPage.current = idx;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (loading) return;
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
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  {thumbs[idx] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbs[idx]} alt="" className="h-12 w-9 shrink-0 rounded object-cover" />
                  ) : null}
                  <span>
                    {tc("page")} {idx + 1}
                    {rotations[idx] ? ` · ${rotations[idx]}°` : ""}
                  </span>
                </span>
                <div className="ms-auto flex flex-wrap justify-end gap-1">
                  <Button type="button" variant="ghost" size="icon" disabled={loading || position === 0} aria-label={`${tc("moveEarlier")} · ${tc("page")} ${idx + 1}`} onClick={() => setOrder((current) => {
                    const next = [...current];
                    [next[position - 1], next[position]] = [next[position], next[position - 1]];
                    return next;
                  })}><ArrowUp aria-hidden /></Button>
                  <Button type="button" variant="ghost" size="icon" disabled={loading || position === order.length - 1} aria-label={`${tc("moveLater")} · ${tc("page")} ${idx + 1}`} onClick={() => setOrder((current) => {
                    const next = [...current];
                    [next[position + 1], next[position]] = [next[position], next[position + 1]];
                    return next;
                  })}><ArrowDown aria-hidden /></Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() =>
                      setRotations((r) => ({ ...r, [idx]: ((r[idx] || 0) + 90) % 360 }))
                    }
                  >
                    {tc("rotate")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    aria-pressed={deleted.has(idx)}
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
      <ActionBar
        onRun={run}
        loading={loading}
        label={t("run")}
        disabled={!files[0] || reading || pageCount === 0 || deleted.size >= pageCount}
        status={reading ? tc("loading") : undefined}
      />
    </ToolShell>
  );
}
