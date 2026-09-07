"use client";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob, extensionForMime } from "@/lib/utils";
import { cropImage } from "@/lib/image/core";
import { ActionBar, DownloadResult, ToolShell, useToolHistory } from "./shared";

function CropBox({
  x,
  y,
  w,
  h,
  natural,
  onChange,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  natural: { width: number; height: number };
  onChange: (next: { x: number; y: number; w: number; h: number }) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: CropHandle; startX: number; startY: number; orig: { x: number; y: number; w: number; h: number } } | null>(null);

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const parent = boxRef.current?.parentElement;
    if (!drag.current || !parent) return;
    const rect = parent.getBoundingClientRect();
    const scaleX = natural.width / Math.max(rect.width, 1);
    const scaleY = natural.height / Math.max(rect.height, 1);
    const dx = (event.clientX - drag.current.startX) * scaleX;
    const dy = (event.clientY - drag.current.startY) * scaleY;
    const orig = drag.current.orig;
    let nextX = orig.x;
    let nextY = orig.y;
    let nextW = orig.w;
    let nextH = orig.h;
    const handle = drag.current.handle;
    if (handle === "move") {
      nextX = orig.x + dx;
      nextY = orig.y + dy;
    } else {
      if (handle.includes("e")) nextW = orig.w + dx;
      if (handle.includes("s")) nextH = orig.h + dy;
      if (handle.includes("w")) {
        nextX = orig.x + dx;
        nextW = orig.w - dx;
      }
      if (handle.includes("n")) {
        nextY = orig.y + dy;
        nextH = orig.h - dy;
      }
    }
    nextW = Math.max(1, nextW);
    nextH = Math.max(1, nextH);
    nextX = Math.min(Math.max(0, nextX), Math.max(0, natural.width - nextW));
    nextY = Math.min(Math.max(0, nextY), Math.max(0, natural.height - nextH));
    if (nextX + nextW > natural.width) nextW = natural.width - nextX;
    if (nextY + nextH > natural.height) nextH = natural.height - nextY;
    onChange({ x: Math.round(nextX), y: Math.round(nextY), w: Math.round(nextW), h: Math.round(nextH) });
  };

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>, handle: CropHandle) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { handle, startX: event.clientX, startY: event.clientY, orig: { x, y, w, h } };
  };

  const endDrag = () => {
    drag.current = null;
  };

  const handleClass = "absolute z-10 h-3 w-3 rounded-sm border border-white bg-primary shadow";

  return (
    <div
      ref={boxRef}
      className="absolute border-2 border-primary/90 bg-primary/15"
      style={{
        left: `${(x / Math.max(natural.width, 1)) * 100}%`,
        top: `${(y / Math.max(natural.height, 1)) * 100}%`,
        width: `${(w / Math.max(natural.width, 1)) * 100}%`,
        height: `${(h / Math.max(natural.height, 1)) * 100}%`,
        touchAction: "none",
      }}
      onPointerDown={(event) => beginDrag(event, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className={`${handleClass} -left-1.5 -top-1.5 cursor-nwse-resize`} onPointerDown={(event) => beginDrag(event, "nw")} />
      <div className={`${handleClass} -right-1.5 -top-1.5 cursor-nesw-resize`} onPointerDown={(event) => beginDrag(event, "ne")} />
      <div className={`${handleClass} -bottom-1.5 -left-1.5 cursor-nesw-resize`} onPointerDown={(event) => beginDrag(event, "sw")} />
      <div className={`${handleClass} -bottom-1.5 -right-1.5 cursor-nwse-resize`} onPointerDown={(event) => beginDrag(event, "se")} />
      <div className={`${handleClass} -top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize`} onPointerDown={(event) => beginDrag(event, "n")} />
      <div className={`${handleClass} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize`} onPointerDown={(event) => beginDrag(event, "s")} />
      <div className={`${handleClass} -left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize`} onPointerDown={(event) => beginDrag(event, "w")} />
      <div className={`${handleClass} -right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize`} onPointerDown={(event) => beginDrag(event, "e")} />
    </div>
  );
}

type CropHandle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function ImageCrop() {
  const t = useTranslations("tools.image-crop");
  const tc = useTranslations("common");
  const log = useToolHistory("image-crop");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [w, setW] = useState(400);
  const [h, setH] = useState(300);
  const [natural, setNatural] = useState({ width: 400, height: 300 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const previewUrl = useMemo(() => (files[0] ? URL.createObjectURL(files[0].file) : null), [files]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const blob = await cropImage(files[0].file, { x, y, w, h });
      const name = `cropped.${extensionForMime(blob.type, "png")}`;
      downloadBlob(blob, name);
      setResult({ blob, name });
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
    <ToolShell toolId="image-crop">
      <FileDropzone accept="image/*" multiple={false} files={files} onChange={setFiles} />
      {previewUrl ? (
        <div className="overflow-auto rounded-2xl border bg-card">
          <div className="relative inline-block max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="block max-h-[min(28rem,70vh)] w-auto max-w-full"
              onLoad={(event) => {
                const image = event.currentTarget;
                const width = image.naturalWidth;
                const height = image.naturalHeight;
                setNatural({ width, height });
                setX(0);
                setY(0);
                setW(width);
                setH(height);
              }}
            />
            <CropBox
              x={x}
              y={y}
              w={w}
              h={h}
              natural={natural}
              onChange={({ x: nx, y: ny, w: nw, h: nh }) => {
                setX(nx);
                setY(ny);
                setW(nw);
                setH(nh);
              }}
            />
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["x", "y", "w", "h"] as const).map((k) => (
          <div key={k} className="space-y-2">
            <Label>{k.toUpperCase()}</Label>
            <Input
              type="number"
              min={k === "w" || k === "h" ? 1 : 0}
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
      <DownloadResult file={result} />
    </ToolShell>
  );
}
