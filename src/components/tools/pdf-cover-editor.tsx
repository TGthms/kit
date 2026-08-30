"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FileItem } from "@/components/shared/file-dropzone";
import { loadPdfjs } from "./shared";

export type CoverBox = { page: number; x: number; y: number; w: number; h: number };

type Preview = {
  url: string;
  scale: number;
  width: number;
  height: number;
  pageCount: number;
};

export function PdfCoverEditor({
  file,
  boxes,
  onChange,
}: {
  file: FileItem | undefined;
  boxes: CoverBox[];
  onChange: (boxes: CoverBox[]) => void;
}) {
  const t = useTranslations("tools.pdf-redact");
  const tc = useTranslations("common");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
    onChange([]);
    // Reset boxes when the source file changes; parent owns the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when file identity changes
  }, [file?.id]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      setError("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { renderPdfPagePreview } = await loadPdfjs();
        const next = await renderPdfPagePreview(await file.file.arrayBuffer(), page, 1.35);
        if (cancelled) {
          URL.revokeObjectURL(next.url);
          return;
        }
        setPreview((current) => {
          if (current) URL.revokeObjectURL(current.url);
          return next;
        });
        setError("");
      } catch (reason) {
        if (!cancelled) {
          setPreview(null);
          setError(reason instanceof Error ? reason.message : tc("error"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, page, tc]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const toPdfBox = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }, canvas: HTMLCanvasElement, shot: Preview) => {
      const rect = canvas.getBoundingClientRect();
      const sx = shot.width / rect.width;
      const sy = shot.height / rect.height;
      const x1 = Math.min(start.x, end.x) * sx;
      const y1 = Math.min(start.y, end.y) * sy;
      const x2 = Math.max(start.x, end.x) * sx;
      const y2 = Math.max(start.y, end.y) * sy;
      const pdfX = x1 / shot.scale;
      const pdfY = (shot.height - y2) / shot.scale;
      const pdfW = (x2 - x1) / shot.scale;
      const pdfH = (y2 - y1) / shot.scale;
      return { page: page - 1, x: pdfX, y: pdfY, w: pdfW, h: pdfH };
    },
    [page]
  );

  const onPointer = (event: React.PointerEvent<HTMLCanvasElement>, kind: "down" | "move" | "up") => {
    const canvas = canvasRef.current;
    if (!canvas || !preview) return;
    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (kind === "down") {
      canvas.setPointerCapture(event.pointerId);
      drag.current = point;
      setDraft({ x: point.x, y: point.y, w: 0, h: 0 });
      return;
    }
    if (!drag.current) return;
    if (kind === "move") {
      const origin = drag.current;
      setDraft({
        x: Math.min(origin.x, point.x),
        y: Math.min(origin.y, point.y),
        w: Math.abs(point.x - origin.x),
        h: Math.abs(point.y - origin.y),
      });
      return;
    }
    const box = toPdfBox(drag.current, point, canvas, preview);
    drag.current = null;
    setDraft(null);
    if (box.w >= 4 && box.h >= 4) onChange([...boxes, box]);
  };

  const pageBoxes = boxes.filter((box) => box.page === page - 1);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label>{tc("page")}</Label>
          <Input
            type="number"
            min={1}
            max={preview?.pageCount ?? 1}
            value={page}
            onChange={(event) => {
              const next = Number(event.target.value) || 1;
              setPage(Math.max(1, preview ? Math.min(preview.pageCount, next) : next));
            }}
            className="w-24"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(boxes.slice(0, -1))} disabled={!boxes.length}>
          {t("undoBox")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([])} disabled={!boxes.length}>
          {t("clearBoxes")}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("drawHint")}</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {preview ? (
        <div className="relative max-w-full overflow-auto rounded-2xl border border-border/60 bg-card">
          <canvas
            ref={(node) => {
              canvasRef.current = node;
              if (!node || !preview) return;
              const image = new Image();
              image.onload = () => {
                const ctx = node.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(image, 0, 0, node.width, node.height);
              };
              image.src = preview.url;
            }}
            width={preview.width}
            height={preview.height}
            className="block max-w-full cursor-crosshair touch-none"
            style={{ aspectRatio: `${preview.width} / ${preview.height}` }}
            onPointerDown={(event) => onPointer(event, "down")}
            onPointerMove={(event) => onPointer(event, "move")}
            onPointerUp={(event) => onPointer(event, "up")}
            onPointerCancel={() => {
              drag.current = null;
              setDraft(null);
            }}
          />
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {pageBoxes.map((box, index) => {
              const x = (box.x * preview.scale / preview.width) * 100;
              const w = (box.w * preview.scale / preview.width) * 100;
              const y = ((preview.height / preview.scale - box.y - box.h) * preview.scale / preview.height) * 100;
              const h = (box.h * preview.scale / preview.height) * 100;
              return (
                <rect
                  key={`${box.x}-${box.y}-${index}`}
                  x={`${x}%`}
                  y={`${y}%`}
                  width={`${w}%`}
                  height={`${h}%`}
                  fill="black"
                  fillOpacity="0.72"
                />
              );
            })}
            {draft && draft.w > 2 && draft.h > 2 && preview ? (
              <rect
                x={draft.x}
                y={draft.y}
                width={draft.w}
                height={draft.h}
                fill="black"
                fillOpacity="0.45"
              />
            ) : null}
          </svg>
        </div>
      ) : null}
    </div>
  );
}
