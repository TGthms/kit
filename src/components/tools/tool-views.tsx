"use client";

import type { ComponentType } from "react";
import type { ToolId } from "@/lib/tools/registry";
import {
  PdfMerge,
  PdfSplit,
  PdfOrganize,
  PdfCompress,
  PdfWatermark,
  PdfRedact,
  PdfExtract,
} from "./pdf-tools";
import {
  ImageCompress,
  ImageResize,
  ImageCrop,
  ImageConvert,
  ImageMetadata,
  ImageAdjust,
} from "./image-tools";
import {
  MediaConvert,
  MediaTrim,
  MediaSpeed,
  MediaExtractAudio,
} from "./media-tools";
import { ConvertHub } from "./convert-tools";
import {
  JsonFormat,
  YamlFormat,
  TomlFormat,
  MarkdownHtml,
  CsvJson,
  TextDiff,
  Base64Tool,
  UrlEncodeTool,
} from "./text-tools";

const TOOL_COMPONENTS: Record<ToolId, ComponentType> = {
  "pdf-merge": PdfMerge,
  "pdf-split": PdfSplit,
  "pdf-organize": PdfOrganize,
  "pdf-compress": PdfCompress,
  "pdf-watermark": PdfWatermark,
  "pdf-redact": PdfRedact,
  "pdf-extract": PdfExtract,
  "image-compress": ImageCompress,
  "image-resize": ImageResize,
  "image-crop": ImageCrop,
  "image-convert": ImageConvert,
  "image-metadata": ImageMetadata,
  "image-adjust": ImageAdjust,
  "media-convert": MediaConvert,
  "media-trim": MediaTrim,
  "media-speed": MediaSpeed,
  "media-extract-audio": MediaExtractAudio,
  "convert-hub": ConvertHub,
  "json-format": JsonFormat,
  "yaml-format": YamlFormat,
  "toml-format": TomlFormat,
  "markdown-html": MarkdownHtml,
  "csv-json": CsvJson,
  "text-diff": TextDiff,
  "base64": Base64Tool,
  "url-encode": UrlEncodeTool,
};

export function ToolView({ toolId }: { toolId: ToolId }) {
  const Component = TOOL_COMPONENTS[toolId];
  if (!Component) return null;
  return <Component />;
}
