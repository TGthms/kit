"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import JSZip from "jszip";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { downloadBlob, downloadMany, extensionForMime } from "@/lib/utils";
import { parseImageMetadata } from "@/lib/image/exif";
import {
  compressImage,
  resizeImage,
  cropImage,
  convertImage,
  stripMetadata,
  adjustImage,
  type ImageMime,
} from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ImageCompress() {
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
        const name = f.file.name.replace(/\.\w+$/, "") + `-compressed.${extensionForMime(blob.type, "jpg")}`;
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
    <ToolShell toolId="image-compress">
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
    </ToolShell>
  );
}

export function ImageResize() {
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
      const items = [];
      for (const f of files) {
        const blob = await resizeImage(f.file, { width, height, lockAspect: lock });
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-resized.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "resized-images.zip");
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
    <ToolShell toolId="image-resize">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{tc("width")}</Label>
          <Input type="number" min={0} value={width} onChange={(e) => setWidth(Number(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>{tc("height")}</Label>
          <Input type="number" min={0} value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <Switch checked={lock} onCheckedChange={setLock} id="lock" />
          <Label htmlFor="lock">{t("lockAspect")}</Label>
        </div>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}

export function ImageCrop() {
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
      downloadBlob(blob, `cropped.${extensionForMime(blob.type, "png")}`);
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
    </ToolShell>
  );
}

export function ImageConvert() {
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
      const items = [];
      for (const f of files) {
        const blob = await convertImage(f.file, mime);
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `.${extensionForMime(blob.type, "webp")}`,
        });
      }
      await downloadMany(items, "converted-images.zip");
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
    <ToolShell toolId="image-convert">
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
    </ToolShell>
  );
}

export function ImageMetadata() {
  const t = useTranslations("tools.image-metadata");
  const tc = useTranslations("common");
  const log = useToolHistory("image-metadata");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [tags, setTags] = useState<Array<{ tag: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);

  const onFiles = async (items: FileItem[]) => {
    setFiles(items);
    if (!items[0]) {
      setTags([]);
      return;
    }
    try {
      const bytes = new Uint8Array(await items[0].file.arrayBuffer());
      setTags(parseImageMetadata(bytes));
    } catch {
      setTags([]);
    }
  };

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items = [];
      for (const f of files) {
        const blob = await stripMetadata(f.file);
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-clean.${extensionForMime(blob.type, "jpg")}`,
        });
      }
      await downloadMany(items, "stripped-images.zip");
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
    <ToolShell toolId="image-metadata">
      <p className="text-sm text-muted-foreground">{t("note")}</p>
      <FileDropzone accept="image/*" files={files} onChange={onFiles} />
      {files[0] ? (
        tags.length ? (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="px-3 py-2 font-medium">{t("tag")}</th>
                  <th className="px-3 py-2 font-medium">{t("value")}</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((row) => (
                  <tr key={row.tag} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 font-medium">{row.tag}</td>
                    <td className="px-3 py-2 break-all">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noExif")}</p>
        )
      ) : null}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}

export function ImageAdjust() {
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
      const items = [];
      for (const f of files) {
        const blob = await adjustImage(f.file, { brightness, contrast, saturation });
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-adjusted.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "adjusted-images.zip");
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
    <ToolShell toolId="image-adjust">
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
    </ToolShell>
  );
}

