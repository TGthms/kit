import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEW,
  gridTicks,
  panView,
  zoomView,
  viewForAspect,
} from "./viewport";
describe("graph navigation", () => {
  it("zooms around a fixed point and can invert the change", () => {
    const zoomed = zoomView(DEFAULT_VIEW, 0.5, 2, 3);
    expect(zoomed.xMin).toBe(-4);
    expect(zoomed.yMax).toBe(5.25);
    expect(zoomView(zoomed, 2, 2, 3)).toEqual(DEFAULT_VIEW);
  });
  it("preserves span while panning and bounds unstable zooms", () => {
    expect(panView(DEFAULT_VIEW, 2, -3)).toEqual({
      xMin: -8,
      xMax: 12,
      yMin: -10.5,
      yMax: 4.5,
    });
    expect(zoomView(DEFAULT_VIEW, 0)).toEqual(DEFAULT_VIEW);
    expect(zoomView(DEFAULT_VIEW, 1e20)).toEqual(DEFAULT_VIEW);
    expect(panView(DEFAULT_VIEW, NaN, 0)).toEqual(DEFAULT_VIEW);
  });
  it("preserves equal unit scales on resize and respects invalid geometry", () => {
    const view = viewForAspect(DEFAULT_VIEW, 800, 400);
    expect(view.yMax - view.yMin).toBe(10);
    expect((view.xMax - view.xMin) / 800).toBe((view.yMax - view.yMin) / 400);
    expect(viewForAspect(DEFAULT_VIEW, 0, 400)).toEqual(DEFAULT_VIEW);
  });
  it("keeps grid lines finite and bounded at every scale", () => {
    for (const scale of [1e-6, 1, 1e6]) {
      const ticks = gridTicks(-10 * scale, 10 * scale);
      expect(ticks.length).toBeGreaterThan(2);
      expect(ticks.length).toBeLessThan(25);
      expect(ticks.every(Number.isFinite)).toBe(true);
    }
  });
});
