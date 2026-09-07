"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/react/hydrated";

const MAX_ROWS = 40;
const LIST_MAX_HEIGHT = "max-h-72";

type RequestRow = { key: string; label: string; size: number | null };

type RequestGroups = { local: RequestRow[]; network: RequestRow[]; cross: RequestRow[] };

/**
 * Reads the page's own resource timing. transferSize 0 means the entry was
 * served from cache or the service worker without touching the network;
 * background fetches the service worker makes for its own precache are
 * invisible here. Null means the browser exposes no timing (or it errored).
 */
function readRequests(): RequestGroups | null {
  try {
    if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") {
      return null;
    }
    const pageOrigin = typeof location === "undefined" ? "" : location.origin;
    const entries = [
      ...performance.getEntriesByType("navigation"),
      ...performance.getEntriesByType("resource"),
    ];
    const groups: RequestGroups = { local: [], network: [], cross: [] };
    for (const entry of entries) {
      let url: URL;
      try {
        url = new URL(entry.name);
      } catch {
        continue;
      }
      const timing = entry as PerformanceResourceTiming;
      const size = typeof timing.transferSize === "number" ? timing.transferSize : null;
      const row: RequestRow = {
        key: `${entry.startTime}-${entry.name}`,
        label: url.origin === pageOrigin ? `${url.pathname}${url.search}` : url.host,
        size,
      };
      if (pageOrigin !== "" && url.origin !== pageOrigin) groups.cross.push(row);
      else if (!size) groups.local.push(row);
      else groups.network.push(row);
    }
    return groups;
  } catch {
    return null;
  }
}

function RequestList({ title, rows }: { title: string; rows: RequestRow[] }) {
  const visible = rows.slice(0, MAX_ROWS);
  if (visible.length === 0) return null;
  return (
    <div>
      <p className="type-caption font-medium text-foreground">{title}</p>
      <ul className="mt-1 space-y-1">
        {visible.map((row) => (
          <li key={row.key} className="break-all font-mono text-xs leading-relaxed text-muted-foreground">
            {row.label}
            {row.size && row.size > 0 ? (
              <span className="ms-2 font-sans text-foreground/70">
                {Math.max(1, Math.round(row.size / 1024))} KB
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NetworkCheck() {
  const t = useTranslations("how");
  const hydrated = useHydrated();
  // First read happens in the initializer: SSR yields null, and the null
  // render is suppressed until hydration, so the two trees match.
  const [groups, setGroups] = useState<RequestGroups | null>(() => readRequests());

  const recheck = useCallback(() => {
    setGroups(readRequests());
  }, []);

  if (!hydrated) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-5 surface-float">
      {groups ? (
        <>
          <dl className="grid gap-3 text-center sm:grid-cols-3">
            {(
              [
                ["verifyLocal", groups.local.length],
                ["verifyNetwork", groups.network.length],
                ["verifyCross", groups.cross.length],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-accent/40 p-3">
                <dt className="type-caption text-muted-foreground">{t(key)}</dt>
                <dd className="type-title tabular-nums text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          {groups.cross.length === 0 ? (
            <p className="type-caption text-muted-foreground">{t("verifyCrossNone")}</p>
          ) : null}
          <details className="rounded-xl border border-border/40 px-4 py-3">
            <summary className="cursor-pointer select-none text-sm font-medium text-foreground">
              {t("verifyOpen")}
            </summary>
            <div className={`anim-details-content mt-3 space-y-3 ${LIST_MAX_HEIGHT} overflow-y-auto pe-1`}>
              <RequestList title={t("verifyLocal")} rows={groups.local} />
              <RequestList title={t("verifyNetwork")} rows={groups.network} />
              <RequestList title={t("verifyCross")} rows={groups.cross} />
            </div>
          </details>
          <Button variant="outline" size="sm" onClick={recheck}>
            {t("verifyRecheck")}
          </Button>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">{t("verifyUnsupported")}</p>
      )}
      <p className="type-caption text-muted-foreground">{t("verifyNote")}</p>
    </div>
  );
}
