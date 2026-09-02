type Translate = (key: string, values?: Record<string, string | number>) => string;

/** next-intl throws or echoes the key when a message is missing. */
export function translateOr(
  t: unknown,
  key: string,
  fallback: string,
  values?: Record<string, string | number>
): string {
  try {
    const result = (t as Translate)(key, values);
    if (!result || result === key || result.endsWith(`.${key}`)) return fallback;
    return result;
  } catch {
    return fallback;
  }
}
