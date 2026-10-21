/** CSS screen sizes, including iPhone 16 Pro Max (440 × 956 at 3×). */
// iOS also keeps native launch images outside the worker's release caches.
// Change the URL when artwork changes so the old icon is not reused.
export const STARTUP_IMAGE_VERSION = "spinner-1";

export const STARTUP_SCREENS = [
  { width: 375, height: 667, scale: 2 },
  { width: 414, height: 736, scale: 3 },
  { width: 375, height: 812, scale: 3 },
  { width: 414, height: 896, scale: 2 },
  { width: 414, height: 896, scale: 3 },
  { width: 390, height: 844, scale: 3 },
  { width: 393, height: 852, scale: 3 },
  { width: 402, height: 874, scale: 3 },
  { width: 428, height: 926, scale: 3 },
  { width: 430, height: 932, scale: 3 },
  { width: 440, height: 956, scale: 3 },
  { width: 768, height: 1024, scale: 2 },
  { width: 810, height: 1080, scale: 2 },
  { width: 820, height: 1180, scale: 2 },
  { width: 834, height: 1194, scale: 2 },
  { width: 1024, height: 1366, scale: 2 },
  { width: 1032, height: 1376, scale: 2 },
] as const;
