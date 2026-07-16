export const locales = ["en", "es", "zh", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function detectLocale(lang?: string | null): Locale {
  if (!lang) return defaultLocale;
  const lower = lang.toLowerCase();
  if (lower.startsWith("zh")) return "zh";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("en")) return "en";
  return defaultLocale;
}

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
  ja: "日本語",
};
