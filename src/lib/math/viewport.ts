import type { Viewport } from "./client";
export const DEFAULT_VIEW: Viewport = {
  xMin: -10,
  xMax: 10,
  yMin: -7.5,
  yMax: 7.5,
};
export function zoomView(
  view: Viewport,
  factor: number,
  cx = (view.xMin + view.xMax) / 2,
  cy = (view.yMin + view.yMax) / 2,
): Viewport {
  const width = (view.xMax - view.xMin) * factor;
  const height = (view.yMax - view.yMin) * factor;
  if (
    !Number.isFinite(factor) ||
    factor <= 0 ||
    width < 1e-6 ||
    width > 1e8 ||
    height < 1e-6 ||
    height > 1e8
  )
    return view;
  return {
    xMin: cx + (view.xMin - cx) * factor,
    xMax: cx + (view.xMax - cx) * factor,
    yMin: cy + (view.yMin - cy) * factor,
    yMax: cy + (view.yMax - cy) * factor,
  };
}
export function panView(view: Viewport, dx: number, dy: number): Viewport {
  if (
    ![dx, dy].every(Number.isFinite) ||
    Math.abs(view.xMin + dx) > 1e10 ||
    Math.abs(view.yMin + dy) > 1e10
  )
    return view;
  return {
    xMin: view.xMin + dx,
    xMax: view.xMax + dx,
    yMin: view.yMin + dy,
    yMax: view.yMax + dy,
  };
}
export function gridTicks(min: number, max: number, divisions = 8): number[] {
  const raw = (max - min) / Math.max(1, Math.min(48, divisions));
  if (!Number.isFinite(raw) || raw <= 0) return [];
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].find((n) => n * power >= raw)! * power;
  const start = Math.ceil(min / step);
  return Array.from(
    {
      length: Math.min(
        Math.max(24, divisions * 2),
        Math.max(0, Math.floor(max / step) - start + 1),
      ),
    },
    (_, i) => (start + i) * step,
  );
}

export function validView(view: Viewport): boolean {
  const { xMin, xMax, yMin, yMax } = view;
  return (
    [xMin, xMax, yMin, yMax].every(
      (n) => Number.isFinite(n) && Math.abs(n) <= 1e10,
    ) &&
    xMax - xMin >= 1e-6 &&
    xMax - xMin <= 1e8 &&
    yMax - yMin >= 1e-6 &&
    yMax - yMin <= 1e8
  );
}

/** Preserve equal x/y units when the working surface changes size. */
export function viewForAspect(
  view: Viewport,
  width: number,
  height: number,
): Viewport {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return view;
  const span = ((view.xMax - view.xMin) * height) / width;
  const center = (view.yMin + view.yMax) / 2;
  const next = { ...view, yMin: center - span / 2, yMax: center + span / 2 };
  return validView(next) ? next : view;
}
