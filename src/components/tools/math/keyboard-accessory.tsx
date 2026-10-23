"use client";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Keyboard } from "lucide-react";
import {
  mathKeyboardHeight,
  subscribeMathKeyboard,
  hideMathKeyboard,
} from "@/lib/math/keyboard";
export function MathKeyboardAccessory() {
  const height = useSyncExternalStore(
    subscribeMathKeyboard,
    mathKeyboardHeight,
    () => 0,
  );
  const t = useTranslations("common");
  if (!height) return null;
  return createPortal(
    <div
      className="math-keyboard-accessory fixed inset-x-0 z-[95] flex h-11 items-center justify-between border-t border-border bg-secondary px-4 shadow-sm"
      style={{ bottom: height }}
    >
      <Keyboard className="size-4 text-muted-foreground" aria-hidden />
      <button
        type="button"
        className="flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-ring"
        onPointerDown={(event) => event.preventDefault()}
        onClick={hideMathKeyboard}
      >
        {t("done")}
      </button>
    </div>,
    document.body,
  );
}
