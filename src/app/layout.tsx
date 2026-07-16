import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kit",
  description: "Everyday tools in the browser. Private by design.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kit",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
