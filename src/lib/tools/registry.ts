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

export type ToolCategory = "pdf" | "image" | "media" | "convert" | "text";

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
  | "media-convert"
  | "media-trim"
  | "media-speed"
  | "media-extract-audio"
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
  phase: 1 | 2 | 3;
}

export const tools: ToolDef[] = [
  { id: "pdf-merge", category: "pdf", icon: FileStack, phase: 1 },
  { id: "pdf-split", category: "pdf", icon: Scissors, phase: 2 },
  { id: "pdf-organize", category: "pdf", icon: RotateCcw, phase: 2 },
  { id: "pdf-compress", category: "pdf", icon: Minimize2, phase: 2 },
  { id: "pdf-watermark", category: "pdf", icon: Stamp, phase: 2 },
  { id: "pdf-redact", category: "pdf", icon: EyeOff, phase: 2 },
  { id: "pdf-extract", category: "pdf", icon: FileSearch, phase: 2 },
  { id: "image-compress", category: "image", icon: ImageDown, phase: 1 },
  { id: "image-resize", category: "image", icon: Scaling, phase: 2 },
  { id: "image-crop", category: "image", icon: Crop, phase: 2 },
  { id: "image-convert", category: "image", icon: RefreshCw, phase: 2 },
  { id: "image-metadata", category: "image", icon: Eraser, phase: 2 },
  { id: "image-adjust", category: "image", icon: SlidersHorizontal, phase: 2 },
  { id: "media-convert", category: "media", icon: Film, phase: 2 },
  { id: "media-trim", category: "media", icon: Timer, phase: 2 },
  { id: "media-speed", category: "media", icon: Gauge, phase: 2 },
  { id: "media-extract-audio", category: "media", icon: Music, phase: 2 },
  { id: "convert-hub", category: "convert", icon: ArrowLeftRight, phase: 2 },
  { id: "json-format", category: "text", icon: Braces, phase: 1 },
  { id: "yaml-format", category: "text", icon: FileCode2, phase: 3 },
  { id: "toml-format", category: "text", icon: FileType, phase: 3 },
  { id: "markdown-html", category: "text", icon: FileText, phase: 3 },
  { id: "csv-json", category: "text", icon: Table2, phase: 3 },
  { id: "text-diff", category: "text", icon: GitCompare, phase: 3 },
  { id: "base64", category: "text", icon: Binary, phase: 1 },
  { id: "url-encode", category: "text", icon: Link2, phase: 3 },
];

export const toolMap = Object.fromEntries(tools.map((t) => [t.id, t])) as Record<
  ToolId,
  ToolDef
>;

export const categories: ToolCategory[] = ["pdf", "image", "media", "convert", "text"];

export function getTool(id: string): ToolDef | undefined {
  return toolMap[id as ToolId];
}
