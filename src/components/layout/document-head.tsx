import { readFileSync } from "node:fs";
import { join } from "node:path";
import { STARTUP_IMAGE_VERSION, STARTUP_SCREENS } from "@/lib/pwa/startup-screens";
import { basePath } from "@/lib/base-path";
import { locales } from "@/lib/i18n/config";
import { CONTENT_SECURITY_POLICY } from "@/lib/seo/site";

// These tiny scripts must run before paint. Inlining eliminates four blocking
// requests on a cold launch and works even before a worker controls the page.
const boot = ["theme", "viewport", "locale-lang", "startup-images"].map((name) =>
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
      <script id="kit-document-boot" data-base-path={basePath} data-locales={locales.join(",")} data-startup-screens={JSON.stringify(STARTUP_SCREENS)} data-startup-version={STARTUP_IMAGE_VERSION} dangerouslySetInnerHTML={{ __html: boot }} />
    </>
  );
}
