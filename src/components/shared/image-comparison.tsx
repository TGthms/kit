"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
function Preview({ blob, label }: { blob: Blob; label: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = ref.current;
    if (!image || typeof URL.createObjectURL !== "function") return;
    const url = URL.createObjectURL(blob);
    image.src = url;
    return () => { image.removeAttribute("src"); URL.revokeObjectURL(url); };
  }, [blob]);
  return <figure className="min-w-0 space-y-2"><figcaption className="text-xs font-medium text-muted-foreground">{label}</figcaption>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img ref={ref} alt={label} className="h-52 w-full rounded-xl border border-border/50 bg-secondary/30 object-contain sm:h-72" />
  </figure>;
}
export function ImageComparison({ original, result }: { original: Blob; result?: Blob }) {
  const t = useTranslations("common");
  return <div className={result ? "grid grid-cols-2 gap-3" : "grid gap-3"}><Preview blob={original} label={t("input")} />{result && <Preview blob={result} label={t("output")} />}</div>;
}
