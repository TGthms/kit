import type { Metadata } from "next";
import { withBasePath, withAsset } from "@/lib/base-path";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content={
            process.env.NODE_ENV === "development"
              ? CONTENT_SECURITY_POLICY.replace(
                  "script-src 'self' 'unsafe-inline'",
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                )
              : CONTENT_SECURITY_POLICY
          }
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,s=localStorage.getItem("theme")||"system",t=s==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):s;if(t==="dark"){d.classList.add("dark");d.style.colorScheme="dark";}else{d.classList.remove("dark");d.style.colorScheme="light";}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
