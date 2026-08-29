export const SITE_URL = "https://trykit.pages.dev";
export const SITE_NAME = "Kit";
export const SITE_AUTHOR = "Tim G";
export const SITE_AUTHOR_URL = "https://t-g.pages.dev";

/**
 * Static-host CSP for the client-only app and its explicitly documented CDNs.
 *
 * NOTE: this is delivered via a `<meta http-equiv="Content-Security-Policy">`
 * tag (see app/layout.tsx) because the app is a static export with no server
 * to set a real HTTP response header. Meta-tag CSP cannot enforce
 * `frame-ancestors`, `sandbox`, or `report-uri`; clickjacking protection and
 * other response-header-only hardening (X-Content-Type-Options,
 * Referrer-Policy, Permissions-Policy) is instead configured at the hosting
 * layer — see public/_headers (Cloudflare Pages).
 *
 * `script-src` still allows 'unsafe-inline' for the two static inline
 * scripts we render (the pre-hydration theme script and the JSON-LD block);
 * both come from trusted, repo-controlled content (never end-user input),
 * so this is a defense-in-depth gap rather than a live vulnerability. Moving
 * to per-page hash-based allow-listing (dropping 'unsafe-inline' entirely)
 * is worth doing but needs to be verified against real browser CSP
 * enforcement across every locale before shipping, since a wrong hash would
 * silently break the theme script or the structured-data block.
 *
 * The pdf.js worker is self-hosted (see lib/pdf/pdfjs.ts), so
 * cdn.jsdelivr.net is only needed for the ffmpeg.wasm core, which is not
 * (yet) vendored locally due to its size.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://cdn.jsdelivr.net https://api.frankfurter.dev blob:",
  "worker-src 'self' blob:",
].join("; ");

/** Default social card. Always on the canonical host (no GitHub Pages /kit prefix). */
export const OG_IMAGE_PATH = "/og/kit.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT = "Kit — everyday browser tools that stay on your device";

/** Canonical URL for SEO and discovery, independent of the backup host's base path. */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/** Absolute URL on trykit.pages.dev, ignoring NEXT_PUBLIC_BASE_PATH. */
export function canonicalAssetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function ogImageUrl(): string {
  return canonicalAssetUrl(OG_IMAGE_PATH);
}

/**
 * Facebook/Open Graph locale tags (language_TERRITORY).
 * `zh` path alias maps to Simplified Chinese.
 */
export const ogLocales: Record<string, string> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  it: "it_IT",
  "pt-BR": "pt_BR",
  "pt-PT": "pt_PT",
  nl: "nl_NL",
  da: "da_DK",
  sv: "sv_SE",
  nb: "nb_NO",
  fi: "fi_FI",
  pl: "pl_PL",
  cs: "cs_CZ",
  hu: "hu_HU",
  ro: "ro_RO",
  el: "el_GR",
  tr: "tr_TR",
  ru: "ru_RU",
  uk: "uk_UA",
  ar: "ar_AR",
  he: "he_IL",
  hi: "hi_IN",
  th: "th_TH",
  vi: "vi_VN",
  id: "id_ID",
  ja: "ja_JP",
  ko: "ko_KR",
  "zh-Hans": "zh_CN",
  "zh-Hant": "zh_TW",
  zh: "zh_CN",
};

export function ogLocaleFor(locale: string): string {
  return ogLocales[locale] ?? "en_US";
}
