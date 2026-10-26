"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { blobFromDataUrl, downloadBlob } from "@/lib/utils";
import { generateQrDataUrl, readQrImage } from "@/lib/text/qr";
import { useTaskScope } from "@/lib/react/task-scope";
import { ToolShell, useToolHistory } from "./shared";

export function QrCodeTool() {
  const t = useTranslations("tools.qr-code");
  const tc = useTranslations("common");
  const log = useToolHistory("qr-code");
  const [text, setText] = useState("https://trykit.pages.dev");
  const [dataUrl, setDataUrl] = useState("");
  const [decoded, setDecoded] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const generation = useTaskScope();
  const decoding = useTaskScope();

  const generate = async () => {
    const current = generation.begin();
    try {
      const url = await generateQrDataUrl(text, 320);
      if (!current()) return;
      setDataUrl(url);
      toast.success(t("generated"));
      log("generate", "success");
    } catch (e) {
      if (!current()) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  const read = async () => {
    if (!files[0]) return;
    const current = decoding.begin();
    try {
      const value = await readQrImage(files[0].file);
      if (!current()) return;
      if (!value) throw new Error(t("none"));
      setDecoded(value);
      toast.success(t("decoded"));
      log("read", "success");
    } catch (e) {
      if (!current()) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="qr-code">
      <Field className="space-y-2" label={t("payload")}>
        <Textarea value={text} onChange={(e) => { generation.invalidate(); setDataUrl(""); setText(e.target.value); }} />
      </Field>
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
        <p className="text-sm font-medium">{t("read")}</p>
        <FileDropzone accept="image/*" multiple={false} files={files} onChange={(next) => { decoding.invalidate(); setDecoded(""); setFiles(next); }} />
        <Button variant="secondary" onClick={read} disabled={!files[0]}>
          {t("runRead")}
        </Button>
        {decoded ? <Textarea aria-label={tc("output")} value={decoded} readOnly /> : null}
      </div>
    </ToolShell>
  );
}
