"use client";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  mathKeyboardHeight,
  subscribeMathKeyboard,
  hideMathKeyboard,
  syncMathKeyboard,
} from "@/lib/math/keyboard";
export function MathKeyboardAccessory() {
  const height = useSyncExternalStore(
    subscribeMathKeyboard,
    mathKeyboardHeight,
    () => 0,
  );
  const t = useTranslations("common");
  useEffect(() => {
    if (!height) return;
    // SDK geometry notifications can precede its safe-area positioning. Read
    // again after layout, and at the end of an optional SDK opening animation.
    const frame = requestAnimationFrame(syncMathKeyboard);
    const settled = (event: Event) => {
      if (
        event.target instanceof Element &&
        event.target.closest(".ML__keyboard")
      )
        syncMathKeyboard();
    };
    document.addEventListener("transitionend", settled);
    window.addEventListener("resize", syncMathKeyboard);
    window.visualViewport?.addEventListener("resize", syncMathKeyboard);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("transitionend", settled);
      window.removeEventListener("resize", syncMathKeyboard);
      window.visualViewport?.removeEventListener("resize", syncMathKeyboard);
    };
  }, [height]);
  if (!height) return null;
  return createPortal(
    <div
      className="math-keyboard-accessory fixed inset-x-0 z-[95] flex h-11 items-center justify-end border-t border-border bg-secondary px-4 shadow-sm"
      style={{ bottom: height }}
    >
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
