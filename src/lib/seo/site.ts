export const SITE_URL = "https://trykit.pages.dev";
export const SITE_HOST = new URL(SITE_URL).host;
export const SITE_NAME = "Kit";
export const SITE_AUTHOR = "Tim G";
export const SITE_AUTHOR_URL = "https://t-g.pages.dev";
/** Stable `@id` for the WebSite node (sitename + isPartOf). */
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Static-host CSP for the client-only app.
 *
 * Kit-owned boot scripts live in `public/boot/` (theme, lang/dir, locale gate, PWA viewport).
 * pdf.js and FFmpeg WASM are same-origin under `public/vendor/`.
 * FFmpeg’s core is stored gzipped (`ffmpeg-core.wasm.gz`) so the file stays
 * under Cloudflare Pages’ 25 MiB upload limit; the client gunzips it.
 *
 * `script-src` still allows `'unsafe-inline'` because Next.js static export
 * emits inline Flight payloads (`self.__next_f`) and next-themes injects a
 * blocking theme script. Dropping `'unsafe-inline'` would require hashing
 * every page's Flight blob. `'wasm-unsafe-eval'` is required for pdf.js and
 * FFmpeg WebAssembly.
 *
 * Meta-tag CSP cannot enforce `frame-ancestors`. Cloudflare Pages also sends
 * this policy (plus `frame-ancestors 'none'`) from `public/_headers`.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://api.frankfurter.dev blob:",
  "worker-src 'self' blob:",
].join("; ");

/** HTTP-only directives that a `<meta>` CSP cannot express. */
export const CONTENT_SECURITY_POLICY_HEADER = `${CONTENT_SECURITY_POLICY}; frame-ancestors 'none'`;

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
