"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { decodeJwt } from "@/lib/text/jwt";
import { nowTimestamp, parseTimestamp } from "@/lib/text/timestamp";
import { explainCron } from "@/lib/text/cron";
import { convertBase } from "@/lib/text/base";
import { decodeHtmlEntities, encodeHtmlEntities } from "@/lib/text/entities";
import { convertCase, type CaseStyle } from "@/lib/text/case";
import { generatePassword } from "@/lib/text/password";
import { jsonToTypescript } from "@/lib/text/json-types";
import { ToolShell, useToolHistory } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function JwtDecode() {
  const t = useTranslations("tools.jwt-decode");
  const log = useToolHistory("jwt-decode");
  const [token, setToken] = useState("");
  const result = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);

  return (
    <ToolShell toolId="jwt-decode">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <Textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="min-h-32 font-mono"
        placeholder="eyJhbGciOi..."
      />
      {result && !result.ok ? <p className="text-sm text-destructive">{result.error}</p> : null}
      {result?.ok ? (
        <div className="space-y-3">
          <pre className="overflow-auto rounded-2xl border bg-card p-3 text-xs">
            {JSON.stringify(result.header.json, null, 2)}
          </pre>
          <pre className="overflow-auto rounded-2xl border bg-card p-3 text-xs">
            {JSON.stringify(result.payload.json, null, 2)}
          </pre>
          <p className="text-xs text-muted-foreground">
            {result.signed ? t("hasSig") : t("noSig")}
          </p>
        </div>
      ) : null}
      <Button
        onClick={() => {
          if (result?.ok) {
            toast.success(t("success"));
            log("decode", "success");
          } else {
            toast.error(result?.ok === false ? result.error : t("empty"));
            log("failed", "failed");
          }
        }}
      >
        {t("run")}
      </Button>
    </ToolShell>
  );
}

export function UnixTimestamp() {
  const t = useTranslations("tools.unix-timestamp");
  const tc = useTranslations("common");
  const log = useToolHistory("unix-timestamp");
  const [value, setValue] = useState(() => String(nowTimestamp().unix));
  const parsed = parseTimestamp(value);

  return (
    <ToolShell toolId="unix-timestamp">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setValue(String(nowTimestamp().unix));
            log("now", "success");
          }}
        >
          {t("now")}
        </Button>
      </div>
      <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
      {parsed.ok ? (
        <div className="space-y-1 rounded-2xl border bg-card p-4 text-sm">
          <p>
            <strong>Unix</strong> {parsed.unix}
          </p>
          <p>
            <strong>ISO</strong> {parsed.iso}
          </p>
          <p>
            <strong>UTC</strong> {parsed.utc}
          </p>
          <p>
            <strong>Local</strong> {parsed.local}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(parsed.iso);
              toast.success(tc("copied"));
            }}
          >
            {tc("copy")} ISO
          </Button>
        </div>
      ) : (
        <p className="text-sm text-destructive">{parsed.error}</p>
      )}
    </ToolShell>
  );
}

export function CronExplain() {
  const t = useTranslations("tools.cron-explain");
  const log = useToolHistory("cron-explain");
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");
  const result = explainCron(expr);

  return (
    <ToolShell toolId="cron-explain">
      <Input value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono" />
      {result.ok ? (
        <p className="rounded-2xl border bg-card p-4 text-sm">{result.text}</p>
      ) : (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
      <Button
        onClick={() => {
          if (result.ok) {
            toast.success(t("success"));
            log(expr, "success");
          } else {
            toast.error(result.error);
            log("failed", "failed");
          }
        }}
      >
        {t("run")}
      </Button>
    </ToolShell>
  );
}

export function NumberBase() {
  const t = useTranslations("tools.number-base");
  const [input, setInput] = useState("255");
  const [from, setFrom] = useState(10);
  const [to, setTo] = useState(16);
  const result = convertBase(input, from, to);

  return (
    <ToolShell toolId="number-base">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-3">
          <Label>{t("value")}</Label>
          <Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label>{t("from")}</Label>
          <Input type="number" min={2} max={36} value={from} onChange={(e) => setFrom(Number(e.target.value) || 10)} />
        </div>
        <div className="space-y-2">
          <Label>{t("to")}</Label>
          <Input type="number" min={2} max={36} value={to} onChange={(e) => setTo(Number(e.target.value) || 16)} />
        </div>
      </div>
      {result.ok ? (
        <div className="rounded-2xl border bg-card p-4 font-mono text-sm">
          <p>{result.value}</p>
          <p className="mt-1 text-muted-foreground">dec {result.decimal}</p>
        </div>
      ) : (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
    </ToolShell>
  );
}

export function HtmlEntities() {
  const t = useTranslations("tools.html-entities");
  const log = useToolHistory("html-entities");
  const [text, setText] = useState("<Hello & goodbye>");
  const [encode, setEncode] = useState(true);

  const run = () => {
    setText(encode ? encodeHtmlEntities(text) : decodeHtmlEntities(text));
    toast.success(t("success"));
    log(encode ? "enc" : "dec", "success");
  };

  return (
    <ToolShell toolId="html-entities">
      <div className="flex gap-2">
        <Button variant={encode ? "default" : "outline"} onClick={() => setEncode(true)}>
          {t("encode")}
        </Button>
        <Button variant={!encode ? "default" : "outline"} onClick={() => setEncode(false)}>
          {t("decode")}
        </Button>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-40 font-mono" />
      <Button onClick={run}>{t("run")}</Button>
    </ToolShell>
  );
}

export function CaseConvert() {
  const t = useTranslations("tools.case-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("case-convert");
  const [text, setText] = useState("Hello Kit World");
  const [style, setStyle] = useState<CaseStyle>("camel");

  const run = () => {
    setText(convertCase(text, style));
    toast.success(t("success"));
    log(style, "success");
  };

  return (
    <ToolShell toolId="case-convert">
      <div className="space-y-2">
        <Label>{t("style")}</Label>
        <select className={selectClass} value={style} onChange={(e) => setStyle(e.target.value as CaseStyle)}>
          <option value="camel">camelCase</option>
          <option value="pascal">PascalCase</option>
          <option value="snake">snake_case</option>
          <option value="kebab">kebab-case</option>
          <option value="constant">CONSTANT_CASE</option>
          <option value="title">Title Case</option>
          <option value="sentence">Sentence case</option>
          <option value="lower">lower case</option>
          <option value="upper">UPPER CASE</option>
        </select>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(text);
            toast.success(tc("copied"));
          }}
        >
          {tc("copy")}
        </Button>
      </div>
    </ToolShell>
  );
}

export function PasswordGenerator() {
  const t = useTranslations("tools.password-generator");
  const tc = useTranslations("common");
  const log = useToolHistory("password-generator");
  const [length, setLength] = useState(20);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [out, setOut] = useState("");

  const run = () => {
    try {
      const pw = generatePassword({ length, lower, upper, digits, symbols });
      setOut(pw);
      toast.success(t("success"));
      log(String(length), "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="password-generator">
      <div className="space-y-2">
        <Label>
          {t("length")}: {length}
        </Label>
        <Input type="number" min={4} max={128} value={length} onChange={(e) => setLength(Number(e.target.value) || 16)} />
      </div>
      {(
        [
          ["lower", lower, setLower],
          ["upper", upper, setUpper],
          ["digits", digits, setDigits],
          ["symbols", symbols, setSymbols],
        ] as const
      ).map(([key, val, set]) => (
        <div key={key} className="flex items-center gap-2">
          <Switch checked={val} onCheckedChange={set} id={key} />
          <Label htmlFor={key}>{t(key)}</Label>
        </div>
      ))}
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <Button
          variant="outline"
          disabled={!out}
          onClick={() => {
            navigator.clipboard.writeText(out);
            toast.success(tc("copied"));
          }}
        >
          {tc("copy")}
        </Button>
      </div>
      {out ? <Input readOnly value={out} className="font-mono" /> : null}
    </ToolShell>
  );
}

export function JsonTypes() {
  const t = useTranslations("tools.json-types");
  const tc = useTranslations("common");
  const log = useToolHistory("json-types");
  const [input, setInput] = useState('{\n  "name": "Kit",\n  "ok": true\n}');

  const run = () => {
    const r = jsonToTypescript(input, "Root");
    if (!r.ok) {
      toast.error(r.error);
      log("failed", "failed");
      return;
    }
    setInput(r.text);
    toast.success(t("success"));
    log("types", "success");
  };

  return (
    <ToolShell toolId="json-types">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64 font-mono" />
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(input);
            toast.success(tc("copied"));
          }}
        >
          {tc("copy")}
        </Button>
      </div>
    </ToolShell>
  );
}
