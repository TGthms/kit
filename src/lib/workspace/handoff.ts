import type { ToolId } from "@/lib/tools/registry";
export const IMAGE_TARGETS = [
  "image-compress",
  "image-convert",
  "images-to-pdf",
] as const satisfies readonly ToolId[];
export type ImageTarget = (typeof IMAGE_TARGETS)[number];
export const HANDOFF_BYTES = 80 * 1024 * 1024;
const TTL = 5 * 60 * 1000;
let held: { target: ImageTarget; files: File[]; expires: number } | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
export function clearHandoff() {
  held = null;
  clearTimeout(timer);
}
export function stageHandoff(
  target: ImageTarget,
  files: File[],
  now = Date.now(),
): boolean {
  clearHandoff();
  if (
    !IMAGE_TARGETS.includes(target) ||
    !files.length ||
    files.length > 100 ||
    files.some((file) => !file.type.startsWith("image/")) ||
    files.reduce((sum, file) => sum + file.size, 0) > HANDOFF_BYTES
  )
    return false;
  held = { target, files: [...files], expires: now + TTL };
  timer = setTimeout(clearHandoff, TTL);
  return true;
}
/** One consumer, only on the intended tool, with a bounded memory lifetime.
 * Nothing is written to disk, an address, history or an external service. */
export function takeHandoff(
  target: ImageTarget,
  now = Date.now(),
): File[] | null {
  if (!held) return null;
  if (now >= held.expires) {
    clearHandoff();
    return null;
  }
  if (held.target !== target) return null;
  const files = held.files;
  clearHandoff();
  return files;
}
