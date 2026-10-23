/** The SDK keyboard covers the page without resizing visualViewport like a
 * native keyboard. Share its real geometry with navigation and the workspace. */
export const MATH_KEYBOARD_EVENT = "kit:math-keyboard";
let height = 0;
export function mathKeyboardHeight() {
  return height;
}
export function subscribeMathKeyboard(listener: () => void) {
  window.addEventListener(MATH_KEYBOARD_EVENT, listener);
  return () => window.removeEventListener(MATH_KEYBOARD_EVENT, listener);
}
export function updateMathKeyboard(heightPx: number) {
  const next = Number.isFinite(heightPx)
    ? Math.max(0, Math.round(heightPx))
    : 0;
  document.documentElement.style.setProperty(
    "--kit-math-keyboard-height",
    `${next}px`,
  );
  document.documentElement.toggleAttribute("data-math-keyboard", next > 0);
  if (next === height) return;
  height = next;
  window.dispatchEvent(new Event(MATH_KEYBOARD_EVENT));
}
export function hideMathKeyboard() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.tagName === "MATH-FIELD")
    active.blur();
  window.mathVirtualKeyboard?.hide({ animate: false });
  updateMathKeyboard(0);
}
export function revealMathInput(field: HTMLElement) {
  const compactHeader = document.querySelector<HTMLElement>(
    '.kit-compact-header[aria-hidden="false"]',
  );
  const top = Math.max(
    64,
    (compactHeader?.getBoundingClientRect().bottom || 0) + 8,
  );
  const bottom =
    Math.min(
      window.innerHeight,
      window.visualViewport
        ? window.visualViewport.height + window.visualViewport.offsetTop
        : window.innerHeight,
    ) -
    height -
    (height ? 44 : 8);
  const scroller = field.closest<HTMLElement>("[data-math-scroll]");
  if (scroller) {
    const box = scroller.getBoundingClientRect(),
      rect = field.getBoundingClientRect();
    const edgeTop = Math.max(box.top, top),
      edgeBottom = Math.min(box.bottom, bottom);
    if (rect.bottom > edgeBottom)
      scroller.scrollTop += rect.bottom - edgeBottom + 8;
    else if (rect.top < edgeTop) scroller.scrollTop -= edgeTop - rect.top + 8;
  }
  const rect = field.getBoundingClientRect();
  if (rect.bottom > bottom)
    window.scrollBy({ top: rect.bottom - bottom + 8, behavior: "instant" });
  else if (rect.top < top)
    window.scrollBy({ top: rect.top - top - 8, behavior: "instant" });
}
