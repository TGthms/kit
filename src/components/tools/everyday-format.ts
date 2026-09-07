import type { ToolId } from "@/lib/tools/registry";
import type { useTranslations } from "next-intl";

export const toolId = (value: string) => value as ToolId;
type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

export function text(t: ReturnType<typeof useTranslations>, key: string, fallback: string, values?: Record<string, string | number>) {
  try {
    const translate = t as unknown as TranslationFn;
    const result = translate(key, values);
    if (!result || result === key || result.endsWith(`.${key}`)) return fallback;
    return result;
  } catch {
    return fallback;
  }
}

export function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
