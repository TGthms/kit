import type { Metadata } from "next";
import { buildSectionMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildSectionMetadata(locale, "favorites");
}

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
