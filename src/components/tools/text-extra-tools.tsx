"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { notifyCopied } from "@/lib/notify";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/utils";
import { xmlToJsonText, jsonToXmlText } from "@/lib/text/xml";
import { formatSql } from "@/lib/text/sql";
import { runRegex, replaceRegex } from "@/lib/text/regex";
import { HASH_ALGOS, hashBytes, hashText, type HashAlgo } from "@/lib/text/hash";
import { generateUuids } from "@/lib/text/uuid";
import { convertColor, hslToRgb, rgbToHex } from "@/lib/text/color";
import { generateLorem, type LoremMode } from "@/lib/text/lorem";
import { generateQrDataUrl, readQrFromImageData } from "@/lib/text/qr";
import { ToolShell, useToolHistory } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function XmlJson() {
  const t = useTranslations("tools.xml-json");
  const log = useToolHistory("xml-json");
  const [input, setInput] = useState("<note><to>Kit</to></note>");
  const [toJson, setToJson] = useState(true);

  const run = () => {
    const r = toJson ? xmlToJsonText(input) : jsonToXmlText(input, "root");
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log(toJson ? "xml→json" : "json→xml", "success");
  };

  return (
    <ToolShell toolId="xml-json">
      <div className="flex gap-2">
        <Button variant={toJson ? "default" : "outline"} onClick={() => setToJson(true)}>
          {t("toJson")}
        </Button>
        <Button variant={!toJson ? "default" : "outline"} onClick={() => setToJson(false)}>
          {t("toXml")}
        </Button>
      </div>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}

export function SqlFormat() {
  const t = useTranslations("tools.sql-format");
  const log = useToolHistory("sql-format");
  const [input, setInput] = useState("select id, name from users where active = 1 order by name");

  const run = () => {
    const r = formatSql(input);
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log("format", "success");
  };

  return (
    <ToolShell toolId="sql-format">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64 font-mono" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}

export function RegexTester() {
  const t = useTranslations("tools.regex-tester");
  const log = useToolHistory("regex-tester");
  const [pattern, setPattern] = useState("(\\w+)");
  const [flags, setFlags] = useState("g");
  const [input, setInput] = useState("hello kit world");
  const [repl, setRepl] = useState("$1!");
  const [out, setOut] = useState("");

  const result = useMemo(() => runRegex(pattern, flags, input), [pattern, flags, input]);

  const replace = () => {
    const r = replaceRegex(pattern, flags, input, repl);
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setOut(r.text);
    toast.success(t("success"));
    log("replace", "success");
  };

  return (
    <ToolShell toolId="regex-tester">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("pattern")}</Label>
          <Input value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label>{t("flags")}</Label>
          <Input value={flags} onChange={(e) => setFlags(e.target.value)} className="font-mono" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("input")}</Label>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-32 font-mono" />
      </div>
      {!result.ok ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("matches", { count: result.matches.length })}</p>
      )}
      {result.ok && result.matches.length > 0 && (
        <ul className="space-y-1 rounded-2xl border bg-card p-3 text-sm">
          {result.matches.map((m, i) => (
            <li key={`${m.index}-${i}`}>
              <span className="text-muted-foreground">{m.index}</span> {m.text}
              {m.groups.length ? `  (${m.groups.join(", ")})` : ""}
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2">
        <Label>{t("replace")}</Label>
        <Input value={repl} onChange={(e) => setRepl(e.target.value)} className="font-mono" />
      </div>
      <Button onClick={replace}>{t("runReplace")}</Button>
      {out ? <Textarea value={out} readOnly className="min-h-24 font-mono" /> : null}
    </ToolShell>
  );
}

export function HashGenerator() {
  const t = useTranslations("tools.hash-generator");
  const tc = useTranslations("common");
  const log = useToolHistory("hash-generator");
  const [algo, setAlgo] = useState<HashAlgo>("SHA-256");
  const [text, setText] = useState("Hello Kit");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [digest, setDigest] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const value = files[0]
        ? await hashBytes(new Uint8Array(await files[0].file.arrayBuffer()), algo)
        : await hashText(text, algo);
      setDigest(value);
      toast.success(t("success"));
      log(algo, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="hash-generator">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <div className="space-y-2">
        <Label>{t("algo")}</Label>
        <select className={selectClass} value={algo} onChange={(e) => setAlgo(e.target.value as HashAlgo)}>
          {HASH_ALGOS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-28 font-mono" />
      <FileDropzone multiple={false} files={files} onChange={setFiles} />
      <Button onClick={run} disabled={loading}>
        {loading ? tc("processing") : t("run")}
      </Button>
      {digest ? (
        <div className="space-y-2">
          <Label>{t("digest")}</Label>
          <Textarea value={digest} readOnly className="min-h-20 break-all font-mono" />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(digest);
              notifyCopied(tc("copied"));
            }}
          >
            {tc("copy")}
          </Button>
        </div>
      ) : null}
    </ToolShell>
  );
}

export function UuidGenerator() {
  const t = useTranslations("tools.uuid-generator");
  const tc = useTranslations("common");
  const log = useToolHistory("uuid-generator");
  const [count, setCount] = useState(5);
  const [version, setVersion] = useState<4 | 7>(4);
  const [out, setOut] = useState("");

  const run = () => {
    const list = generateUuids(count, version);
    setOut(list.join("\n"));
    toast.success(t("success"));
    log(`v${version}×${count}`, "success");
  };

  return (
    <ToolShell toolId="uuid-generator">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("count")}</Label>
          <Input type="number" min={1} max={1000} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} />
        </div>
        <div className="space-y-2">
          <Label>{t("version")}</Label>
          <select
            className={selectClass}
            value={version}
            onChange={(e) => setVersion(Number(e.target.value) as 4 | 7)}
          >
            <option value={4}>UUID v4</option>
            <option value={7}>UUID v7</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(out);
            notifyCopied(tc("copied"));
          }}
          disabled={!out}
        >
          {tc("copy")}
        </Button>
      </div>
      {out ? <Textarea value={out} readOnly className="min-h-40 font-mono" /> : null}
    </ToolShell>
  );
}

export function ColorConvert() {
  const t = useTranslations("tools.color-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("color-convert");
  const [hex, setHex] = useState("#0a84ff");
  const parsed = convertColor(hex);

  return (
    <ToolShell toolId="color-convert">
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <input
          type="color"
          aria-label={t("picker")}
          className="h-12 w-16 cursor-pointer rounded-xl border bg-background"
          value={parsed?.hex ?? "#000000"}
          onChange={(e) => {
            setHex(e.target.value);
            log("pick", "success");
          }}
        />
        <div className="space-y-2">
          <Label>HEX</Label>
          <Input value={hex} onChange={(e) => setHex(e.target.value)} className="font-mono" />
        </div>
      </div>
      {parsed ? (
        <div className="grid gap-2 rounded-2xl border bg-card p-4 text-sm">
          <p>
            <strong>RGB</strong> {parsed.cssRgb}
          </p>
          <p>
            <strong>HSL</strong> {parsed.cssHsl}
          </p>
          <p>
            <strong>HSV</strong> {Math.round(parsed.hsv.h)}°, {Math.round(parsed.hsv.s)}%, {Math.round(parsed.hsv.v)}%
          </p>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(parsed.hex);
              notifyCopied(tc("copied"));
            }}
          >
            {tc("copy")} {parsed.hex}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      )}
      <p className="sr-only">
        {parsed ? rgbToHex(hslToRgb(parsed.hsl)) : ""}
      </p>
    </ToolShell>
  );
}

export function LoremIpsum() {
  const t = useTranslations("tools.lorem-ipsum");
  const tc = useTranslations("common");
  const log = useToolHistory("lorem-ipsum");
  const [count, setCount] = useState(2);
  const [mode, setMode] = useState<LoremMode>("paragraphs");
  const [out, setOut] = useState("");

  const run = () => {
    const text = generateLorem(count, mode);
    setOut(text);
    toast.success(t("success"));
    log(`${mode}:${count}`, "success");
  };

  return (
    <ToolShell toolId="lorem-ipsum">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("count")}</Label>
          <Input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} />
        </div>
        <div className="space-y-2">
          <Label>{t("mode")}</Label>
          <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as LoremMode)}>
            <option value="paragraphs">{t("paragraphs")}</option>
            <option value="sentences">{t("sentences")}</option>
            <option value="words">{t("words")}</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(out);
            notifyCopied(tc("copied"));
          }}
          disabled={!out}
        >
          {tc("copy")}
        </Button>
      </div>
      {out ? <Textarea value={out} readOnly className="min-h-48" /> : null}
    </ToolShell>
  );
}

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
              fetch(dataUrl)
                .then((r) => r.blob())
                .then((b) => downloadBlob(b, "qr.png"));
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
