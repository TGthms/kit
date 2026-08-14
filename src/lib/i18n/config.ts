export const locales = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt-BR",
  "pt-PT",
  "nl",
  "da",
  "sv",
  "nb",
  "fi",
  "pl",
  "cs",
  "hu",
  "ro",
  "el",
  "tr",
  "ru",
  "uk",
  "ar",
  "he",
  "hi",
  "th",
  "vi",
  "id",
  "ja",
  "ko",
  "zh-Hans",
  "zh-Hant",
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Extra URL segment kept so existing /zh/ Pages links still resolve. */
export const localeAliases = ["zh"] as const;
export type PathLocale = Locale | (typeof localeAliases)[number];

export const pathLocales: readonly PathLocale[] = [...locales, ...localeAliases];

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)",
  nl: "Nederlands",
  da: "Dansk",
  sv: "Svenska",
  nb: "Norsk Bokmål",
  fi: "Suomi",
  pl: "Polski",
  cs: "Čeština",
  hu: "Magyar",
  ro: "Română",
  el: "Ελληνικά",
  tr: "Türkçe",
  ru: "Русский",
  uk: "Українська",
  ar: "العربية",
  he: "עברית",
  hi: "हिन्दी",
  th: "ไทย",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  ja: "日本語",
  ko: "한국어",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
};

export const localeDirections: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  es: "ltr",
  fr: "ltr",
  de: "ltr",
  it: "ltr",
  "pt-BR": "ltr",
  "pt-PT": "ltr",
  nl: "ltr",
  da: "ltr",
  sv: "ltr",
  nb: "ltr",
  fi: "ltr",
  pl: "ltr",
  cs: "ltr",
  hu: "ltr",
  ro: "ltr",
  el: "ltr",
  tr: "ltr",
  ru: "ltr",
  uk: "ltr",
  ar: "rtl",
  he: "rtl",
  hi: "ltr",
  th: "ltr",
  vi: "ltr",
  id: "ltr",
  ja: "ltr",
  ko: "ltr",
  "zh-Hans": "ltr",
  "zh-Hant": "ltr",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isPathLocale(value: string): value is PathLocale {
  return isLocale(value) || (localeAliases as readonly string[]).includes(value);
}

/** Map a path or stored code onto a catalog locale. `zh` → `zh-Hans`. */
export function resolveLocale(value: string | null | undefined): Locale {
  if (!value) return defaultLocale;
  if (value === "zh") return "zh-Hans";
  if (isLocale(value)) return value;
  return defaultLocale;
}

export function localeDir(value: string): "ltr" | "rtl" {
  return localeDirections[resolveLocale(value)];
}

export function localeHtmlLang(value: string): string {
  return resolveLocale(value);
}

function normalizeTag(lang: string): string {
  return lang.trim().replace(/_/g, "-").toLowerCase();
}

/**
 * Map a browser/BCP-47 tag onto a Kit locale.
 * Distinguishes pt-BR vs pt-PT and zh-Hans vs zh-Hant.
 */
export function detectLocale(lang?: string | null): Locale {
  if (!lang) return defaultLocale;
  const lower = normalizeTag(lang);

  const exact = locales.find((l) => l.toLowerCase() === lower);
  if (exact) return exact;

  if (lower === "zh" || lower.startsWith("zh-")) {
    if (
      lower.includes("hant") ||
      lower.includes("-tw") ||
      lower.includes("-hk") ||
      lower.includes("-mo")
    ) {
      return "zh-Hant";
    }
    return "zh-Hans";
  }

  if (lower === "pt" || lower.startsWith("pt-")) {
    if (lower.includes("br")) return "pt-BR";
    return "pt-PT";
  }

  if (lower === "no" || lower.startsWith("no-") || lower.startsWith("nb") || lower.startsWith("nn")) {
    return "nb";
  }

  const prefix = lower.split("-")[0] ?? "";
  const byPrefix = locales.find((l) => l.toLowerCase() === prefix);
  if (byPrefix) return byPrefix;

  return defaultLocale;
}

export const messageFileFor = (locale: string): Locale => resolveLocale(locale);
