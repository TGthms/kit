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
  Coins,
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
  Ruler,
  Scale,
  Thermometer,
  GlassWater,
  Zap,
  BatteryCharging,
  Square,
  Orbit,
  Activity,
  Dumbbell,
  HeartPulse,
  Fuel,
  MoveUpRight,
  Cable,
  Percent,
  Landmark,
  ListFilter,
  Contrast,
  RectangleHorizontal,
  Users,
  BadgeCheck,
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
  | "converter"
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
  | "health"
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
  | "length-converter"
  | "mass-converter"
  | "temperature-converter"
  | "speed-converter"
  | "duration-converter"
  | "volume-converter"
  | "power-converter"
  | "energy-converter"
  | "pressure-converter"
  | "area-converter"
  | "data-converter"
  | "angle-converter"
  | "frequency-converter"
  | "force-converter"
  | "fuel-economy-converter"
  | "acceleration-converter"
  | "torque-converter"
  | "electrical-converter"
  | "typography-converter"
  | "currency-converter"
  | "text-counter"
  | "timezone-converter"
  | "date-calculator"
  | "tip-split-calculator"
  | "percentage-calculator"
  | "loan-calculator"
  | "bmi-calorie-calculator"
  | "stopwatch-timer"
  | "meeting-planner"
  | "random-generator"
  | "text-lines"
  | "slugify"
  | "color-contrast"
  | "image-palette"
  | "aspect-ratio"
  | "json-query"
  | "check-digits";

export interface ToolDef {
  id: ToolId;
  category: ToolCategory;
  group: ToolGroup;
  icon: LucideIcon;
  /** Whether the tool accepts or processes local files. */
  fileTool?: boolean;
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
  { id: "images-to-pdf", category: "pdf", group: "export", icon: FileImage, fileTool: true },

  { id: "image-compress", category: "image", group: "transform", icon: ImageDown },
  { id: "image-resize", category: "image", group: "transform", icon: Scaling },
  { id: "image-crop", category: "image", group: "transform", icon: Crop },
  { id: "image-rotate", category: "image", group: "transform", icon: RotateCw },
  { id: "image-favicon", category: "image", group: "transform", icon: AppWindow },
  { id: "image-adjust", category: "image", group: "look", icon: SlidersHorizontal },
  { id: "image-filters", category: "image", group: "look", icon: Sparkles },
  { id: "image-watermark", category: "image", group: "look", icon: Stamp },
  { id: "image-palette", category: "image", group: "look", icon: Palette },
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
  { id: "json-query", category: "data", group: "formats", icon: Braces },
  { id: "convert-hub", category: "data", group: "formats", icon: ArrowLeftRight, fileTool: true },

  { id: "markdown-html", category: "text", group: "write", icon: FileText },
  { id: "text-diff", category: "text", group: "write", icon: GitCompare },
  { id: "case-convert", category: "text", group: "write", icon: CaseSensitive },
  { id: "text-lines", category: "text", group: "write", icon: ListFilter },
  { id: "slugify", category: "text", group: "write", icon: Link2 },
  { id: "lorem-ipsum", category: "text", group: "write", icon: Type },

  { id: "hash-generator", category: "developer", group: "inspect", icon: Fingerprint },

  { id: "currency-converter", category: "converter", group: "convert", icon: Coins },
  { id: "length-converter", category: "converter", group: "convert", icon: Ruler },
  { id: "mass-converter", category: "converter", group: "convert", icon: Scale },
  { id: "temperature-converter", category: "converter", group: "convert", icon: Thermometer },
  { id: "speed-converter", category: "converter", group: "convert", icon: Gauge },
  { id: "duration-converter", category: "converter", group: "convert", icon: Clock },
  { id: "volume-converter", category: "converter", group: "convert", icon: GlassWater },
  { id: "power-converter", category: "converter", group: "convert", icon: Zap },
  { id: "energy-converter", category: "converter", group: "convert", icon: BatteryCharging },
  { id: "pressure-converter", category: "converter", group: "convert", icon: Gauge },
  { id: "area-converter", category: "converter", group: "convert", icon: Square },
  { id: "data-converter", category: "converter", group: "convert", icon: Database },
  { id: "angle-converter", category: "converter", group: "convert", icon: Orbit },
  { id: "frequency-converter", category: "converter", group: "convert", icon: Activity },
  { id: "force-converter", category: "converter", group: "convert", icon: Dumbbell },
  { id: "fuel-economy-converter", category: "converter", group: "convert", icon: Fuel },
  { id: "acceleration-converter", category: "converter", group: "convert", icon: MoveUpRight },
  { id: "torque-converter", category: "converter", group: "convert", icon: RotateCw },
  { id: "electrical-converter", category: "converter", group: "convert", icon: Cable },
  { id: "typography-converter", category: "converter", group: "convert", icon: Type },
  { id: "aspect-ratio", category: "converter", group: "convert", icon: RectangleHorizontal },
  { id: "text-counter", category: "everyday", group: "everyday-text", icon: TextCursorInput },
  { id: "timezone-converter", category: "everyday", group: "time", icon: Globe2 },
  { id: "meeting-planner", category: "everyday", group: "time", icon: Users },
  { id: "date-calculator", category: "everyday", group: "time", icon: CalendarDays },
  { id: "tip-split-calculator", category: "everyday", group: "money", icon: WalletCards },
  { id: "percentage-calculator", category: "everyday", group: "money", icon: Percent },
  { id: "loan-calculator", category: "everyday", group: "money", icon: Landmark },
  { id: "bmi-calorie-calculator", category: "everyday", group: "health", icon: HeartPulse },
  { id: "stopwatch-timer", category: "everyday", group: "time", icon: TimerReset },
  { id: "random-generator", category: "everyday", group: "quick", icon: Dice5 },
  { id: "jwt-decode", category: "developer", group: "inspect", icon: Shield },
  { id: "regex-tester", category: "developer", group: "inspect", icon: Search },
  { id: "unix-timestamp", category: "developer", group: "inspect", icon: Clock },
  { id: "cron-explain", category: "developer", group: "inspect", icon: CalendarClock },
  { id: "number-base", category: "developer", group: "inspect", icon: Hash },
  { id: "color-convert", category: "developer", group: "inspect", icon: Palette },
  { id: "color-contrast", category: "developer", group: "inspect", icon: Contrast },
  { id: "check-digits", category: "developer", group: "inspect", icon: BadgeCheck },
  { id: "base64", category: "developer", group: "encode", icon: Binary },
  { id: "url-encode", category: "developer", group: "encode", icon: Link2 },
  { id: "html-entities", category: "developer", group: "encode", icon: Code2 },
  { id: "uuid-generator", category: "developer", group: "generate", icon: Hash },
  { id: "password-generator", category: "everyday", group: "quick", icon: KeyRound },
  { id: "qr-code", category: "everyday", group: "quick", icon: QrCode },
];

export const featuredToolIds: ToolId[] = [
  "currency-converter",
  "timezone-converter",
  "random-generator",
  "stopwatch-timer",
  "password-generator",
  "qr-code",
  "text-counter",
  "video-gif",
  "bmi-calorie-calculator",
];

export const toolMap = Object.fromEntries(tools.map((t) => [t.id, t])) as Record<ToolId, ToolDef>;

export const categories: ToolCategory[] = [
  "converter",
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
  converter: ["convert"],
  everyday: ["convert", "time", "money", "health", "everyday-text", "quick"],
};

/** Map retired tool ids so old history/favorites still resolve. */
export const legacyToolIdMap: Record<string, ToolId> = {
  "media-convert": "video-convert",
  "media-trim": "video-trim",
  "media-speed": "video-speed",
  "media-extract-audio": "video-extract-audio",
  "everyday-converter": "length-converter",
};

export function getTool(id: string): ToolDef | undefined {
  const resolved = legacyToolIdMap[id] ?? id;
  return toolMap[resolved as ToolId];
}

export function resolveToolId(id: string): ToolId | null {
  const tool = getTool(id);
  return tool?.id ?? null;
}

export function isFileTool(tool: ToolDef): boolean {
  return tool.fileTool === true || ["pdf", "image", "audio", "video"].includes(tool.category);
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
