"use client";
import { useTranslations } from "next-intl";
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
  onError: () => void;
}) {
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
            disabled={disabled}
            onClick={() => {
              const incoming = files.map(
                (item) =>
                  new File([item.blob], item.name, { type: item.blob.type }),
              );
              if (stageHandoff(target, incoming))
                router.push(toolHref(target, pathname));
              else onError();
            }}
          >
            {t(`${target}.name`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
