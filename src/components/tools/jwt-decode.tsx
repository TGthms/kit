"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { decodeJwt } from "@/lib/text/jwt";
import { ToolShell, useToolHistory } from "./shared";

export function JwtDecode() {
  const t = useTranslations("tools.jwt-decode");
  const tc = useTranslations("common");
  const log = useToolHistory("jwt-decode");
  const [token, setToken] = useState("");
  const result = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);

  return (
    <ToolShell toolId="jwt-decode">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <Field label={tc("input")}>
        <Textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="min-h-32 font-mono"
          placeholder="eyJhbGciOi..."
        />
      </Field>
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
