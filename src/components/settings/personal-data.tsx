"use client";
import { useEffect, useRef, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "@/lib/i18n/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/ui/copy-button";
import { useHydrated } from "@/lib/react/hydrated";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useFeedbackStore } from "@/stores/feedback-store";
import { useAppearanceStore } from "@/stores/appearance-store";
import { useGreetingPreferencesStore } from "@/stores/greeting-preferences-store";
import { readThemeChoice, rememberThemeChoice } from "@/lib/theme/resolve";
import { resolveLocale, localeNames } from "@/lib/i18n/config";
import { downloadText } from "@/lib/utils";
import {
  DRAFT_EVENT,
  recoveryEnabled,
  setRecoveryEnabled,
} from "@/lib/workspace/math";
import {
  parsePreferences,
  type Preferences,
} from "@/lib/workspace/preferences";
import { importPreferences } from "@/lib/workspace/import-preferences";
import { collectDiagnostics } from "@/lib/pwa/diagnostics";
import { DEFAULT_GLASS_TRANSPARENCY } from "@/lib/theme/glass-transparency";
const ModalSurface = dynamic(() =>
  import("@/components/ui/modal-surface").then((module) => module.ModalSurface),
);

export function PersonalData() {
  const t = useTranslations("workspace"),
    tc = useTranslations("common"),
    ts = useTranslations("settings"),
    tt = useTranslations("tools"),
    tn = useTranslations("nav");
  const locale = useLocale(),
    router = useRouter(),
    { setTheme } = useTheme();
  const hydrated = useHydrated();
  const format = useFormatter();
  const [recovery, setRecovery] = useState(true);
  const [pending, setPending] = useState<Preferences | null>(null);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  const reading = useRef(0);
  useEffect(() => {
    mounted.current = true;
    const sync = () => {
      try {
        setRecovery(recoveryEnabled());
      } catch {
        setError(true);
      }
    };
    sync();
    window.addEventListener(DRAFT_EVENT, sync);
    return () => {
      mounted.current = false;
      window.removeEventListener(DRAFT_EVENT, sync);
    };
  }, []);
  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle>{t("personalSetup")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">{t("mathRecovery")}</p>
            <p
              id="math-recovery-desc"
              className="mt-1 text-xs text-muted-foreground"
            >
              {t("mathRecoveryDesc")}
            </p>
          </div>
          <Switch
            checked={hydrated && recovery}
            disabled={!hydrated}
            aria-label={t("mathRecovery")}
            aria-describedby="math-recovery-desc"
            onCheckedChange={(enabled) => {
              try {
                setRecoveryEnabled(enabled);
                setRecovery(enabled);
                setError(false);
              } catch {
                setError(true);
              }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("transferDesc")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!hydrated}
            onClick={() => {
              try {
                const preferences: Preferences = {
                  kind: "kit-preferences",
                  version: 1,
                  locale: resolveLocale(locale),
                  theme: readThemeChoice(),
                  favorites: useFavoritesStore.getState().ids,
                  haptics: useFeedbackStore.getState().haptics,
                  liquidGlass: useAppearanceStore.getState().liquidGlass,
                  glassTransparency: useAppearanceStore.getState().glassTransparency,
                  showObservances:
                    useGreetingPreferencesStore.getState().showObservances,
                  mathRecovery: recoveryEnabled(),
                };
                downloadText(
                  JSON.stringify(preferences, null, 2),
                  "kit-preferences.json",
                  "application/json",
                );
                setError(false);
              } catch {
                setError(true);
              }
            }}
          >
            {t("exportPreferences")}
          </Button>
          <Button
            variant="outline"
            disabled={!hydrated}
            onClick={() => input.current?.click()}
          >
            {t("importPreferences")}
          </Button>
          <input
            ref={input}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              const id = ++reading.current;
              if (!file) return;
              try {
                if (file.size > 20000) throw new Error("invalid");
                const parsed = parsePreferences(await file.text());
                if (mounted.current && id === reading.current) {
                  setPending(parsed);
                  setError(false);
                }
              } catch {
                if (mounted.current && id === reading.current) setError(true);
              }
            }}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {t("storageFailed")}
          </p>
        )}
        <p role="status" className="text-xs text-muted-foreground">
          {status}
        </p>
        {pending && (
          <ModalSurface
            open
            onOpenChange={(open) => {
              if (!open) setPending(null);
            }}
            title={t("importPreferences")}
            closeLabel={tc("cancel")}
          >
            <p className="mb-3 text-sm">{t("transferDesc")}</p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{ts("language")}</dt>
                <dd>{localeNames[pending.locale]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{ts("appearance")}</dt>
                <dd>
                  {tc(
                    pending.theme === "dark"
                      ? "themeDark"
                      : pending.theme === "light"
                        ? "themeLight"
                        : "themeSystem",
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{ts("haptics")}</dt>
                <dd>
                  {ts(
                    pending.haptics === "full"
                      ? "hapticsFull"
                      : pending.haptics === "reduced"
                        ? "hapticsReduced"
                        : "hapticsOff",
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{tn("favorites")}</dt>
                <dd>
                  {pending.favorites.length
                    ? pending.favorites.map((id) => tt(`${id}.name`)).join(", ")
                    : tc("none")}
                </dd>
              </div>
              {(pending.liquidGlass || pending.glassTransparency !== undefined) && (
                <div>
                  <dt className="text-muted-foreground">{ts("glassTransparency")}</dt>
                  <dd>{format.number((pending.glassTransparency ?? DEFAULT_GLASS_TRANSPARENCY) / 100, { style: "percent" })}</dd>
                </div>
              )}
              {[
                [ts("liquidGlass"), pending.liquidGlass],
                [ts("observanceGreetings"), pending.showObservances],
                [t("mathRecovery"), pending.mathRecovery],
              ].map(([label, enabled]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3"
                >
                  <dt>{label}</dt>
                  <dd>
                    <input
                      aria-label={String(label)}
                      type="checkbox"
                      checked={Boolean(enabled)}
                      disabled
                    />
                  </dd>
                </div>
              ))}
            </dl>
            <Button
              className="mt-4"
              onClick={() => {
                try {
                  importPreferences(pending);
                  rememberThemeChoice(pending.theme, setTheme);
                  setPending(null);
                  setStatus(tc("done"));
                  setError(false);
                  if (pending.locale !== locale)
                    router.replace("/settings", { locale: pending.locale });
                } catch {
                  setPending(null);
                  setError(true);
                }
              }}
            >
              {tc("confirm")}
            </Button>
          </ModalSurface>
        )}
      </CardContent>
    </Card>
  );
}
export function Diagnostics() {
  const t = useTranslations("workspace"),
    tc = useTranslations("common");
  const [report, setReport] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const active = useRef(true);
  const lock = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle>{t("diagnostics")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{t("diagnosticsDesc")}</p>
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            setError(false);
            try {
              const value = await collectDiagnostics();
              if (active.current) setReport(JSON.stringify(value, null, 2));
            } catch {
              if (active.current) setError(true);
            } finally {
              lock.current = false;
              if (active.current) setBusy(false);
            }
          }}
        >
          {busy ? tc("loading") : tc("preview")}
        </Button>
        {error && <p role="alert">{tc("error")}</p>}
        {report && (
          <ModalSurface
            open
            onOpenChange={(open) => {
              if (!open) setReport(null);
            }}
            title={t("diagnostics")}
            closeLabel={tc("close")}
          >
            <p className="mb-3 text-sm">{t("diagnosticsDesc")}</p>
            <textarea
              readOnly
              aria-label={t("diagnostics")}
              value={report}
              dir="ltr"
              className="h-64 w-full rounded-xl border bg-secondary p-3 font-mono text-base sm:text-xs"
            />
            <CopyButton value={report} />
          </ModalSurface>
        )}
      </CardContent>
    </Card>
  );
}
