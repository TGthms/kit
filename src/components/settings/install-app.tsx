"use client";

import { useTranslations } from "next-intl";
import { Check, Download } from "lucide-react";
import { useInstall } from "@/components/pwa/install-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function InstallApp() {
  const t = useTranslations("settings");
  const install = useInstall();
  return (
    <Card className="border-border/40">
      <CardHeader><CardTitle>{t("installTitle")}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="type-caption text-muted-foreground">{t("installDesc")}</p>
        {install.ready && (install.installed ? (
          <p className="flex items-center gap-2 type-caption"><Check aria-hidden className="size-4 text-primary" />{t("installInstalled")}</p>
        ) : install.canPrompt || install.pending ? (
          <Button type="button" variant="outline" className="min-h-11" disabled={install.pending} onClick={() => void install.install()}>
            <Download aria-hidden className={install.pending ? "animate-pulse motion-reduce:animate-none" : undefined} />{t("installTitle")}
          </Button>
        ) : (
          <p className="type-caption text-muted-foreground">{t(install.guidance === "ios" ? "installIos" : install.guidance === "mac" ? "installMac" : "installBrowser")}</p>
        ))}
        {install.failed && <p role="status" className="type-caption text-muted-foreground">{t("installFailed")}</p>}
      </CardContent>
    </Card>
  );
}
