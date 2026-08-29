import { ogImageUrl, SITE_AUTHOR, SITE_AUTHOR_URL, SITE_NAME, SITE_URL } from "./site";

export function SiteJsonLd({
  name,
  description,
  locale,
}: {
  name: string;
  description: string;
  locale: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: name || SITE_NAME,
    alternateName: SITE_NAME,
    url: SITE_URL,
    description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    inLanguage: locale,
    image: ogImageUrl(),
    author: {
      "@type": "Person",
      name: SITE_AUTHOR,
      url: SITE_AUTHOR_URL,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so a value containing "</script>" (or any other tag)
      // can never break out of this script element. All current inputs are
      // trusted, repo-controlled i18n strings, but this keeps the pattern
      // safe by construction rather than by convention.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
