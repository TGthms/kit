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
  PdfNumbers,
  PdfToImages,
  ImagesToPdf,
  PdfFlatten,
  PdfMetadata,
  PdfProtect,
  PdfSign,
} from "./pdf-extra-tools";
import {
  ImageCompress,
  ImageResize,
  ImageCrop,
  ImageConvert,
  ImageMetadata,
  ImageAdjust,
} from "./image-tools";
import { ImageRotate, ImageFilters, ImageFavicon, ImageWatermark } from "./image-extra-tools";
import { AudioConvert, AudioTrim, AudioSpeed } from "./audio-tools";
import {
  VideoConvert,
  VideoTrim,
  VideoSpeed,
  VideoExtractAudio,
  VideoGif,
} from "./video-tools";
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
import {
  XmlJson,
  SqlFormat,
  RegexTester,
  HashGenerator,
  UuidGenerator,
  ColorConvert,
  LoremIpsum,
  QrCodeTool,
} from "./text-extra-tools";
import {
  JwtDecode,
  UnixTimestamp,
  CronExplain,
  NumberBase,
  HtmlEntities,
  CaseConvert,
  PasswordGenerator,
  JsonTypes,
} from "./work-tools";

const TOOL_COMPONENTS: Record<ToolId, ComponentType> = {
  "pdf-merge": PdfMerge,
  "pdf-split": PdfSplit,
  "pdf-organize": PdfOrganize,
  "pdf-compress": PdfCompress,
  "pdf-watermark": PdfWatermark,
  "pdf-redact": PdfRedact,
  "pdf-extract": PdfExtract,
  "pdf-numbers": PdfNumbers,
  "pdf-to-images": PdfToImages,
  "images-to-pdf": ImagesToPdf,
  "pdf-flatten": PdfFlatten,
  "pdf-metadata": PdfMetadata,
  "pdf-protect": PdfProtect,
  "pdf-sign": PdfSign,
  "image-compress": ImageCompress,
  "image-resize": ImageResize,
  "image-crop": ImageCrop,
  "image-convert": ImageConvert,
  "image-metadata": ImageMetadata,
  "image-adjust": ImageAdjust,
  "image-rotate": ImageRotate,
  "image-filters": ImageFilters,
  "image-favicon": ImageFavicon,
  "image-watermark": ImageWatermark,
  "audio-convert": AudioConvert,
  "audio-trim": AudioTrim,
  "audio-speed": AudioSpeed,
  "video-convert": VideoConvert,
  "video-trim": VideoTrim,
  "video-speed": VideoSpeed,
  "video-extract-audio": VideoExtractAudio,
  "video-gif": VideoGif,
  "convert-hub": ConvertHub,
  "json-format": JsonFormat,
  "yaml-format": YamlFormat,
  "toml-format": TomlFormat,
  "markdown-html": MarkdownHtml,
  "csv-json": CsvJson,
  "text-diff": TextDiff,
  "base64": Base64Tool,
  "url-encode": UrlEncodeTool,
  "xml-json": XmlJson,
  "sql-format": SqlFormat,
  "regex-tester": RegexTester,
  "hash-generator": HashGenerator,
  "uuid-generator": UuidGenerator,
  "color-convert": ColorConvert,
  "lorem-ipsum": LoremIpsum,
  "qr-code": QrCodeTool,
  "password-generator": PasswordGenerator,
  "case-convert": CaseConvert,
  "jwt-decode": JwtDecode,
  "unix-timestamp": UnixTimestamp,
  "cron-explain": CronExplain,
  "number-base": NumberBase,
  "html-entities": HtmlEntities,
  "json-types": JsonTypes,
};

export function ToolView({ toolId }: { toolId: ToolId }) {
  const Component = TOOL_COMPONENTS[toolId];
  if (!Component) return null;
  return <Component />;
}
