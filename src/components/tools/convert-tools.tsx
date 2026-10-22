"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import YAML from "yaml";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { archiveBlob, downloadBlob, downloadText, extensionForMime } from "@/lib/utils";
import { conversionOutputs, detectConversionInput, type ConversionOutput } from "@/lib/files/conversion";
import { csvToJson, jsonToCsv } from "@/lib/text/core";
import { convertImage, type ImageMime } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ConvertHub() {
  const t = useTranslations("tools.convert-hub");
  const tc = useTranslations("common");
  const log = useToolHistory("convert-hub");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("");
  const [chosenOutput, setOutput] = useState<ConversionOutput>("json");
  const [loading, setLoading] = useState(false);

  const detected = useMemo(() => detectConversionInput(files[0]?.file, text), [files, text]);
  const outputs = conversionOutputs(detected, files.length > 0);
  const output = outputs.includes(chosenOutput) ? chosenOutput : outputs[0];

  const run = async () => {
    setLoading(true);
    try {
      if (!output || !conversionOutputs(detected, files.length > 0).includes(output)) throw new Error(tc("unsupported"));
      // Archives keep binary files binary and do not read the first one as text.
      if (output === "zip") {
        downloadBlob(await archiveBlob(files.map(({ file }) => ({ name: file.name, blob: file }))), "archive.zip");
        toast.success(t("success"));
        log("zip", "success");
        return;
      }
      let inputText = text;
      if (files[0] && !files[0].file.type.startsWith("image/")) {
        inputText = await files[0].file.text();
      }
      if (output === "json" && detected === "yaml") {
        const data = YAML.parse(inputText);
        downloadText(JSON.stringify(data, null, 2), "converted.json", "application/json");
      } else if (output === "yaml" && (detected === "json" || detected === "text")) {
        const data = JSON.parse(inputText);
        downloadText(YAML.stringify(data), "converted.yaml", "text/yaml");
      } else if (output === "json" && detected === "csv") {
        const r = csvToJson(inputText);
        if (!r.ok) throw new Error(r.error);
        downloadText(r.text, "converted.json", "application/json");
      } else if (output === "csv" && detected === "json") {
        const r = jsonToCsv(inputText);
        if (!r.ok) throw new Error(r.error);
        downloadText(r.text, "converted.csv", "text/csv");
      } else if (detected === "image" && files[0] && ["png", "jpeg", "webp"].includes(output)) {
        const mime = output === "png" ? "image/png" : output === "webp" ? "image/webp" : "image/jpeg";
        const blob = await convertImage(files[0].file, mime as ImageMime);
        downloadBlob(blob, `converted.${extensionForMime(blob.type)}`);
      } else {
        throw new Error("Unsupported conversion pair");
      }
      toast.success(t("success"));
      log(`${detected}→${output}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="convert-hub">
      <FileDropzone files={files} onChange={setFiles} />
      <Textarea aria-label={tc("input")} value={text} onChange={(e) => setText(e.target.value)} placeholder="JSON / YAML / CSV…" />
      <p className="text-sm text-muted-foreground">
        {t("detect")}: <strong>{detected}</strong>
      </p>
      <Field className="space-y-2" label={t("chooseOutput")}>
        <select
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-base"
          value={output}
          onChange={(e) => setOutput(e.target.value as ConversionOutput)}
        >
          {outputs.map((format) => <option key={format} value={format}>{format.toUpperCase()}</option>)}
        </select>
      </Field>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length && !text.trim()} />
    </ToolShell>
  );
}

