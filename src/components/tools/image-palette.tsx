"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { extractPalette, type PaletteColor } from "@/lib/image/palette";
import { ToolShell, useToolHistory } from "./shared";

export function ImagePalette() {
  const t = useTranslations("tools.image-palette");
  const tc = useTranslations("common");
  const log = useToolHistory("image-palette");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [colors, setColors] = useState<PaletteColor[]>([]);
  const [maxColors, setMaxColors] = useState("6");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) {
      toast.error(t("needImage"));
      return;
    }
    setLoading(true);
    try {
      const bmp = await createImageBitmap(files[0].file);
      const maxSide = 256;
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const width = Math.max(1, Math.round(bmp.width * scale));
      const height = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(tc("error"));
      ctx.drawImage(bmp, 0, 0, width, height);
      bmp.close();
      const imageData = ctx.getImageData(0, 0, width, height);
      const palette = extractPalette(imageData, { maxColors: Number(maxColors) || 6 });
      setColors(palette);
      log(`${palette.length} colors`, "success");
      toast.success(t("success"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-palette">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <FileDropzone accept="image/*" multiple={false} files={files} onChange={setFiles} />
      <Field label={t("maxColors")}>
        <Input type="number" min={1} max={24} value={maxColors} onChange={(e) => setMaxColors(e.target.value)} />
      </Field>
      <Button onClick={run} disabled={loading || !files[0]}>
        {loading ? tc("processing") : t("run")}
      </Button>
      {colors.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {colors.map((c) => (
            <li key={c.hex} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
              <span className="h-10 w-10 shrink-0 rounded-xl border" style={{ backgroundColor: c.hex }} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium">{c.hex}</p>
                <p className="text-xs text-muted-foreground">{t("pixels", { count: c.count })}</p>
              </div>
              <CopyButton value={c.hex} size="sm" />
            </li>
          ))}
        </ul>
      ) : null}
    </ToolShell>
  );
}
