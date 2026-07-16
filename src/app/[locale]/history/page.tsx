"use client";

import { useTranslations, useFormatter } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useHistoryStore } from "@/stores/history-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HistoryPage() {
  const t = useTranslations("history");
  const tt = useTranslations("tools");
  const format = useFormatter();
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        {entries.length > 0 && (
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

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{tt(`${e.toolId}.name`)}</p>
                  <p className="text-sm text-muted-foreground">{e.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {format.dateTime(new Date(e.timestamp), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {e.status === "success" ? t("success") : t("failed")}
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/tools/${e.toolId}`}>{t("openTool")}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
