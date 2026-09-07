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

  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const thumbsGen = useRef(0);
  const thumbsRef = useRef(thumbs);

  useEffect(() => {
    thumbsRef.current = thumbs;
  }, [thumbs]);

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
    setThumbs((current) => replaceObjectUrlRecord(current, {}));
  };

  const onFiles = async (items: FileItem[]) => {
    const gen = ++thumbsGen.current;
    setFiles(items);
    if (!items[0]) {
      resetPages();
      return;
    }
    try {
      const buffer = await items[0].file.arrayBuffer();
      const n = await getPdfPageCount(buffer);
      setPageCount(n);
      setOrder(Array.from({ length: n }, (_, i) => i));
      setRotations({});
      setDeleted(new Set());
      if (n <= 24) {
        const { renderPdfThumbnail } = await loadPdfjs();
        const { runPooled } = await import("@/lib/jobs/batch");
        const pages = Array.from({ length: n }, (_, i) => i);
        const entries = await runPooled(pages, 3, async (i) => {
          try {
            const url = await renderPdfThumbnail(buffer.slice(0), i + 1, 0.28);
            return [i, url] as const;
          } catch {
            return null;
          }
        });
        const next = Object.fromEntries(entries.filter(Boolean) as Array<readonly [number, string]>);
        if (gen !== thumbsGen.current) {
          revokeObjectUrls(Object.values(next));
          return;
        }
        setThumbs((current) => replaceObjectUrlRecord(current, next));
      } else if (gen === thumbsGen.current) {
        setThumbs((current) => replaceObjectUrlRecord(current, {}));
      }
    } catch (e) {
      if (gen === thumbsGen.current) resetPages();
      toast.error(e instanceof Error ? e.message : tc("error"));
    }
  };

  const run = async () => {
    if (!files[0]) return;
    if (deleted.size >= pageCount) {
      toast.error(t("keepOne"));
      return;
    }
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
      <ActionBar
        onRun={run}
        loading={loading}
        label={t("run")}
        disabled={!files[0] || pageCount === 0 || deleted.size >= pageCount}
      />
    </ToolShell>
  );
}
