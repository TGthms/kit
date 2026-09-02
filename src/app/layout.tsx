import type { Metadata, Viewport } from "next";
import { withBasePath, withAsset, basePath } from "@/lib/base-path";
import { locales } from "@/lib/i18n/config";
import { socialImages } from "@/lib/seo/metadata";
import {
  CONTENT_SECURITY_POLICY,
  ogImageUrl,
  SITE_AUTHOR,
  SITE_AUTHOR_URL,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/site";
import "./globals.css";

const defaultTitle = "Kit — Browser tools that stay private";
const defaultDescription =
  "PDF, images, media, converters, and text tools that run on your device. Nothing is uploaded to our servers.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: defaultTitle,
  description: defaultDescription,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: SITE_AUTHOR_URL }],
  creator: SITE_AUTHOR,
  keywords: [
    "PDF tools",
    "image converter",
    "browser utilities",
    "private file tools",
    "client-side",
    "Kit",
  ],
  manifest: withBasePath("/manifest.webmanifest"),
  verification: {
    google: "0rE0QD0vWPSfPxelCpS8qL2_n3JGrd_ZYPJBaGwnLZQ",
  },
  icons: {
    icon: [
      { url: withAsset("/favicon.ico"), sizes: "32x32", type: "image/x-icon" },
      { url: withAsset("/icons/favicon.svg"), type: "image/svg+xml" },
      { url: withAsset("/icons/favicon-32.png"), sizes: "32x32", type: "image/png" },
      { url: withAsset("/icons/icon.svg"), type: "image/svg+xml" },
    ],
    apple: [{ url: withAsset("/icons/apple-touch-icon.png"), sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: defaultTitle,
    description: defaultDescription,
    url: SITE_URL,
    images: socialImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImageUrl()],
  },
};

// The manifest's `theme_color` can't vary at all, so it holds a static
// light-mode fallback (see public/manifest.webmanifest). This `viewport`
// export renders the real <meta name="theme-color"> tag, which browsers
// prefer over the manifest value. It starts at the light-mode default;
// the inline script below corrects it before first paint if the resolved
// theme is dark, and <ThemeColorSync> (in providers.tsx) keeps it in sync
// afterwards. A plain light/dark media-query pair isn't enough here
// because the theme can be manually overridden independent of the OS
// preference (see ThemeToggle/next-themes). Both values match
// `--background` in globals.css so the PWA title/status bar always
// mirrors the app's own chrome instead of a mismatched accent color.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: "#f5f5f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content={
            process.env.NODE_ENV === "development"
              ? CONTENT_SECURITY_POLICY.replace(
                  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'"
                )
              : CONTENT_SECURITY_POLICY
          }
        />
        {/* Sync on purpose: theme/lang/locale-gate/viewport must run before first paint. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src={withBasePath("/boot/theme.js")} />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src={withBasePath("/boot/viewport.js")} />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src={withBasePath("/boot/locale-lang.js")}
          data-base-path={basePath}
          data-locales={locales.join(",")}
        />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src={withBasePath("/boot/locale-gate.js")}
          data-base-path={basePath}
          data-locales={locales.join(",")}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
