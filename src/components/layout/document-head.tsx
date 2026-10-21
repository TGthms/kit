import { readFileSync } from "node:fs";
import { join } from "node:path";
import { STARTUP_SCREENS } from "@/lib/pwa/startup-screens";
import { withBasePath, basePath } from "@/lib/base-path";
import { locales } from "@/lib/i18n/config";
import { CONTENT_SECURITY_POLICY } from "@/lib/seo/site";

// These tiny scripts must run before paint. Inlining eliminates four blocking
// requests on a cold launch and works even before a worker controls the page.
const boot = ["theme", "viewport", "locale-lang"].map((name) =>
  readFileSync(join(process.cwd(), "public/boot", `${name}.js`), "utf8"),
).join("\n");

/** Critical first-paint setup, shared by every document. */
export function DocumentHead() {
  const csp =
    process.env.NODE_ENV === "development"
      ? CONTENT_SECURITY_POLICY.replace(
          "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
        )
      : CONTENT_SECURITY_POLICY;

  return (
    <>
      <meta httpEquiv="Content-Security-Policy" content={csp} />
      <script id="kit-document-boot" data-base-path={basePath} data-locales={locales.join(",")} dangerouslySetInnerHTML={{ __html: boot }} />
      {STARTUP_SCREENS.flatMap(({ width, height, scale }) => ["portrait", "landscape"].flatMap((orientation) => ["light", "dark"].map((appearance) => (
        <link key={`${width}-${height}-${scale}-${orientation}-${appearance}`} rel="apple-touch-startup-image"
          media={`screen and (device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${scale}) and (orientation: ${orientation}) and (prefers-color-scheme: ${appearance})`}
          href={withBasePath(`/startup/${width}-${height}-${scale}-${orientation}-${appearance}.png`)} />
      ))))}
    </>
  );
}
