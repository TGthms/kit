"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { blobFromDataUrl, downloadBlob } from "@/lib/utils";
import { generateQrDataUrl, readQrFromImageData } from "@/lib/text/qr";
import { ToolShell, useToolHistory } from "./shared";

export function QrCodeTool() {
  const t = useTranslations("tools.qr-code");
  const tc = useTranslations("common");
  const log = useToolHistory("qr-code");
  const [text, setText] = useState("https://trykit.pages.dev");
  const [dataUrl, setDataUrl] = useState("");
  const [decoded, setDecoded] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);

  const generate = async () => {
    try {
      const url = await generateQrDataUrl(text, 320);
      setDataUrl(url);
      toast.success(t("generated"));
      log("generate", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  const read = async () => {
    if (!files[0]) return;
    try {
      const bmp = await createImageBitmap(files[0].file);
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const value = readQrFromImageData(img.data, img.width, img.height);
      if (!value) throw new Error(t("none"));
      setDecoded(value);
      toast.success(t("decoded"));
      log("read", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="qr-code">
      <div className="space-y-2">
        <Label>{t("payload")}</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <Button onClick={generate}>{t("run")}</Button>
      {dataUrl ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="" className="h-48 w-48 rounded-xl border bg-white p-2" />
          <Button
            variant="outline"
            onClick={() => {
              try {
                downloadBlob(blobFromDataUrl(dataUrl), "qr.png");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : tc("error"));
              }
            }}
          >
            {tc("download")}
          </Button>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label>{t("read")}</Label>
        <FileDropzone accept="image/*" multiple={false} files={files} onChange={setFiles} />
        <Button variant="secondary" onClick={read} disabled={!files[0]}>
          {t("runRead")}
        </Button>
        {decoded ? <Textarea value={decoded} readOnly /> : null}
      </div>
    </ToolShell>
  );
}
