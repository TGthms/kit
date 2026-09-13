import { withAsset, basePath } from "@/lib/base-path";
import { locales } from "@/lib/i18n/config";
import { CONTENT_SECURITY_POLICY } from "@/lib/seo/site";

/** Sync boot scripts + CSP. Shared by `/` and every locale document. */
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
      {/* Sync on purpose: theme/lang/locale-gate/viewport must run before first paint.
          Each is versioned so a rebuild replaces the cached copy. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src={withAsset("/boot/theme.js")} />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src={withAsset("/boot/viewport.js")} />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        src={withAsset("/boot/locale-lang.js")}
        data-base-path={basePath}
        data-locales={locales.join(",")}
      />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        src={withAsset("/boot/locale-gate.js")}
        data-base-path={basePath}
        data-locales={locales.join(",")}
      />
    </>
  );
}
