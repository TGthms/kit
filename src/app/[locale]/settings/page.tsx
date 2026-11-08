"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link } from "@/lib/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useHistoryStore } from "@/stores/history-store";
import { Switch } from "@/components/ui/switch";
import { rememberThemeChoice } from "@/lib/theme/resolve";
import { CheckUpdates } from "@/components/settings/check-updates";
import { useHydrated } from "@/lib/react/hydrated";
import { runCircularThemeTransition } from "@/lib/theme/circular-transition";
import { ChevronRight } from "lucide-react";
import { useAppearanceStore } from "@/stores/appearance-store";
import { useLiquidGlassEnabled } from "@/lib/theme/liquid-glass";
import { useFeedbackStore } from "@/stores/feedback-store";
import { useGreetingPreferencesStore } from "@/stores/greeting-preferences-store";
import { InstallApp } from "@/components/settings/install-app";
import { PersonalData, Diagnostics } from "@/components/settings/personal-data";
import { ClearHistory } from "@/components/settings/clear-history";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const th = useTranslations("history");
  const tn = useTranslations("nav");
  const format = useFormatter();
  const { resolvedTheme, setTheme, systemTheme } = useTheme();
  const historyEnabled = useHistoryStore((s) => s.enabled);
  const setHistoryEnabled = useHistoryStore((s) => s.setEnabled);
  const hydrated = useHydrated();
  const liquidGlass = useAppearanceStore((state) => state.liquidGlass);
  const setLiquidGlass = useAppearanceStore((state) => state.setLiquidGlass);
  const glassTransparency = useAppearanceStore((state) => state.glassTransparency);
  const setGlassTransparency = useAppearanceStore((state) => state.setGlassTransparency);
  const glassAvailable = useLiquidGlassEnabled();
  const haptics = useFeedbackStore((state) => state.haptics);
  const setHaptics = useFeedbackStore((state) => state.setHaptics);
  const showObservances = useGreetingPreferencesStore((state) => state.showObservances);
  const setShowObservances = useGreetingPreferencesStore((state) => state.setShowObservances);
  // Painted Light/Dark. Stored intent may still be System until the user taps.
  const appearance = hydrated && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} backHref="/" backLabel={tn("home")} />

      <Card className="anim-stagger border-border/40" style={{ animationDelay: "40ms" }}>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {hydrated ? (
            <SegmentedControl
              value={appearance}
              aria-label={t("appearance")}
              onChange={(value, event) => {
                const next = value === "dark" ? "dark" : "light";
                const system = systemTheme === "dark" ? "dark" : "light";
                const persist = () => {
                  rememberThemeChoice(next, setTheme, system);
                };
                if (next === appearance) return;
                runCircularThemeTransition(
                  next,
                  persist,
                  event && "clientX" in event ? event : undefined
                );
              }}
              options={[
                { value: "light", label: tc("themeLight") },
                { value: "dark", label: tc("themeDark") },
              ]}
            />
          ) : (
            <div className="h-11 w-40 rounded-2xl bg-secondary/80" aria-hidden />
          )}
          <section className="space-y-3 border-t border-border/50 pt-5">
            <h3 className="text-sm font-medium">{t("language")}</h3>
          <LocaleSwitcher variant="settings" />
          </section>
          <section className="space-y-3 border-t border-border/50 pt-5">
            <h3 className="text-sm font-medium">{t("observanceGreetings")}</h3>
          <div className="flex items-start justify-between gap-4">
            <p id="kit-observance-greetings-description" className="type-caption text-muted-foreground">
              {t("observanceGreetingsDesc")}
            </p>
            <Switch
              checked={hydrated && showObservances}
              disabled={!hydrated}
              onCheckedChange={setShowObservances}
              aria-label={t("observanceGreetings")}
              aria-describedby="kit-observance-greetings-description"
            />
          </div>
          </section>
          <section className="space-y-3 border-t border-border/50 pt-5">
            <h3 className="text-sm font-medium">{t("haptics")}</h3>
          <p className="type-caption text-muted-foreground">{t("hapticsDesc")}</p>
          {hydrated ? <SegmentedControl value={haptics} onChange={setHaptics} aria-label={t("haptics")} options={[
            { value: "full", label: t("hapticsFull") },
            { value: "reduced", label: t("hapticsReduced") },
            { value: "off", label: t("hapticsOff") },
          ]} /> : <div className="h-11 w-56 rounded-2xl bg-secondary/80" aria-hidden />}
          </section>
        </CardContent>
      </Card>

      <Card className="anim-stagger border-border/40" style={{ animationDelay: "120ms" }}>
        <CardHeader><CardTitle>{t("offlineAccess")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="type-caption text-muted-foreground">{t("offlineAccessDesc")}</p>
          <Button asChild variant="outline"><Link href="/settings/offline">{t("offlineOpen")}<ChevronRight aria-hidden className="ms-2 h-4 w-4" /></Link></Button>
        </CardContent>
      </Card>

      <Card className="anim-stagger border-border/40" style={{ animationDelay: "160ms" }}>
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
            <Switch disabled={!hydrated} checked={hydrated && historyEnabled} onCheckedChange={setHistoryEnabled} aria-label={th("recordingTitle")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/how">{t("viewHow")}</Link>
            </Button>
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
            <div className="mt-3"><ClearHistory /></div>
          </div>
          <p className="type-caption text-muted-foreground">{t("shortcutsHelp")}</p>
        </CardContent>
      </Card>

      <PersonalData />
      <Diagnostics />
      <Card className="border-border/40">
        <CardHeader><CardTitle>{t("navigationAppearance")}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p id="kit-liquid-glass-label" className="font-medium tracking-[-0.01em]">{t("liquidGlass")}</p>
              <p id="kit-liquid-glass-description" className="mt-1 type-caption text-muted-foreground">{t("liquidGlassDesc")}</p>
            </div>
            <Switch glass={false} checked={hydrated && liquidGlass} disabled={!hydrated} onCheckedChange={setLiquidGlass} aria-labelledby="kit-liquid-glass-label" aria-describedby="kit-liquid-glass-description" />
          </div>
          {hydrated && liquidGlass && (
            <div className="mt-4 border-t border-border/50 pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="kit-glass-transparency" className="text-sm font-medium">{t("glassTransparency")}</label>
                <span aria-hidden className="text-sm tabular-nums text-muted-foreground">
                  {format.number(glassTransparency / 100, { style: "percent" })}
                </span>
              </div>
              <input
                id="kit-glass-transparency"
                type="range"
                min={0}
                max={100}
                value={glassTransparency}
                aria-valuetext={format.number(glassTransparency / 100, { style: "percent" })}
                aria-describedby={glassAvailable ? undefined : "kit-glass-unavailable"}
                onChange={(event) => setGlassTransparency(event.currentTarget.valueAsNumber)}
                className="block h-11 w-full cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-ring"
              />
              {!glassAvailable && <p id="kit-glass-unavailable" className="type-caption text-muted-foreground">{t("glassUnavailable")}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <InstallApp />

      {/* The release the visitor is running, kept on its own at the foot of the
          page so it can be read out when something needs looking up. */}
      <CheckUpdates />
    </div>
  );
}
