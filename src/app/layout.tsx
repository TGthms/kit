import type { Metadata } from "next";
import { withBasePath, withAsset } from "@/lib/base-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kit",
  description: "Everyday tools in the browser. Private by design.",
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
    title: "Kit",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
