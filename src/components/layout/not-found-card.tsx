/**
 * What a page that does not exist has to say, wherever it is shown: what
 * happened, and the one way back that matters.
 *
 * The home page is the tool directory and its search, so a single destination
 * serves both finding a tool and leaving this page. The three elements carry
 * fixed ids because the 404 document is written in the default language and a
 * boot script replaces those three pieces of text with the language the address
 * named; the page rendered inside a language (`app/[locale]/not-found.tsx`) is
 * already in the right language and leaves the ids alone.
 */
export function NotFoundCard({
  title,
  body,
  home,
  href,
}: {
  title: string;
  body: string;
  home: string;
  href: string;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 id="kit-not-found-title" className="type-display text-3xl text-foreground">
        {title}
      </h1>
      <p id="kit-not-found-body" className="type-body mx-auto mt-3 max-w-sm text-muted-foreground">
        {body}
      </p>
      <a
        id="kit-not-found-home"
        href={href}
        className="pressable-soft mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        {home}
      </a>
    </div>
  );
}
