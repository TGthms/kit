"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { flattenJson, jsonPathGet } from "@/lib/text/json-query";
import { ToolShell, useToolHistory } from "./shared";

export function JsonQuery() {
  const t = useTranslations("tools.json-query");
  const log = useToolHistory("json-query");
  const [input, setInput] = useState('{\n  "user": { "name": "Kit", "tags": ["pdf", "image"] },\n  "count": 2\n}');
  const [path, setPath] = useState("$.user.tags[0]");
  const [mode, setMode] = useState<"path" | "flatten">("path");
  const [out, setOut] = useState("");
  const [error, setError] = useState("");

  const run = () => {
    try {
      const data = JSON.parse(input) as unknown;
      if (mode === "flatten") {
        const flat = flattenJson(data);
        const text = Object.entries(flat)
          .map(([k, v]) => `${k || "(root)"} = ${JSON.stringify(v)}`)
          .join("\n");
        setOut(text);
        setError("");
        log("flatten", "success");
        toast.success(t("success"));
        return;
      }
      const values = jsonPathGet(data, path);
      setOut(JSON.stringify(values, null, 2));
      setError("");
      log(path, "success");
      toast.success(t("success"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("invalid"));
      setOut("");
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="json-query">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <SegmentedControl
        value={mode}
        aria-label={t("mode")}
        onChange={setMode}
        options={[
          { value: "path", label: t("modePath") },
          { value: "flatten", label: t("modeFlatten") },
        ]}
      />
      <Field label={t("json")}>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-40 font-mono" />
      </Field>
      {mode === "path" ? (
        <Field label={t("path")}>
          <Input value={path} onChange={(e) => setPath(e.target.value)} className="font-mono" placeholder="$.user.name" />
        </Field>
      ) : null}
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <CopyButton value={out} disabled={!out} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {out ? <Textarea value={out} readOnly className="min-h-32 font-mono" /> : null}
    </ToolShell>
  );
}
