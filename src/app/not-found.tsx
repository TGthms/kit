import { DocumentHead } from "@/components/layout/document-head";
import { NotFoundCard } from "@/components/layout/not-found-card";
import { basePath, withAsset, withBasePath } from "@/lib/base-path";
import { defaultLocale, localeDir, localeHtmlLang } from "@/lib/i18n/config";
import { notFoundCopy } from "@/lib/i18n/not-found-copy";
import { SITE_NAME } from "@/lib/seo/site";

/*
 * The document a host serves for an address that does not exist.
 *
 * Two things about it are unlike every other page. It renders its own <html>
 * and <body>, because the root layout is a pass-through and each route is given
 * those by the layout of its language — and a missing address has no language.
 * And it carries the wording for all of them, because one static file answers
 * for the whole site: which language was asked for is only knowable in the
 * browser, from the first segment of the address. The default language is what
 * is rendered, so the page stands on its own with no scripting at all, and
 * `public/boot/not-found.js` replaces it when the address names another.
 *
 * Nothing here is interactive and nothing is fetched. A visitor arrives because
 * something is already wrong — a mistyped address, a link that moved, a stale
 * bookmark — so the page is deliberately outside the app shell: no navigation
 * to fail, no client bundle to run, just the one way back.
 */
export default async function NotFound() {
  const copy = await notFoundCopy();
  const { title, body, home } = copy[defaultLocale];

  return (
    <html
      lang={localeHtmlLang(defaultLocale)}
      dir={localeDir(defaultLocale)}
      suppressHydrationWarning
    >
      <head>
        <DocumentHead />
      </head>
      <body>
        <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
          {/* The same mark the site opens with, so the page reads as Kit
              before a word of it is read. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withAsset("/icons/icon.svg")}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-[14px] shadow-sm"
            draggable={false}
          />
          <p className="mt-6 mb-2 text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            404
          </p>
          <NotFoundCard
            title={title}
            body={body}
            home={home}
            href={withBasePath(`/${defaultLocale}/`)}
          />
        </div>

        {/* The wording for every language, read by the boot script below. It is
            data rather than markup so the page keeps one copy of each line; `<`
            is escaped so no translation can close the element early. */}
        <script
          type="application/json"
          id="kit-not-found-copy"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(copy).replace(/</gu, "\\u003c") }}
        />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src={withAsset("/boot/not-found.js")}
          data-base-path={basePath}
          data-site-name={SITE_NAME}
        />
      </body>
    </html>
  );
}
