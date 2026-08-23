"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadMany, extensionForMime } from "@/lib/utils";
import { rotateImage, flipImage, filterImage, exportFavicons } from "@/lib/image/core";
import type { FilterName } from "@/lib/image/transform";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ImageRotate() {
  const t = useTranslations("tools.image-rotate");
  const tc = useTranslations("common");
  const log = useToolHistory("image-rotate");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [op, setOp] = useState<"90" | "180" | "270" | "h" | "v">("90");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items: Array<{ blob: Blob; name: string }> = [];
      for (const f of files) {
        const blob =
          op === "h" || op === "v"
            ? await flipImage(f.file, op)
            : await rotateImage(f.file, Number(op) as 90 | 180 | 270);
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-rotated.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "rotated-images.zip");
      toast.success(t("success", { count: files.length }));
      log(op, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-rotate">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("operation")}</Label>
        <select className={selectClass} value={op} onChange={(e) => setOp(e.target.value as typeof op)}>
          <option value="90">{t("rot90")}</option>
          <option value="180">{t("rot180")}</option>
          <option value="270">{t("rot270")}</option>
          <option value="h">{t("flipH")}</option>
          <option value="v">{t("flipV")}</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}

export function ImageFilters() {
  const t = useTranslations("tools.image-filters");
  const tc = useTranslations("common");
  const log = useToolHistory("image-filters");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filter, setFilter] = useState<Exclude<FilterName, "none">>("grayscale");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items: Array<{ blob: Blob; name: string }> = [];
      for (const f of files) {
        const blob = await filterImage(f.file, filter);
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-${filter}.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "filtered-images.zip");
      toast.success(t("success", { count: files.length }));
      log(filter, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-filters">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("filter")}</Label>
        <select
          className={selectClass}
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="grayscale">{t("grayscale")}</option>
          <option value="sepia">{t("sepia")}</option>
          <option value="invert">{t("invert")}</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}

export function ImageWatermark() {
  const t = useTranslations("tools.image-watermark");
  const tc = useTranslations("common");
  const log = useToolHistory("image-watermark");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("");
  const [position, setPosition] = useState<"center" | "bottom-right" | "bottom-left" | "top-right">(
    "bottom-right"
  );
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length || !text.trim()) return;
    setLoading(true);
    try {
      const { watermarkImage } = await import("@/lib/image/core");
      const { downloadMany } = await import("@/lib/utils");
      const items = [];
      for (const f of files) {
        const blob = await watermarkImage(f.file, { text: text.trim(), position });
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-marked.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "watermarked-images.zip");
      toast.success(t("success", { count: files.length }));
      log(position, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-watermark">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("text")}</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t("position")}</Label>
        <select
          className={selectClass}
          value={position}
          onChange={(e) => setPosition(e.target.value as typeof position)}
        >
          <option value="bottom-right">{t("bottomRight")}</option>
          <option value="bottom-left">{t("bottomLeft")}</option>
          <option value="top-right">{t("topRight")}</option>
          <option value="center">{t("center")}</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length || !text.trim()} />
    </ToolShell>
  );
}

export function ImageFavicon() {
  const t = useTranslations("tools.image-favicon");
  const tc = useTranslations("common");
  const log = useToolHistory("image-favicon");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const items = await exportFavicons(files[0].file);
      await downloadMany(items, "favicon-pack.zip");
      toast.success(t("success"));
      log(`${items.length} sizes`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-favicon">
      <p className="text-sm text-muted-foreground">{t("note")}</p>
      <FileDropzone accept="image/*" multiple={false} files={files} onChange={setFiles} />
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}
