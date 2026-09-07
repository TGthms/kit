"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Dice5 } from "lucide-react";
import { notifyHistorySaved } from "@/lib/notify";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  cryptoRandom,
  MAX_RANDOM_BATCH,
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
import { ActionBar, ToolLimits, ToolShell, useToolHistory } from "./shared";
import { text, toolId } from "./everyday-format";

export function RandomGenerator() {
  const t = useTranslations("tools.random-generator");
  const log = useToolHistory(toolId("random-generator"));
  const [mode, setMode] = useState<"integer" | "decimal" | "boolean" | "pick" | "password">("integer");
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [precision, setPrecision] = useState("2");
  const [step, setStep] = useState("1");
  const [count, setCount] = useState("1");
  const [unique, setUnique] = useState(false);
  const [items, setItems] = useState("red\nblue\ngreen\nyellow");
  const [length, setLength] = useState("16");
  const [values, setValues] = useState<string[]>([]);
  const [shown, setShown] = useState<number[]>([]);
  const [error, setError] = useState("");
  const roll = useRef(0);
  const batch = Math.min(MAX_RANDOM_BATCH, Math.max(1, Number(count) || 1));
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
        next = Array.from({ length: batch }, () => randomPassword({ length: Number(length), rng: cryptoRandom }));
      }
      setValues(next);
      setError("");
      const numericNext = mode === "integer" || mode === "decimal";
      const id = ++roll.current;
      if (numericNext) {
        const nums = next.map(Number);
        const reduce = nums.length > 10 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) setShown(nums);
        else {
          setShown(nums.map(() => 0));
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              if (roll.current === id) setShown(nums);
            });
          });
        }
      } else {
        setShown([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text(t, "invalid", "Check the settings."));
      log(`${mode}: failed`, "failed");
    }
  };
  const joined = values.join("\n");
  const numeric = mode === "integer" || mode === "decimal";
  const numberFormat = mode === "decimal"
    ? { minimumFractionDigits: Number(precision) || 0, maximumFractionDigits: Number(precision) || 0 }
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
          <div className="space-y-2">
            <Label>{text(t, "minimum", "Minimum")}</Label>
            <Input type="number" value={min} onChange={(event) => setMin(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{text(t, "maximum", "Maximum")}</Label>
            <Input type="number" value={max} onChange={(event) => setMax(event.target.value)} />
          </div>
          {mode === "integer" ? (
            <div className="space-y-2">
              <Label>{text(t, "step", "Count by")}</Label>
              <Input type="number" min="1" value={step} onChange={(event) => setStep(event.target.value)} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{text(t, "precision", "Decimal places")}</Label>
              <Input type="number" min="0" max="15" value={precision} onChange={(event) => setPrecision(event.target.value)} />
            </div>
          )}
        </div>
      ) : null}
      {mode === "pick" ? (
        <div className="space-y-2">
          <Label>{text(t, "choices", "Choices, one per line")}</Label>
          <Textarea value={items} onChange={(event) => setItems(event.target.value)} />
        </div>
      ) : null}
      {mode === "password" ? (
        <div className="space-y-2">
          <Label>{text(t, "passwordLength", "Password length")}</Label>
          <Input type="number" min="1" max="256" value={length} onChange={(event) => setLength(event.target.value)} />
        </div>
      ) : null}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="mb-3 text-sm font-medium">{text(t, "batch", "Batch")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{text(t, "count", "How many")}</Label>
            <Input type="number" min="1" max={MAX_RANDOM_BATCH} value={count} onChange={(event) => setCount(event.target.value)} />
          </div>
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
              {mode !== "password" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    log(randomResultSummary(mode as RecordableRandomMode, values), "success");
                    notifyHistorySaved(text(t, "saved", "Saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved."));
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
