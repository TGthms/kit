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
  Hash,
  Images,
  FileImage,
  Layers,
  FilePenLine,
  Lock,
  RotateCw,
  Sparkles,
  AppWindow,
  FileJson,
  Database,
  Search,
  Fingerprint,
  Palette,
  Type,
  QrCode,
  PenLine,
  KeyRound,
  CaseSensitive,
  Clock,
  CalendarClock,
  CalendarDays,
  Code2,
  Shield,
  Globe2,
  TextCursorInput,
  Dice5,
  TimerReset,
  WalletCards,
} from "lucide-react";

/** Precise product categories (one job family each). */
export type ToolCategory =
  | "pdf"
  | "image"
  | "audio"
  | "video"
  | "data"
  | "text"
  | "developer"
  | "everyday";

export type ToolGroup =
  | "pages"
  | "protect"
  | "markup"
  | "export"
  | "transform"
  | "look"
  | "file"
  | "clip"
  | "formats"
  | "write"
  | "inspect"
  | "encode"
  | "generate"
  | "convert"
  | "time"
  | "money"
  | "everyday-text"
  | "quick";

export type ToolId =
  | "pdf-merge"
  | "pdf-split"
  | "pdf-organize"
  | "pdf-compress"
  | "pdf-watermark"
  | "pdf-redact"
  | "pdf-extract"
  | "pdf-numbers"
  | "pdf-to-images"
  | "images-to-pdf"
  | "pdf-flatten"
  | "pdf-metadata"
  | "pdf-protect"
  | "pdf-sign"
  | "image-compress"
  | "image-resize"
  | "image-crop"
  | "image-convert"
  | "image-metadata"
  | "image-adjust"
  | "image-rotate"
  | "image-filters"
  | "image-favicon"
  | "image-watermark"
  | "audio-convert"
  | "audio-trim"
  | "audio-speed"
  | "video-convert"
  | "video-trim"
  | "video-speed"
  | "video-extract-audio"
  | "video-gif"
  | "convert-hub"
  | "json-format"
  | "yaml-format"
  | "toml-format"
  | "markdown-html"
  | "csv-json"
  | "text-diff"
  | "base64"
  | "url-encode"
  | "xml-json"
  | "sql-format"
  | "regex-tester"
  | "hash-generator"
  | "uuid-generator"
  | "color-convert"
  | "lorem-ipsum"
  | "qr-code"
  | "password-generator"
  | "case-convert"
  | "jwt-decode"
  | "unix-timestamp"
  | "cron-explain"
  | "number-base"
  | "html-entities"
  | "json-types"
  | "everyday-converter"
  | "text-counter"
  | "timezone-converter"
  | "date-calculator"
  | "tip-split-calculator"
  | "stopwatch-timer"
  | "random-generator";

export interface ToolDef {
  id: ToolId;
  category: ToolCategory;
  group: ToolGroup;
  icon: LucideIcon;
}

export const tools: ToolDef[] = [
  { id: "pdf-merge", category: "pdf", group: "pages", icon: FileStack },
  { id: "pdf-split", category: "pdf", group: "pages", icon: Scissors },
  { id: "pdf-organize", category: "pdf", group: "pages", icon: RotateCcw },
  { id: "pdf-numbers", category: "pdf", group: "pages", icon: Hash },
  { id: "pdf-compress", category: "pdf", group: "protect", icon: Minimize2 },
  { id: "pdf-protect", category: "pdf", group: "protect", icon: Lock },
  { id: "pdf-metadata", category: "pdf", group: "protect", icon: FilePenLine },
  { id: "pdf-flatten", category: "pdf", group: "protect", icon: Layers },
  { id: "pdf-watermark", category: "pdf", group: "markup", icon: Stamp },
  { id: "pdf-redact", category: "pdf", group: "markup", icon: EyeOff },
  { id: "pdf-sign", category: "pdf", group: "markup", icon: PenLine },
  { id: "pdf-extract", category: "pdf", group: "export", icon: FileSearch },
  { id: "pdf-to-images", category: "pdf", group: "export", icon: Images },
  { id: "images-to-pdf", category: "everyday", group: "quick", icon: FileImage },

  { id: "image-compress", category: "image", group: "transform", icon: ImageDown },
  { id: "image-resize", category: "image", group: "transform", icon: Scaling },
  { id: "image-crop", category: "image", group: "transform", icon: Crop },
  { id: "image-rotate", category: "image", group: "transform", icon: RotateCw },
  { id: "image-favicon", category: "image", group: "transform", icon: AppWindow },
  { id: "image-adjust", category: "image", group: "look", icon: SlidersHorizontal },
  { id: "image-filters", category: "image", group: "look", icon: Sparkles },
  { id: "image-watermark", category: "image", group: "look", icon: Stamp },
  { id: "image-convert", category: "image", group: "file", icon: RefreshCw },
  { id: "image-metadata", category: "image", group: "file", icon: Eraser },

  { id: "audio-convert", category: "audio", group: "clip", icon: AudioLines },
  { id: "audio-trim", category: "audio", group: "clip", icon: Timer },
  { id: "audio-speed", category: "audio", group: "clip", icon: Gauge },

  { id: "video-convert", category: "video", group: "clip", icon: Film },
  { id: "video-trim", category: "video", group: "clip", icon: Timer },
  { id: "video-speed", category: "video", group: "clip", icon: Gauge },
  { id: "video-extract-audio", category: "video", group: "clip", icon: Music },
  { id: "video-gif", category: "video", group: "clip", icon: Film },

  { id: "json-format", category: "data", group: "formats", icon: Braces },
  { id: "yaml-format", category: "data", group: "formats", icon: FileCode2 },
  { id: "toml-format", category: "data", group: "formats", icon: FileType },
  { id: "csv-json", category: "data", group: "formats", icon: Table2 },
  { id: "xml-json", category: "data", group: "formats", icon: FileJson },
  { id: "sql-format", category: "data", group: "formats", icon: Database },
  { id: "json-types", category: "data", group: "formats", icon: Code2 },
  { id: "convert-hub", category: "data", group: "formats", icon: ArrowLeftRight },

  { id: "markdown-html", category: "text", group: "write", icon: FileText },
  { id: "text-diff", category: "text", group: "write", icon: GitCompare },
  { id: "case-convert", category: "text", group: "write", icon: CaseSensitive },
  { id: "lorem-ipsum", category: "text", group: "write", icon: Type },

  { id: "hash-generator", category: "developer", group: "inspect", icon: Fingerprint },

  { id: "everyday-converter", category: "everyday", group: "convert", icon: ArrowLeftRight },
  { id: "text-counter", category: "everyday", group: "everyday-text", icon: TextCursorInput },
  { id: "timezone-converter", category: "everyday", group: "time", icon: Globe2 },
  { id: "date-calculator", category: "everyday", group: "time", icon: CalendarDays },
  { id: "tip-split-calculator", category: "everyday", group: "money", icon: WalletCards },
  { id: "stopwatch-timer", category: "everyday", group: "time", icon: TimerReset },
  { id: "random-generator", category: "everyday", group: "quick", icon: Dice5 },
  { id: "jwt-decode", category: "developer", group: "inspect", icon: Shield },
  { id: "regex-tester", category: "developer", group: "inspect", icon: Search },
  { id: "unix-timestamp", category: "developer", group: "inspect", icon: Clock },
  { id: "cron-explain", category: "developer", group: "inspect", icon: CalendarClock },
  { id: "number-base", category: "developer", group: "inspect", icon: Hash },
  { id: "color-convert", category: "developer", group: "inspect", icon: Palette },
  { id: "base64", category: "developer", group: "encode", icon: Binary },
  { id: "url-encode", category: "developer", group: "encode", icon: Link2 },
  { id: "html-entities", category: "developer", group: "encode", icon: Code2 },
  { id: "uuid-generator", category: "developer", group: "generate", icon: Hash },
  { id: "password-generator", category: "everyday", group: "quick", icon: KeyRound },
  { id: "qr-code", category: "everyday", group: "quick", icon: QrCode },
];

export const featuredToolIds: ToolId[] = [
  "pdf-merge",
  "image-compress",
  "everyday-converter",
  "text-counter",
  "qr-code",
  "password-generator",
  "image-watermark",
];

export const toolMap = Object.fromEntries(tools.map((t) => [t.id, t])) as Record<ToolId, ToolDef>;

export const categories: ToolCategory[] = [
  "everyday",
  "pdf",
  "image",
  "audio",
  "video",
  "data",
  "text",
  "developer",
];

export const categoryGroupOrder: Record<ToolCategory, ToolGroup[]> = {
  pdf: ["pages", "protect", "markup", "export"],
  image: ["transform", "look", "file"],
  audio: ["clip"],
  video: ["clip"],
  data: ["formats"],
  text: ["write"],
  developer: ["inspect", "encode", "generate"],
  everyday: ["convert", "time", "money", "everyday-text", "quick"],
};

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

export function toolsInCategory(category: ToolCategory): ToolDef[] {
  return tools.filter((t) => t.category === category);
}

export function groupedTools(category: ToolCategory): Array<{ group: ToolGroup; tools: ToolDef[] }> {
  const list = toolsInCategory(category);
  return categoryGroupOrder[category]
    .map((group) => ({ group, tools: list.filter((t) => t.group === group) }))
    .filter((g) => g.tools.length > 0);
}
