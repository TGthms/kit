import type { Metadata } from "next";
import { buildSectionMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildSectionMetadata(locale, "history");
}

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
