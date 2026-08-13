export const SITE_URL = "https://trykit.pages.dev";
export const SITE_NAME = "Kit";

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${base}${normalized}`;
}
