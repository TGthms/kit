"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link } from "@/lib/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHistoryStore } from "@/stores/history-store";
import { Switch } from "@/components/ui/switch";
import { rememberThemeChoice } from "@/components/providers";
import { useHydrated } from "@/lib/react/hydrated";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const th = useTranslations("history");
  const tn = useTranslations("nav");
  const { resolvedTheme, setTheme } = useTheme();
  const clear = useHistoryStore((s) => s.clear);
  const historyEnabled = useHistoryStore((s) => s.enabled);
  const setHistoryEnabled = useHistoryStore((s) => s.setEnabled);
  const hydrated = useHydrated();
  const appearance = hydrated && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} backHref="/" backLabel={tn("home")} />

      <Card className="anim-stagger border-border/40" style={{ animationDelay: "40ms" }}>
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
              className="transition-[background-color,color,box-shadow,transform] duration-200 ease-out"
              onClick={() => rememberThemeChoice(value, setTheme)}
              disabled={!hydrated}
            >
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="anim-stagger border-border/40" style={{ animationDelay: "80ms" }}>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher variant="settings" />
        </CardContent>
      </Card>

      <Card className="anim-stagger border-border/40" style={{ animationDelay: "120ms" }}>
        <CardHeader>
          <CardTitle>{t("data")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="type-body text-muted-foreground">{t("privacyNote")}</p>
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 p-4">
            <div>
              <p className="font-medium tracking-[-0.01em]">{th("recordingTitle")}</p>
              <p className="mt-1 type-caption text-muted-foreground">{historyEnabled ? th("recordingOn") : th("recordingOff")}</p>
            </div>
            <Switch checked={historyEnabled} onCheckedChange={setHistoryEnabled} aria-label={th("recordingTitle")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/privacy">{t("viewPrivacy")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/terms">{t("viewTerms")}</Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border/50 p-4">
            <p className="font-medium tracking-[-0.01em]">{t("clearHistory")}</p>
            <p className="mt-1 type-caption text-muted-foreground">{t("clearHistoryDesc")}</p>
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
          <p className="type-caption text-muted-foreground">
            {t("version")}: 1.0.0 · {t("shortcutsHelp")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
