"use client";

import { useEffect } from "react";

const MOVE_CANCEL_PX = 10;

function pressElement(node: EventTarget | null): HTMLElement | null {
  const start = node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
  if (!start) return null;
  const el = start.closest("[data-pressable], .pressable, .pressable-soft, button");
  if (!(el instanceof HTMLElement)) return null;
  if (el instanceof HTMLButtonElement && el.disabled) return null;
  return el;
}

/**
 * iOS often skips `:active` on taps. Mark press on pointer-down so opacity
 * feedback is instant inside the installed PWA. Do not scale the target —
 * shrinking the hit box makes iOS drop the click on the first tap.
 */
export function PressFeedback() {
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const start = event.target instanceof Element ? event.target : event.target instanceof Node ? event.target.parentElement : null;
      if (start?.closest("input, textarea, select, option")) return;
      const el = pressElement(event.target);
      if (!el) return;
      el.dataset.pressed = "";
      const startX = event.clientX;
      const startY = event.clientY;
      const clear = () => {
        delete el.dataset.pressed;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", clear);
        window.removeEventListener("pointercancel", clear);
      };
      const onMove = (move: PointerEvent) => {
        if (Math.hypot(move.clientX - startX, move.clientY - startY) > MOVE_CANCEL_PX) clear();
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", clear);
      window.addEventListener("pointercancel", clear);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return null;
}
