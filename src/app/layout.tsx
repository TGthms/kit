import type { Metadata } from "next";
import { withBasePath, withAsset } from "@/lib/base-path";
import { socialImages } from "@/lib/seo/metadata";
import { ogImageUrl, SITE_AUTHOR, SITE_AUTHOR_URL, SITE_NAME, SITE_URL } from "@/lib/seo/site";
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
  return children;
}
