"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sanitizeFilename, slugify } from "@/lib/text/slugify";
import { ToolShell, useToolHistory } from "./shared";

export function SlugifyTool() {
  const t = useTranslations("tools.slugify");
  const log = useToolHistory("slugify");
  const [input, setInput] = useState("Hello, World! Café déjà vu");
  const slug = useMemo(() => slugify(input), [input]);
  const filename = useMemo(() => sanitizeFilename(input), [input]);

  return (
    <ToolShell toolId="slugify">
      <Field label={t("input")}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <div className="space-y-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t("slug")}</p>
          <p className="mt-1 break-all font-mono text-lg">{slug || "—"}</p>
          <div className="mt-2 flex gap-2">
            <CopyButton value={slug} disabled={!slug} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                log(slug || "(empty)", "success");
                toast.success(t("saved"));
              }}
            >
              {t("record")}
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t("filename")}</p>
          <p className="mt-1 break-all font-mono text-lg">{filename}</p>
          <CopyButton className="mt-2" value={filename} />
        </div>
      </div>
    </ToolShell>
  );
}
