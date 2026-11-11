"use client";
import { useTranslations } from "next-intl";
import { ResultFiles } from "@/components/workspace/result-files";
import type { useToolJob } from "./use-tool-job";
import { ImageComparison } from "@/components/shared/image-comparison";
export function FileJobResult({ job, original }: { job: ReturnType<typeof useToolJob>; original?: Blob }) {
  const t = useTranslations("common");
  return <div className="space-y-4">
    {job.error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{t("error")} · {job.error}</p>}
    {original && (!job.results[0] || job.results[0].blob.type.startsWith("image/")) && <ImageComparison original={original} result={job.results[0]?.blob} />}
    <ResultFiles files={job.results} />
  </div>;
}
