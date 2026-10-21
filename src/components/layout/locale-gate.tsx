import { readFileSync } from "node:fs";
import { join } from "node:path";
import { localeNames, locales } from "@/lib/i18n/config";
import { basePath, withBasePath } from "@/lib/base-path";
import { SITE_NAME } from "@/lib/seo/site";

const TAGLINE = "Everyday tools in your browser. Private by design.";

// The installed entry can paint and choose a language without loading React,
// the app stylesheet, or Cache Storage. Postbuild keeps this root document
// standalone and embeds the exact same bytes into the worker.
const ENTRY_BOOT = readFileSync(join(process.cwd(), "public/boot/locale-gate.js"), "utf8");
const ENTRY_STYLE = `
html,body{margin:0;background:#f5f5f7;color:#171717;font-family:system-ui,-apple-system,sans-serif}
html.dark,html.dark body{background:#000;color:#f5f5f7}
.kit-entry{box-sizing:border-box;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:32px 24px;text-align:center}
.kit-entry h1{margin:0 0 8px;font-size:30px;letter-spacing:-.04em}
.kit-entry p{max-width:28rem;margin:8px auto;font-size:14px;line-height:1.5;opacity:.65}
.kit-entry .kit-spinner{box-sizing:border-box;width:28px;height:28px;border:3px solid #007aff33;border-top-color:#007aff;border-radius:50%;animation:kit-entry-spin .8s linear infinite}
.kit-entry .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.kit-entry ul{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 12px;padding:0;list-style:none}
.kit-entry a{color:inherit}
@keyframes kit-entry-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.kit-entry .kit-spinner{animation:none}}
`;

/**
 * First-visit language pick for the static `/` entry.
 *
 * The count line is the only description of the site on this address, and it is
 * what a reader that does not run the redirect has: a person with scripting off,
 * or anything fetching the document to see what Kit is. It is why the numbers
 * are handed in from the registry rather than written here — a page that says
 * "94 tools" after someone adds the ninety-fifth is worse than saying nothing.
 */
export function LocaleGate({
  tools,
  sections,
  languages,
}: {
  tools: number;
  sections: number;
  languages: number;
}) {
  return (
    <>
    <style id="kit-entry-style">{ENTRY_STYLE}</style>
    <div className="kit-entry flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <span className="kit-spinner" aria-hidden />
      <p className="sr-only" role="status">Loading</p>
      <noscript>
        <style>{".kit-entry>.kit-spinner,.kit-entry>[role=status]{display:none}"}</style>
        <div className="space-y-2">
          <h1 className="type-display text-3xl text-foreground">{SITE_NAME}</h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{TAGLINE}</p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {tools} tools across {sections} sections, each at its own address in {languages} languages. Everything runs
            in your browser; nothing is uploaded.
          </p>
        </div>
        <nav aria-label="Languages" className="mt-4 max-w-md text-sm text-muted-foreground">
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {locales.map((locale) => (
              <li key={locale}>
                <a href={withBasePath(`/${locale}/`)} className="underline-offset-2 hover:underline">
                  {localeNames[locale]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </noscript>
    </div>
    <script id="kit-locale-entry" data-base-path={basePath} data-locales={locales.join(",")} dangerouslySetInnerHTML={{ __html: ENTRY_BOOT }} />
    </>
  );
}
