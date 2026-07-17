"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import YAML from "yaml";
import JSZip from "jszip";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { downloadBlob, downloadText } from "@/lib/utils";
import { csvToJson, jsonToCsv } from "@/lib/text/core";
import { convertImage, type ImageMime } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ConvertHub() {
  const t = useTranslations("tools.convert-hub");
  const tc = useTranslations("common");
  const log = useToolHistory("convert-hub");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("");
  const [output, setOutput] = useState("json");
  const [loading, setLoading] = useState(false);

  const detected = useMemo(() => {
    if (files[0]) {
      const n = files[0].file.name.toLowerCase();
      if (n.endsWith(".json")) return "json";
      if (n.endsWith(".yaml") || n.endsWith(".yml")) return "yaml";
      if (n.endsWith(".csv")) return "csv";
      if (n.endsWith(".zip")) return "zip";
      if (files[0].file.type.startsWith("image/")) return "image";
      return "file";
    }
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) return "json";
    if (text.includes(",") && text.includes("\n")) return "csv";
    return "text";
  }, [files, text]);

  const run = async () => {
    setLoading(true);
    try {
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
      } else if (output === "zip" && files.length) {
        const zip = new JSZip();
        for (const f of files) zip.file(f.file.name, f.file);
        downloadBlob(await zip.generateAsync({ type: "blob" }), "archive.zip");
      } else if (detected === "image" && files[0]) {
        const mime = output === "png" ? "image/png" : output === "webp" ? "image/webp" : "image/jpeg";
        const blob = await convertImage(files[0].file, mime as ImageMime);
        downloadBlob(blob, `converted.${output}`);
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
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="JSON / YAML / CSV…" />
      <p className="text-sm text-muted-foreground">
        {t("detect")}: <strong>{detected}</strong>
      </p>
      <div className="space-y-2">
        <Label>{t("chooseOutput")}</Label>
        <select
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={output}
          onChange={(e) => setOutput(e.target.value)}
        >
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="csv">CSV</option>
          <option value="zip">ZIP</option>
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
          <option value="webp">WEBP</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} />
    </ToolShell>
  );
}

