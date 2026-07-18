import type { LucideIcon } from "lucide-react";
import {
  FileStack,
  Scissors,
  RotateCcw,
  Minimize2,
  Stamp,
  EyeOff,
  FileSearch,
  ImageDown,
  Scaling,
  Crop,
  RefreshCw,
  Eraser,
  SlidersHorizontal,
  Film,
  Timer,
  Gauge,
  Music,
  AudioLines,
  ArrowLeftRight,
  Braces,
  FileCode2,
  FileType,
  FileText,
  Table2,
  GitCompare,
  Binary,
  Link2,
} from "lucide-react";

/** Precise product categories (one job family each). */
export type ToolCategory = "pdf" | "image" | "audio" | "video" | "convert" | "text";

export type ToolId =
  | "pdf-merge"
  | "pdf-split"
  | "pdf-organize"
  | "pdf-compress"
  | "pdf-watermark"
  | "pdf-redact"
  | "pdf-extract"
  | "image-compress"
  | "image-resize"
  | "image-crop"
  | "image-convert"
  | "image-metadata"
  | "image-adjust"
  | "audio-convert"
  | "audio-trim"
  | "audio-speed"
  | "video-convert"
  | "video-trim"
  | "video-speed"
  | "video-extract-audio"
  | "convert-hub"
  | "json-format"
  | "yaml-format"
  | "toml-format"
  | "markdown-html"
  | "csv-json"
  | "text-diff"
  | "base64"
  | "url-encode";

export interface ToolDef {
  id: ToolId;
  category: ToolCategory;
  icon: LucideIcon;
}

export const tools: ToolDef[] = [
  // PDF
  { id: "pdf-merge", category: "pdf", icon: FileStack },
  { id: "pdf-split", category: "pdf", icon: Scissors },
  { id: "pdf-organize", category: "pdf", icon: RotateCcw },
  { id: "pdf-compress", category: "pdf", icon: Minimize2 },
  { id: "pdf-watermark", category: "pdf", icon: Stamp },
  { id: "pdf-redact", category: "pdf", icon: EyeOff },
  { id: "pdf-extract", category: "pdf", icon: FileSearch },
  // Images
  { id: "image-compress", category: "image", icon: ImageDown },
  { id: "image-resize", category: "image", icon: Scaling },
  { id: "image-crop", category: "image", icon: Crop },
  { id: "image-convert", category: "image", icon: RefreshCw },
  { id: "image-metadata", category: "image", icon: Eraser },
  { id: "image-adjust", category: "image", icon: SlidersHorizontal },
  // Audio
  { id: "audio-convert", category: "audio", icon: AudioLines },
  { id: "audio-trim", category: "audio", icon: Timer },
  { id: "audio-speed", category: "audio", icon: Gauge },
  // Video
  { id: "video-convert", category: "video", icon: Film },
  { id: "video-trim", category: "video", icon: Timer },
  { id: "video-speed", category: "video", icon: Gauge },
  { id: "video-extract-audio", category: "video", icon: Music },
  // Cross-format converters
  { id: "convert-hub", category: "convert", icon: ArrowLeftRight },
  // Text & data
  { id: "json-format", category: "text", icon: Braces },
  { id: "yaml-format", category: "text", icon: FileCode2 },
  { id: "toml-format", category: "text", icon: FileType },
  { id: "markdown-html", category: "text", icon: FileText },
  { id: "csv-json", category: "text", icon: Table2 },
  { id: "text-diff", category: "text", icon: GitCompare },
  { id: "base64", category: "text", icon: Binary },
  { id: "url-encode", category: "text", icon: Link2 },
];

export const toolMap = Object.fromEntries(tools.map((t) => [t.id, t])) as Record<
  ToolId,
  ToolDef
>;

export const categories: ToolCategory[] = [
  "pdf",
  "image",
  "audio",
  "video",
  "convert",
  "text",
];

/** Map retired tool ids so old history/favorites still resolve. */
export const legacyToolIdMap: Record<string, ToolId> = {
  "media-convert": "video-convert",
  "media-trim": "video-trim",
  "media-speed": "video-speed",
  "media-extract-audio": "video-extract-audio",
};

export function getTool(id: string): ToolDef | undefined {
  const resolved = legacyToolIdMap[id] ?? id;
  return toolMap[resolved as ToolId];
}

export function resolveToolId(id: string): ToolId | null {
  const tool = getTool(id);
  return tool?.id ?? null;
}
