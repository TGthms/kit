/** Next static export keeps RSC payloads at `…/index.txt`. Those must never be the document URL. */
export function isRscDocumentPath(pathname: string): boolean {
  return /\.txt$/iu.test(pathname);
}

export function htmlPathname(pathname: string): string {
  let path = pathname.replace(/\/index\.txt$/iu, "/").replace(/\.txt$/iu, "");
  if (!path.startsWith("/")) path = `/${path}`;
  if (!path.endsWith("/")) path += "/";
  return path;
}

export function htmlHref(href: string, base = "https://kit.invalid"): string {
  try {
    const url = new URL(href, base);
    url.pathname = htmlPathname(url.pathname);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

/** Keep `location.search` / `location.hash` when replacing onto another path. */
export function withSearchAndHash(
  path: string,
  search?: string | null,
  hash?: string | null,
): string {
  return `${path}${search ?? ""}${hash ?? ""}`;
}
