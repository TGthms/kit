/** Stable session key for a URL, ignoring trailing slashes and hash. */
export function scrollKeyFromUrl(href: string, base = "https://kit.invalid"): string {
  try {
    const url = new URL(href, base);
    const path = url.pathname.replace(/\/+$/u, "") || "/";
    return `${path}${url.search}`;
  } catch {
    return href;
  }
}

export function scrollKeyFromLocation(location: Pick<Location, "pathname" | "search">): string {
  const path = location.pathname.replace(/\/+$/u, "") || "/";
  return `${path}${location.search}`;
}
