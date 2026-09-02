/**
 * Circular clip-path theme wipe via the View Transitions API.
 *
 * Origin resolution and the wipe itself are adapted from Great UI's MIT
 * CircularThemeProvider (https://great-ui.com) — Kit keeps next-themes as
 * the source of truth and never unmounts the tree while hydrating.
 */

export const THEME_COLOR = { light: "#f5f5f7", dark: "#000000" } as const;

export type ResolvedTheme = "light" | "dark";

export type WipeOrigin =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | { x: number; y: number }
  | { clientX: number; clientY: number; detail?: number; currentTarget?: EventTarget | null }
  | { getBoundingClientRect: () => DOMRect };

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished?: Promise<void> };
};

const ANIM_STYLE_ID = "kit-circular-theme-anim";
const DEFAULT_DURATION_MS = 500;
const DEFAULT_EASING = "ease-in-out";

let animating = false;

export function isThemeTransitionRunning(): boolean {
  return animating;
}

export function applyDomTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
}

export function resolveWipeOrigin(
  origin: WipeOrigin | undefined,
  viewport: { width: number; height: number }
): { x: number; y: number } {
  const center = { x: viewport.width / 2, y: viewport.height / 2 };
  if (!origin) return center;

  if (typeof origin === "string") {
    switch (origin) {
      case "top-left":
        return { x: 0, y: 0 };
      case "top-right":
        return { x: viewport.width, y: 0 };
      case "bottom-left":
        return { x: 0, y: viewport.height };
      case "bottom-right":
        return { x: viewport.width, y: viewport.height };
      default:
        return center;
    }
  }

  if ("getBoundingClientRect" in origin && typeof origin.getBoundingClientRect === "function") {
    const rect = origin.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  if ("clientX" in origin) {
    const keyboardClick = origin.detail === 0;
    const target = origin.currentTarget;
    if (keyboardClick && target && typeof (target as HTMLElement).getBoundingClientRect === "function") {
      const rect = (target as HTMLElement).getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: origin.clientX, y: origin.clientY };
  }

  if ("x" in origin && "y" in origin) {
    return { x: origin.x, y: origin.y };
  }

  return center;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cleanupAnimStyle() {
  document.getElementById(ANIM_STYLE_ID)?.remove();
  animating = false;
}

/**
 * Apply `nextTheme` inside a circular wipe from `origin`. Falls back to an
 * instant swap when View Transitions are missing or motion is reduced.
 */
export function runCircularThemeTransition(
  nextTheme: ResolvedTheme,
  persist: (theme: ResolvedTheme) => void,
  origin?: WipeOrigin,
  duration = DEFAULT_DURATION_MS
) {
  if (typeof window === "undefined") {
    persist(nextTheme);
    return;
  }
  if (animating) return;

  const alreadyDark = document.documentElement.classList.contains("dark");
  if ((nextTheme === "dark") === alreadyDark) {
    persist(nextTheme);
    return;
  }

  const apply = () => {
    applyDomTheme(nextTheme);
    persist(nextTheme);
  };

  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || prefersReducedMotion()) {
    apply();
    return;
  }

  window.getSelection()?.removeAllRanges();

  const { x, y } = resolveWipeOrigin(origin, {
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  let styleEl = document.getElementById(ANIM_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = ANIM_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    @keyframes kit-circular-wipe {
      from {
        clip-path: circle(0px at ${x}px ${y}px);
        -webkit-clip-path: circle(0px at ${x}px ${y}px);
      }
      to {
        clip-path: circle(${endRadius}px at ${x}px ${y}px);
        -webkit-clip-path: circle(${endRadius}px at ${x}px ${y}px);
      }
    }
    ::view-transition-new(root) {
      animation: kit-circular-wipe ${duration}ms ${DEFAULT_EASING} both !important;
    }
  `;

  animating = true;

  try {
    // applyDomTheme mutates the document class synchronously so the new
    // snapshot is already dark/light. persist() is next-themes setTheme.
    const transition = doc.startViewTransition(apply);
    if (transition?.finished) {
      transition.finished.then(cleanupAnimStyle).catch(cleanupAnimStyle);
    } else {
      window.setTimeout(cleanupAnimStyle, duration);
    }
  } catch {
    cleanupAnimStyle();
    apply();
  }
}
