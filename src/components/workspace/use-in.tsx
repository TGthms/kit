"use client";
import { useState } from "react";
import { useTaskScope } from "@/lib/react/task-scope";
import { isHeldOffline } from "@/lib/pwa/offline-navigation";
import { withBasePath } from "@/lib/base-path";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { toolHref } from "@/lib/navigation/routes";
import { IMAGE_TARGETS, stageHandoff } from "@/lib/workspace/handoff";
import type { ResultFile } from "./result-files";
export function UseIn({
  files,
  disabled,
  onError,
}: {
  files: ResultFile[];
  disabled: boolean;
  onError: (reason?: "offline") => void;
}) {
  const locale = useLocale();
  const operation = useTaskScope();
  const [working, setWorking] = useState(false);
  const pathname = usePathname(),
    router = useRouter();
  const t = useTranslations("tools"),
    tw = useTranslations("workspace");
  return (
    <div className="space-y-2 border-t border-primary/15 pt-3">
      <p className="text-xs text-muted-foreground">{tw("useIn")}</p>
      <div className="flex flex-wrap gap-2">
        {IMAGE_TARGETS.filter(
          (target) => !pathname.includes(`/tools/${target}`),
        ).map((target) => (
          <Button
            key={target}
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || working}
            onClick={async () => {
              if (working) return;
              const current = operation.begin();
              setWorking(true);
              try {
                const href = toolHref(target, pathname);
                if (
                  !navigator.onLine &&
                  !(await isHeldOffline(
                    withBasePath(`/${locale}${href}`),
                    window.location.origin,
                  ))
                ) {
                  if (current()) onError("offline");
                  return;
                }
                if (!current()) return;
                const incoming = files.map(
                  (item) =>
                    new File([item.blob], item.name, { type: item.blob.type }),
                );
                if (stageHandoff(target, incoming)) router.push(href);
                else onError();
              } catch {
                if (current()) onError();
              } finally {
                if (current()) setWorking(false);
              }
            }}
          >
            {t(`${target}.name`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
