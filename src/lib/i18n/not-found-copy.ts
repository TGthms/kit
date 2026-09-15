import { messageFileFor, pathLocales } from "@/lib/i18n/config";

/** The three lines a page that does not exist has to say. */
export type NotFoundCopy = { title: string; body: string; home: string };

/**
 * That page's wording, in every language the site answers in.
 *
 * The export has one 404 document for the whole site, so it cannot know which
 * language was asked for until it is in the browser — that is the first segment
 * of the address, and nothing else. It therefore ships all of them and lets a
 * boot script choose. Keyed by path segment rather than by locale, so the
 * compatibility alias (`zh`) needs no special case at the reading end, and
 * built from the same list the routes are, so a language cannot be added
 * without appearing here.
 */
export async function notFoundCopy(): Promise<Record<string, NotFoundCopy>> {
  const entries = await Promise.all(
    pathLocales.map(async (segment) => {
      const messages = (await import(`../../../messages/${messageFileFor(segment)}.json`))
        .default as { notFound: NotFoundCopy };
      const { title, body, home } = messages.notFound;
      return [segment, { title, body, home }] as const;
    }),
  );
  return Object.fromEntries(entries);
}
