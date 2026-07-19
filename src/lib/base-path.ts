/** Build-time base path for GitHub project pages (e.g. "/kit"). Empty for local. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Bump when public brand assets change so browsers/SW drop stale copies. */
export const ASSET_VERSION = "3";

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

/** Base path + cache-bust query for icons and similar public files. */
export function withAsset(path: string): string {
  const url = withBasePath(path);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${ASSET_VERSION}`;
}
