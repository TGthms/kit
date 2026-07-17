"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { downloadBlob, downloadText, formatBytes } from "@/lib/utils";
import {
  formatJson,
  formatYaml,
  formatToml,
  markdownToHtml,
  htmlToMarkdown,
  csvToJson,
  jsonToCsv,
  textDiff,
  encodeBase64Text,
  decodeBase64Text,
  fileToBase64,
  base64ToBlob,
  urlEncode,
  urlDecode,
} from "@/lib/text/core";
import { ToolShell, useToolHistory } from "./shared";

export function JsonFormat() {
  const t = useTranslations("tools.json-format");
  const tc = useTranslations("common");
  const log = useToolHistory("json-format");
  const [input, setInput] = useState('{\n  "hello": "kit"\n}');
  const [error, setError] = useState("");

  const run = (minify = false) => {
    const r = formatJson(input, minify);
    if (!r.ok) {
      setError(r.error);
      toast.error(r.error);
      log("invalid", "failed");
      return;
    }
    setError("");
    setInput(r.text);
    toast.success(t("success"));
    log(minify ? "minify" : "format", "success");
  };

  return (
    <ToolShell toolId="json-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run(false)}>{tc("beautify")}</Button>
        <Button variant="secondary" onClick={() => run(true)}>
          {tc("minify")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(input);
            toast.success(tc("copied"));
          }}
        >
          {tc("copy")}
        </Button>
        <Button variant="outline" onClick={() => downloadText(input, "data.json", "application/json")}>
          {tc("download")}
        </Button>
      </div>
    </ToolShell>
  );
}

export function YamlFormat() {
  const t = useTranslations("tools.yaml-format");
  const log = useToolHistory("yaml-format");
  const [input, setInput] = useState("hello: kit\n");
  const run = () => {
    const r = formatYaml(input);
    if (!r.ok) {
      toast.error(r.error);
      log("invalid", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log("format", "success");
  };
  return (
    <ToolShell toolId="yaml-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}

export function TomlFormat() {
  const t = useTranslations("tools.toml-format");
  const log = useToolHistory("toml-format");
  const [input, setInput] = useState('title = "Kit"\n');
  const run = () => {
    const r = formatToml(input);
    if (!r.ok) {
      toast.error(r.error);
      log("invalid", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log("format", "success");
  };
  return (
    <ToolShell toolId="toml-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}

export function MarkdownHtml() {
  const t = useTranslations("tools.markdown-html");
  const log = useToolHistory("markdown-html");
  const [input, setInput] = useState("# Hello Kit\n\nPrivate tools.");
  const [toHtml, setToHtml] = useState(true);
  const run = () => {
    try {
      const out = toHtml ? markdownToHtml(input) : htmlToMarkdown(input);
      setInput(out);
      toast.success(t("success"));
      log(toHtml ? "md→html" : "html→md", "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "error");
      log("failed", "failed");
    }
  };
  return (
    <ToolShell toolId="markdown-html">
      <div className="flex gap-2">
        <Button variant={toHtml ? "default" : "outline"} onClick={() => setToHtml(true)}>
          {t("toHtml")}
        </Button>
        <Button variant={!toHtml ? "default" : "outline"} onClick={() => setToHtml(false)}>
          {t("toMd")}
        </Button>
      </div>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}

export function CsvJson() {
  const t = useTranslations("tools.csv-json");
  const log = useToolHistory("csv-json");
  const [input, setInput] = useState("name,role\nKit,toolkit\n");
  const [toJson, setToJson] = useState(true);
  const run = () => {
    const r = toJson ? csvToJson(input) : jsonToCsv(input);
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log(toJson ? "csv→json" : "json→csv", "success");
  };
  return (
    <ToolShell toolId="csv-json">
      <div className="flex gap-2">
        <Button variant={toJson ? "default" : "outline"} onClick={() => setToJson(true)}>
          {t("toJson")}
        </Button>
        <Button variant={!toJson ? "default" : "outline"} onClick={() => setToJson(false)}>
          {t("toCsv")}
        </Button>
      </div>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}

export function TextDiff() {
  const t = useTranslations("tools.text-diff");
  const log = useToolHistory("text-diff");
  const [left, setLeft] = useState("hello\nworld");
  const [right, setRight] = useState("hello\nkit");
  const [parts, setParts] = useState<ReturnType<typeof textDiff>>([]);

  const run = () => {
    const d = textDiff(left, right);
    setParts(d);
    toast.success(t("success"));
    log("diff", "success");
  };

  return (
    <ToolShell toolId="text-diff">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("left")}</Label>
          <Textarea value={left} onChange={(e) => setLeft(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("right")}</Label>
          <Textarea value={right} onChange={(e) => setRight(e.target.value)} />
        </div>
      </div>
      <Button onClick={run}>{t("run")}</Button>
      {parts.length > 0 && (
        <pre className="overflow-auto rounded-2xl border bg-card p-4 text-sm">
          {parts.map((p, i) => (
            <span
              key={i}
              className={
                p.added
                  ? "bg-green-500/20 text-green-800 dark:text-green-300"
                  : p.removed
                    ? "bg-red-500/20 text-red-800 dark:text-red-300"
                    : ""
              }
            >
              {p.value}
            </span>
          ))}
        </pre>
      )}
    </ToolShell>
  );
}

export function Base64Tool() {
  const t = useTranslations("tools.base64");
  const tc = useTranslations("common");
  const log = useToolHistory("base64");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [kind, setKind] = useState<"text" | "file">("text");
  const [text, setText] = useState("Hello Kit");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [out, setOut] = useState("");

  const run = async () => {
    try {
      if (kind === "text") {
        const r = mode === "encode" ? encodeBase64Text(text) : decodeBase64Text(text);
        setOut(r);
        setText(r);
      } else if (files[0]) {
        if (mode === "encode") {
          const b64 = await fileToBase64(files[0].file);
          setOut(b64);
          downloadText(b64, files[0].file.name + ".b64.txt");
        } else {
          const blob = base64ToBlob(text);
          downloadBlob(blob, "decoded.bin");
          setOut(`Decoded ${formatBytes(blob.size)}`);
        }
      }
      toast.success(t("success"));
      log(`${mode}/${kind}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="base64">
      <div className="flex flex-wrap gap-2">
        <Button variant={mode === "encode" ? "default" : "outline"} onClick={() => setMode("encode")}>
          {tc("encode")}
        </Button>
        <Button variant={mode === "decode" ? "default" : "outline"} onClick={() => setMode("decode")}>
          {tc("decode")}
        </Button>
        <Button variant={kind === "text" ? "default" : "outline"} onClick={() => setKind("text")}>
          {t("textMode")}
        </Button>
        <Button variant={kind === "file" ? "default" : "outline"} onClick={() => setKind("file")}>
          {t("fileMode")}
        </Button>
      </div>
      {kind === "file" ? (
        <FileDropzone multiple={false} files={files} onChange={setFiles} />
      ) : null}
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-40" />
      {out && kind === "file" && mode === "encode" && (
        <Textarea value={out} readOnly className="min-h-32" />
      )}
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}

export function UrlEncodeTool() {
  const t = useTranslations("tools.url-encode");
  const tc = useTranslations("common");
  const log = useToolHistory("url-encode");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [text, setText] = useState("hello world");

  const run = () => {
    try {
      setText(mode === "encode" ? urlEncode(text) : urlDecode(text));
      toast.success(t("success"));
      log(mode, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="url-encode">
      <div className="flex gap-2">
        <Button variant={mode === "encode" ? "default" : "outline"} onClick={() => setMode("encode")}>
          {tc("encode")}
        </Button>
        <Button variant={mode === "decode" ? "default" : "outline"} onClick={() => setMode("decode")}>
          {tc("decode")}
        </Button>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}

