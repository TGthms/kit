"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link } from "@/lib/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useHistoryStore } from "@/stores/history-store";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const th = useTranslations("history");
  const { resolvedTheme, setTheme } = useTheme();
  const clear = useHistoryStore((s) => s.clear);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const appearance = mounted ? (resolvedTheme === "dark" ? "dark" : "light") : "light";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(
            [
              ["light", tc("themeLight")],
              ["dark", tc("themeDark")],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={appearance === value ? "default" : "outline"}
              onClick={() => setTheme(value)}
              disabled={!mounted}
            >
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block text-muted-foreground">{tc("language")}</Label>
          <LocaleSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("data")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("privacyNote")}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/privacy">{t("viewPrivacy")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/terms">{t("viewTerms")}</Link>
            </Button>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">{t("clearHistory")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("clearHistoryDesc")}</p>
            <Button
              className="mt-3"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(th("clearConfirm"))) clear();
              }}
            >
              {t("clearHistory")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("version")}: 1.0.0 · {t("shortcutsHelp")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
