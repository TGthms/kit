"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { runRegexAsync, replaceRegexAsync, type RegexResult } from "@/lib/text/regex";
import { ToolShell, useToolHistory } from "./shared";

export function RegexTester() {
  const fieldText = useTranslations("common");
  const t = useTranslations("tools.regex-tester");
  const log = useToolHistory("regex-tester");
  const [pattern, setPattern] = useState("(\\w+)");
  const [flags, setFlags] = useState("g");
  const [input, setInput] = useState("hello kit world");
  const [repl, setRepl] = useState("$1!");
  const [out, setOut] = useState("");
  const [result, setResult] = useState<RegexResult>({ ok: true, matches: [], flags: "g" });

  useEffect(() => {
    let alive = true;
    // Debounced and evaluated in a worker: a single catastrophic exec() must
    // never block the main thread on the keystroke that scheduled it.
    const timer = window.setTimeout(() => {
      runRegexAsync(pattern, flags, input).then((next) => {
        if (alive) setResult(next);
      });
    }, 200);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [pattern, flags, input]);

  const replace = async () => {
    const r = await replaceRegexAsync(pattern, flags, input, repl);
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
        <Field className="space-y-2 sm:col-span-2" label={t("pattern")}>
          <Input value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono" />
        </Field>
        <Field className="space-y-2" label={t("flags")}>
          <Input value={flags} onChange={(e) => setFlags(e.target.value)} className="font-mono" />
        </Field>
      </div>
      <Field className="space-y-2" label={t("input")}>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-32 font-mono" />
      </Field>
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
      <Field className="space-y-2" label={t("replace")}>
        <Input value={repl} onChange={(e) => setRepl(e.target.value)} className="font-mono" />
      </Field>
      <Button onClick={replace}>{t("runReplace")}</Button>
      {out ? <Textarea aria-label={fieldText("output")} value={out} readOnly className="min-h-24 font-mono" /> : null}
    </ToolShell>
  );
}
