export function revokeObjectUrl(url: string | undefined | null): void {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function revokeObjectUrls(urls: Iterable<string | undefined | null>): void {
  for (const url of urls) revokeObjectUrl(url);
}

/** Revoke every URL in `current`, then return `next`. */
export function replaceObjectUrlRecord(
  current: Record<string | number, string>,
  next: Record<string | number, string>
): Record<string | number, string> {
  revokeObjectUrls(Object.values(current));
  return next;
}
