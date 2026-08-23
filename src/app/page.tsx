import { LocaleGate } from "@/components/layout/locale-gate";

/**
 * Static `/` entry: pick a locale from stored preference or the browser
 * language, then replace to `/{locale}/`.
 *
 * The root layout intentionally does not render `<html>`/`<body>` (the
 * `[locale]` layout owns those so it can set the correct `lang`/`dir` per
 * locale). This route sits outside `[locale]`, so it must provide its own
 * document shell — otherwise the exported page has no `<head>` at all,
 * which breaks things like Google Search Console's HTML-tag verification.
 */
export default function RootPage() {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,s=localStorage.getItem("theme")||"system",t=s==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):s;if(t==="dark"){d.classList.add("dark");d.style.colorScheme="dark";}else{d.classList.remove("dark");d.style.colorScheme="light";}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <LocaleGate />
      </body>
    </html>
  );
}
