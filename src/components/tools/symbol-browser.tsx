"use client";
import { useId, useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notifyError } from "@/lib/notify";
import { ToolShell } from "./shared";
import {
  findSymbols,
  symbolGroups,
  type SymbolGroup,
} from "@/lib/text/symbols";

export function SymbolBrowser() {
  const searchId = useId();
  const t = useTranslations("tools.symbol-browser");
  const tc = useTranslations("common");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<SymbolGroup | undefined>("popular");
  const [copied, setCopied] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const matches = findSymbols(query, group);
  return (
    <ToolShell toolId="symbol-browser">
      <div className="space-y-2">
        <label htmlFor={searchId} className="text-sm font-medium">
          {tc("search")}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-3 size-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={searchId}
            className="ps-9"
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              if (!next) setGroup("popular");
              else if (group === "popular") setGroup(undefined);
            }}
            placeholder={t("searchHint")}
          />
        </div>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={tc("allCategories")}
      >
        <Button
          variant={!group ? "default" : "outline"}
          size="sm"
          aria-pressed={!group}
          onClick={() => setGroup(undefined)}
        >
          {tc("allCategories")}
        </Button>
        {symbolGroups.map((g) => (
          <Button
            key={g}
            size="sm"
            variant={group === g ? "default" : "outline"}
            aria-pressed={group === g}
            onClick={() => setGroup(g)}
          >
            {t(`group${g[0].toUpperCase()}${g.slice(1)}`)}
          </Button>
        ))}
      </div>
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>{t("tapToCopy")}</p>
        <p role="status" aria-live="polite">
          {copied ? `${tc("copied")} ${copied}` : `${matches.length}`}
        </p>
      </div>
      {matches.length === 0 ? (
        <p className="rounded-2xl border p-6 text-sm text-muted-foreground">
          {tc("noMatches")}
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
          {matches.map((entry) => (
            <button
              type="button"
              key={entry.code}
              className="pressable-soft relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border bg-card px-2 py-3 hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              title={`${entry.name} · ${entry.code}`}
              aria-label={`${tc("copy")} ${entry.glyph}, ${entry.name}, ${entry.code}`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(entry.glyph);
                  setCopied(entry.glyph);
                  if (timer.current) clearTimeout(timer.current);
                  timer.current = setTimeout(() => setCopied(""), 1800);
                } catch {
                  notifyError(tc("error"));
                }
              }}
            >
              <span className="text-3xl leading-none" aria-hidden>
                {entry.glyph}
              </span>
              <span
                className="font-mono text-[10px] text-muted-foreground"
                aria-hidden
              >
                {entry.code}
              </span>
              {copied === entry.glyph && (
                <Check
                  className="absolute end-1 top-1 size-3 text-primary"
                  aria-hidden
                />
              )}
            </button>
          ))}
        </div>
      )}
    </ToolShell>
  );
}
