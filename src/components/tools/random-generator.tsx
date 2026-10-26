"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Dice5 } from "lucide-react";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  cryptoRandom,
  MAX_RANDOM_BATCH,
  MAX_RANDOM_PASSWORD_LENGTH,
  randomBoolean,
  randomDecimals,
  randomIntegers,
  randomPassword,
  randomPick,
  randomResultSummary,
  randomUnique,
  type RecordableRandomMode,
} from "@/lib/converter/random";
import { downloadText } from "@/lib/utils";
import { ActionBar, ToolLimits, ToolShell, useHistoryNote, useToolHistory } from "./shared";
import { text, toolId } from "./everyday-format";

/** Keeps the password length a whole number within the range this generator produces. */
function limitPasswordLength(raw: string): string {
  if (raw === "") return "";
  const value = Math.floor(Number(raw));
  if (!Number.isFinite(value) || value < 1) return "";
  return String(Math.min(MAX_RANDOM_PASSWORD_LENGTH, value));
}

type RandomMode = "integer" | "decimal" | "boolean" | "pick" | "password";
type RandomResult = { mode: RandomMode; values: string[]; precision: number };

export function RandomGenerator() {
  const t = useTranslations("tools.random-generator");
  const log = useToolHistory(toolId("random-generator"));
  const note = useHistoryNote(toolId("random-generator"));
  const [mode, setMode] = useState<RandomMode>("integer");
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [precision, setPrecision] = useState("2");
  const [step, setStep] = useState("1");
  const [count, setCount] = useState("1");
  const [unique, setUnique] = useState(false);
  const [items, setItems] = useState("red\nblue\ngreen\nyellow");
  const [length, setLength] = useState("16");
  const [result, setResult] = useState<RandomResult | null>(null);
  const [error, setError] = useState("");
  const batch = Math.min(MAX_RANDOM_BATCH, Math.max(1, Number(count) || 1));
  const passwordLength = Math.min(MAX_RANDOM_PASSWORD_LENGTH, Math.max(1, Math.floor(Number(length)) || 1));
  const generate = () => {
    try {
      let next: string[] = [];
      if (mode === "integer") {
        next = randomIntegers(Number(min), Number(max), { count: batch, unique, step: Number(step) || 1 }).map(String);
      } else if (mode === "decimal") {
        next = randomDecimals(Number(min), Number(max), { count: batch, precision: Number(precision) }).map(String);
      } else if (mode === "boolean") {
        next = Array.from({ length: batch }, () => String(randomBoolean()));
      } else if (mode === "pick") {
        const choices = items.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
        next = unique ? randomUnique(choices, batch) : Array.from({ length: batch }, () => randomPick(choices));
      } else {
        next = Array.from({ length: batch }, () => randomPassword({ length: passwordLength, rng: cryptoRandom }));
      }
      // A result belongs to the settings that produced it. Later edits must
      // not reformat it or expose password results to the history action.
      setResult({ mode, values: next, precision: Number(precision) });
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text(t, "invalid", "Check the settings."));
      log(`${mode}: failed`, "failed");
    }
  };
  const values = result?.values ?? [];
  const joined = values.join("\n");
  const numeric = result?.mode === "integer" || result?.mode === "decimal";
  const shown = numeric ? values.map(Number) : [];
  const numberFormat = result?.mode === "decimal"
    ? { minimumFractionDigits: result.precision, maximumFractionDigits: result.precision }
    : undefined;
  return (
    <ToolShell toolId={toolId("random-generator")}>
      <ToolLimits>
        <p>{text(t, "limits", "Everyday picks use the browser random source. Passwords use a cryptographic generator on this device. Not a substitute for a password manager.")}</p>
      </ToolLimits>
      <div className="flex flex-wrap gap-2">
        {(["integer", "decimal", "boolean", "pick", "password"] as const).map((item) => (
          <Button key={item} variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}>
            <Dice5 /> {text(t, item, item[0].toUpperCase() + item.slice(1))}
          </Button>
        ))}
      </div>
      {mode === "integer" || mode === "decimal" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="space-y-2" label={text(t, "minimum", "Minimum")}>
            <Input type="number" value={min} onChange={(event) => setMin(event.target.value)} />
          </Field>
          <Field className="space-y-2" label={text(t, "maximum", "Maximum")}>
            <Input type="number" value={max} onChange={(event) => setMax(event.target.value)} />
          </Field>
          {mode === "integer" ? (
            <Field className="space-y-2" label={text(t, "step", "Count by")}>
              <Input type="number" min="1" value={step} onChange={(event) => setStep(event.target.value)} />
            </Field>
          ) : (
            <Field className="space-y-2" label={text(t, "precision", "Decimal places")}>
              <Input type="number" min="0" max="15" value={precision} onChange={(event) => setPrecision(event.target.value)} />
            </Field>
          )}
        </div>
      ) : null}
      {mode === "pick" ? (
        <Field className="space-y-2" label={text(t, "choices", "Choices, one per line")}>
          <Textarea value={items} onChange={(event) => setItems(event.target.value)} />
        </Field>
      ) : null}
      {mode === "password" ? (
        <Field className="space-y-2" label={text(t, "passwordLength", "Password length")}>
          <Input
            type="number"
            min={1}
            max={MAX_RANDOM_PASSWORD_LENGTH}
            value={length}
            onChange={(event) => setLength(limitPasswordLength(event.target.value))}
          />

        </Field>
      ) : null}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="mb-3 text-sm font-medium">{text(t, "batch", "Batch")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="space-y-2" label={text(t, "count", "How many")}>
            <Input type="number" min="1" max={MAX_RANDOM_BATCH} value={count} onChange={(event) => setCount(event.target.value)} />
          </Field>
          {mode === "integer" || mode === "pick" ? (
            <div className="flex items-end pb-1">
              <label htmlFor="random-unique" className="flex items-center gap-2 text-sm">
                <Switch id="random-unique" checked={unique} onCheckedChange={setUnique} />
                {text(t, "unique", "No repeats")}
              </label>
            </div>
          ) : <p className="self-end text-xs text-muted-foreground">{text(t, "countHint", `Up to ${MAX_RANDOM_BATCH} at once.`, { max: MAX_RANDOM_BATCH })}</p>}
        </div>
      </div>
      <ActionBar onRun={generate} loading={false} label={batch > 1 ? `${text(t, "run", "Generate")} · ${batch}` : text(t, "run", "Generate")} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {values.length ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-4 p-5">
            {numeric && shown.length ? (
              shown.length === 1 ? (
                <AnimatedNumber
                  value={shown[0]}
                  format={numberFormat}
                  className="break-all font-mono text-4xl font-semibold tracking-tight sm:text-5xl"
                />
              ) : (
                <div className="flex max-h-72 flex-wrap content-start gap-2 overflow-auto">
                  {shown.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex h-14 min-w-[4.25rem] items-center justify-center rounded-xl border border-primary/20 bg-background px-3 font-mono text-xl font-semibold tabular-nums"
                    >
                      {shown.length > 10
                        ? (numberFormat ? item.toFixed(numberFormat.minimumFractionDigits ?? 0) : item)
                        : <AnimatedNumber value={item} format={numberFormat} />}
                    </span>
                  ))}
                </div>
              )
            ) : (
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all font-mono text-sm leading-6">{joined}</pre>
            )}
            <div className="flex flex-wrap gap-2">
              <CopyButton value={joined} size="sm" />
              {values.length > 1 ? (
                <Button variant="outline" size="sm" onClick={() => downloadText(joined, "random.txt")}>
                  {text(t, "download", "Download list")}
                </Button>
              ) : null}
              {result && result.mode !== "password" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    note(randomResultSummary(result.mode as RecordableRandomMode, values), text(t, "saved", "Saved to history."));
                  }}
                >
                  <Check /> {text(t, "record", "Record result")}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </ToolShell>
  );
}
