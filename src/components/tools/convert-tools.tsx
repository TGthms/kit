"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/field";
import { archiveBlob, extensionForMime } from "@/lib/utils";
import { conversionOutputs, detectConversionInput, type ConversionOutput } from "@/lib/files/conversion";
import { assertTextBudget, MAX_TEXT_LENGTH } from "@/lib/text/budget";
import { convertDocument } from "@/lib/text/document-client";
import { convertImage, type ImageMime } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ConvertHub() {
  const t = useTranslations("tools.convert-hub");
  const tc = useTranslations("common");
  const log = useToolHistory("convert-hub");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("");
  const [chosenOutput, setOutput] = useState<ConversionOutput>("json");
  const [spreadsheetSafe, setSpreadsheetSafe] = useState(true);
  const job = useToolJob([files, text, chosenOutput, spreadsheetSafe]);
  const loading = job.loading;

  const detected = useMemo(() => detectConversionInput(files[0]?.file, text), [files, text]);
  const outputs = conversionOutputs(detected, files.length > 0);
  const output = outputs.includes(chosenOutput) ? chosenOutput : outputs[0];

  const run = async () => {
    const ac = job.start();
    try {
      if (!output || !conversionOutputs(detected, files.length > 0).includes(output)) throw new Error(tc("unsupported"));
      // Archives keep binary files binary and do not read the first one as text.
      if (output === "zip") {
        if (!job.complete(ac, [{ blob: await archiveBlob(files.map(({ file }) => ({ name: file.name, blob: file }))), name: "archive.zip" }])) return;
        toast.success(t("success"));
        log("zip", "success");
        return;
      }
      let inputText = text;
      if (files[0] && !files[0].file.type.startsWith("image/")) {
        if (files[0].file.size > MAX_TEXT_LENGTH) throw new RangeError("Use a document of 1 MB or less for text conversion.");
        inputText = await files[0].file.text();
      }
      assertTextBudget(inputText);
      if (ac.signal.aborted) return;
      if (["json", "yaml", "csv"].includes(output) && detected !== "image") {
        const converted = await convertDocument(inputText, detected, output, spreadsheetSafe, ac.signal);
        if (!job.complete(ac, [{ blob: new Blob([converted], { type: output === "json" ? "application/json" : output === "csv" ? "text/csv" : "text/yaml" }), name: `converted.${output}` }])) return;
      } else if (detected === "image" && files[0] && ["png", "jpeg", "webp"].includes(output)) {
        const mime = output === "png" ? "image/png" : output === "webp" ? "image/webp" : "image/jpeg";
        const blob = await convertImage(files[0].file, mime as ImageMime);
        if (!job.complete(ac, [{ blob: blob, name: `converted.${extensionForMime(blob.type)}` }])) return;
      } else {
        throw new Error("Unsupported conversion pair");
      }
      toast.success(t("success"));
      log(`${detected}→${output}`, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
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
      {output === "csv" && <label className="flex items-center gap-3 text-sm"><Switch checked={spreadsheetSafe} onCheckedChange={setSpreadsheetSafe} />{tc("spreadsheetSafe")}</label>}
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files.length && !text.trim()} />
      <FileJobResult job={job} />
    </ToolShell>
  );
}

