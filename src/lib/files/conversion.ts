export type ConversionInput = "json" | "yaml" | "csv" | "image" | "file" | "text";
export type ConversionOutput = "json" | "yaml" | "csv" | "zip" | "png" | "jpeg" | "webp";

export function detectConversionInput(file: Pick<File, "name" | "type"> | undefined, text: string): ConversionInput {
  if (file) {
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension === "json" || extension === "csv") return extension;
    if (extension === "yaml" || extension === "yml") return "yaml";
    if (file.type.startsWith("image/")) return "image";
    return "file";
  }
  const trimmed = text.trim();
  if (/^[{[]/.test(trimmed)) return "json";
  if (trimmed.includes(",") && trimmed.includes("\n")) return "csv";
  if (/^(?:---\s*$|[\w"'][^\n]*:\s)/m.test(trimmed)) return "yaml";
  return "text";
}

export function conversionOutputs(input: ConversionInput, hasFiles: boolean): ConversionOutput[] {
  const outputs: ConversionOutput[] = input === "json" || input === "text" ? ["yaml", "csv"]
    : input === "yaml" || input === "csv" ? ["json"]
      : input === "image" ? ["png", "jpeg", "webp"] : [];
  return hasFiles ? [...outputs, "zip"] : outputs;
}
