/** Build-time base path for GitHub project pages (e.g. "/kit"). Empty when running locally. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Bump when public brand assets change, so browsers and the service worker drop
 * stale copies. `vendor.test.ts` fails if the vendored engine versions below
 * drift from package.json, so an engine upgrade always reaches the URL.
 */
export const ASSET_VERSION = "6";

/* Versions of the engines vendored under /vendor/, mirroring package.json. */
const PDFJS_VERSION = "6.3.289";
const FFMPEG_CORE_VERSION = "0.12.10";

/** Version tag for vendored engine files. */
export const VENDOR_VERSION = `pdfjs-${PDFJS_VERSION}-ffmpeg-${FFMPEG_CORE_VERSION}`;

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

function withCacheBust(path: string, version: string): string {
  const url = withBasePath(path);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${version}`;
}

/** Base path + cache-bust query for icons, boot scripts and similar public files. */
export function withAsset(path: string): string {
  return withCacheBust(path, ASSET_VERSION);
}

/**
 * Base path + engine version, for vendored engine files that are addressed by
 * their full URL. Not for the pdf.js asset directories (cmaps, standard fonts,
 * wasm, iccs): pdf.js appends file names to those itself, so their URLs must
 * end in "/" and cannot carry a query.
 */
export function withVendor(path: string): string {
  return withCacheBust(path, VENDOR_VERSION);
}
