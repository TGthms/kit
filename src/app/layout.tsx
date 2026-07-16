import type { Metadata } from "next";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kit",
  description: "Everyday tools in the browser. Private by design.",
  manifest: withBasePath("/manifest.webmanifest"),
  icons: {
    icon: withBasePath("/icons/icon.svg"),
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
