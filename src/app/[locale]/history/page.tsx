"use client";

import { useMemo } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { getTool, resolveToolId } from "@/lib/tools/registry";
import { useHistoryStore } from "@/stores/history-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HistoryPage() {
  const t = useTranslations("history");
  const tt = useTranslations("tools");
  const format = useFormatter();
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);

  const visible = useMemo(
    () =>
      entries
        .map((e) => {
          const id = resolveToolId(e.toolId as string);
          return id ? { ...e, toolId: id } : null;
        })
        .filter(Boolean) as Array<(typeof entries)[0] & { toolId: string }>,
    [entries]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="type-display text-[1.75rem] sm:text-[2rem]">{t("title")}</h1>
          <p className="mt-1.5 type-body text-muted-foreground">{t("subtitle")}</p>
        </div>
        {visible.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              if (confirm(t("clearConfirm"))) clear();
            }}
          >
            {t("clear")}
          </Button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="type-body text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((e) => {
            const tool = getTool(e.toolId);
            const name = tool ? tt(`${tool.id}.name`) : e.toolId;
            return (
              <Card key={e.id} className="border-border/40">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium tracking-[-0.01em]">{name}</p>
                    <p className="type-caption text-muted-foreground">{e.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format.dateTime(new Date(e.timestamp), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {e.status === "success" ? t("success") : t("failed")}
                    </p>
                  </div>
                  {tool && (
                    <Button asChild variant="secondary" size="sm" className="shrink-0">
                      <Link href={`/tools/${tool.id}`}>{t("openTool")}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
