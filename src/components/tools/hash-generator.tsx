"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { HASH_ALGOS, hashBytes, hashText, type HashAlgo } from "@/lib/text/hash";
import { ToolShell, useToolHistory } from "./shared";
import { selectClass } from "./text-extra-shared";

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
      <Field className="space-y-2" label={t("algo")}>
        <select className={selectClass} value={algo} onChange={(e) => setAlgo(e.target.value as HashAlgo)}>
          {HASH_ALGOS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>
      <Textarea aria-label={tc("input")} value={text} onChange={(e) => setText(e.target.value)} className="min-h-28 font-mono" />
      <FileDropzone multiple={false} files={files} onChange={setFiles} />
      <Button onClick={run} disabled={loading}>
        {loading ? tc("processing") : t("run")}
      </Button>
      {digest ? (
        <div className="space-y-2">
          <Field label={t("digest")}><Textarea value={digest} readOnly className="min-h-20 break-all font-mono" /></Field>
          <CopyButton value={digest} />
        </div>
      ) : null}
    </ToolShell>
  );
}
