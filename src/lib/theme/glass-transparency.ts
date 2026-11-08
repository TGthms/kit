export const DEFAULT_GLASS_TRANSPARENCY = 50;

export function isGlassTransparency(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}
