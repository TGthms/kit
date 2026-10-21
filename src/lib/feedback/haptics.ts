export type HapticMode = "full" | "reduced" | "off";

export function hapticMode(value: unknown): HapticMode {
  return value === "reduced" || value === "off" ? value : "full";
}

const CONTROLS = 'button, a[data-pressable][href]';
const HOST = "kit-ios-haptic-hit";

function usable(control: HTMLElement): boolean {
  return control.isConnected && !control.matches(":disabled")
    && !control.closest('[inert], [aria-hidden="true"], [aria-disabled="true"], [data-haptic="off"]');
}

export function shouldHaptic(control: HTMLElement, mode: HapticMode): boolean {
  if (mode === "off" || !usable(control)) return false;
  return mode === "full" || control.hasAttribute("data-haptic-important")
    || control.matches('[role="switch"], [role="checkbox"], [role="radio"], button[type="submit"]');
}

function iosSwitchSupported(): boolean {
  const nav = navigator;
  const ios = /iP(hone|ad|od)/.test(nav.userAgent) || nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
  return ios && typeof nav.vibrate !== "function" && "switch" in document.createElement("input");
}

/** Duskline's trusted-label technique. No synthetic clicks or intercepted actions.
 * The real button still owns focus, keyboard activation, and the original tap.
 * Links retain native navigation: Next's preventDefault would cancel a label's
 * native activation, so they only use Vibration API feedback where available.
 */
export function installHaptics(readMode: () => HapticMode): () => void {
  if (readMode() === "off") return () => {};
  const onClick = (event: MouseEvent) => {
    if (!event.isTrusted || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const control = event.target instanceof Element ? event.target.closest<HTMLElement>(CONTROLS) : null;
    if (!control || !shouldHaptic(control, readMode()) || typeof navigator.vibrate !== "function") return;
    try { navigator.vibrate(10); } catch { /* Optional device feedback. */ }
  };
  document.addEventListener("click", onClick, { capture: true, passive: true });
  if (!iosSwitchSupported()) return () => document.removeEventListener("click", onClick, true);

  const mounted = new Map<HTMLButtonElement, () => void>();
  const eligible = (button: HTMLButtonElement) => shouldHaptic(button, readMode())
    && !(button.form && (button.type === "submit" || button.type === "reset"))
    // Combobox options intentionally leave focus on their input; slider handles
    // own pointer capture. Neither should acquire a label's focus behavior.
    && !button.matches('[role="option"], [role="slider"]')
    && !button.closest(".kit-sdk-control")
    && !button.querySelector('input, select, textarea, [contenteditable], [role="slider"]');

  const mount = (button: HTMLButtonElement) => {
    if (mounted.has(button) || !eligible(button)) return;
    const host = document.createElement("span");
    host.className = HOST;
    host.setAttribute("aria-hidden", "true");
    const root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    // Unlike a transparent switch, this label preserves the page's native scroll
    // gesture. Its switch is never a touch, keyboard, or accessibility target.
    style.textContent = "label{position:absolute;inset:0;display:block;cursor:inherit}input{display:none!important}";
    const label = document.createElement("label");
    label.htmlFor = "tick";
    const tick = document.createElement("input");
    tick.id = "tick";
    tick.type = "checkbox";
    tick.setAttribute("switch", "");
    tick.hidden = true;
    tick.tabIndex = -1;
    tick.setAttribute("aria-hidden", "true");
    let gesture: { id: number; x: number; y: number; cancelled: boolean } | null = null;
    label.addEventListener("pointerdown", (event) => {
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, cancelled: event.isPrimary === false || event.button !== 0 };
    }, { passive: true });
    label.addEventListener("pointermove", (event) => {
      if (gesture?.id === event.pointerId && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 12) gesture.cancelled = true;
    }, { passive: true });
    label.addEventListener("pointercancel", () => { if (gesture) gesture.cancelled = true; }, { passive: true });
    label.addEventListener("click", (event) => {
      const cancelled = gesture?.cancelled;
      gesture = null;
      if (cancelled || !event.isTrusted || !usable(button)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.defaultPrevented || !shouldHaptic(button, readMode())) event.preventDefault();
      button.focus({ preventScroll: true });
      // Let the trusted click reach the real button exactly once. Cancelling
      // label activation silences the tick without cancelling the button action.
    });
    tick.addEventListener("click", (event) => event.stopPropagation());
    root.append(style, label, tick);
    button.appendChild(host);
    mounted.set(button, () => host.remove());
  };

  const scan = (node: Node, controls: Set<HTMLButtonElement>) => {
    if (!(node instanceof Element) || node.closest(`.${HOST}`)) return;
    const owner = node.closest("button");
    if (owner) controls.add(owner);
    node.querySelectorAll("button").forEach((button) => controls.add(button));
  };
  document.querySelectorAll("button").forEach(mount);
  const observer = new MutationObserver((records) => {
    const controls = new Set<HTMLButtonElement>();
    for (const record of records) {
      scan(record.target, controls);
      record.addedNodes.forEach((node) => scan(node, controls));
      record.removedNodes.forEach((node) => scan(node, controls));
    }
    for (const button of controls) {
      const dispose = mounted.get(button);
      // React may replace a button's children while keeping the button itself.
      if (dispose && (!button.isConnected || !eligible(button) || !button.querySelector(`:scope > .${HOST}`))) {
        dispose();
        mounted.delete(button);
      }
      if (button.isConnected) mount(button);
    }
  });
  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ["disabled", "aria-disabled", "aria-hidden", "inert", "role", "data-haptic", "data-haptic-important"],
  });
  return () => {
    document.removeEventListener("click", onClick, true);
    observer.disconnect();
    mounted.forEach((dispose) => dispose());
    mounted.clear();
  };
}
