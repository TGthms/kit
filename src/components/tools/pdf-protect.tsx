"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { lockPdf, unlockPdf } from "@/lib/pdf/protect";
import { translateOr } from "@/lib/i18n/translate";
import { ActionBar, ToolLimits, ToolShell, useToolHistory } from "./shared";

export function PdfProtect() {
  const t = useTranslations("tools.pdf-protect");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-protect");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [mode, setMode] = useState<"lock" | "unlock">("lock");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    // Unlock may run with an empty password: owner-restricted PDFs (empty
    // user password) decrypt freely and are exactly the files people need
    // Unlock for, so only lock requires a password here.
    if (!files[0] || (mode === "lock" && !password)) return;
    setLoading(true);
    try {
      const buf = await files[0].file.arrayBuffer();
      const out = mode === "lock" ? await lockPdf(buf, password) : await unlockPdf(buf, password);
      downloadBlob(
        bytesToBlob(out, "application/pdf"),
        mode === "lock" ? "locked.pdf" : "unlocked.pdf"
      );
      toast.success(t("success"));
      log(mode, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="pdf-protect">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <div className="flex gap-2">
        <Button type="button" variant={mode === "lock" ? "default" : "outline"} onClick={() => setMode("lock")}>
          {t("lock")}
        </Button>
        <Button type="button" variant={mode === "unlock" ? "default" : "outline"} onClick={() => setMode("unlock")}>
          {t("unlock")}
        </Button>
      </div>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      {mode === "unlock" ? (
        <p className="text-sm text-muted-foreground">
          {translateOr(
            t,
            "unlockNote",
            "Unlocking re-saves the pages: form fields, bookmarks, and document metadata are not carried over."
          )}
        </p>
      ) : null}
      <Field className="space-y-2" label={t("password")}>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
      </Field>
      <ActionBar
        onRun={run}
        loading={loading}
        label={t("run")}
        disabled={!files[0] || (mode === "lock" && !password)}
      />
    </ToolShell>
  );
}
