import {
  ogImageUrl,
  PERSON_ID,
  APP_ID,
  SITE_AUTHOR,
  SITE_AUTHOR_URL,
  SITE_GITHUB,
  SITE_GITHUB_PROFILE,
  SITE_HOST,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
} from "./site";

export function serializeJsonLd(data: unknown): string {
  // Escape "<" so a value containing "</script>" (or any other tag)
  // can never break out of this script element. All current inputs are
  // trusted, repo-controlled i18n strings, but this keeps the pattern
  // safe by construction rather than by convention.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

function graph(nodes: Record<string, unknown>[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: [SITE_HOST],
    url: `${SITE_URL}/`,
    publisher: { "@id": PERSON_ID },
    sameAs: [SITE_GITHUB],
  };
}

/** Google sitename: must live on the subdomain root (`/`), not only `/en/`. */
export function websiteJsonLd() {
  return { "@context": "https://schema.org", ...websiteNode() };
}

export function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_AUTHOR,
    url: SITE_AUTHOR_URL,
    sameAs: [SITE_GITHUB_PROFILE, SITE_AUTHOR_URL],
  };
}

export function webApplicationNode({
  description,
  locale,
  url,
}: {
  description: string;
  locale: string;
  url: string;
}) {
  return {
    "@type": "WebApplication",
    "@id": APP_ID,
    name: SITE_NAME,
    url,
    description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    inLanguage: locale,
    image: ogImageUrl(),
    author: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function homeJsonLd({
  description,
  locale,
  url,
}: {
  description: string;
  locale: string;
  url: string;
}) {
  return graph([websiteNode(), personNode(), webApplicationNode({ description, locale, url })]);
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function webPageJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@type": "WebPage",
    name,
    description,
    url,
    isPartOf: { "@id": WEBSITE_ID },
  };
}

export function toolJsonLd({
  name,
  description,
  url,
  breadcrumbs,
}: {
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
}) {
  return graph([webPageJsonLd({ name, description, url }), breadcrumbJsonLd(breadcrumbs)]);
}

export function legalJsonLd({
  name,
  description,
  url,
  breadcrumbs,
}: {
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
}) {
  return graph([webPageJsonLd({ name, description, url }), breadcrumbJsonLd(breadcrumbs)]);
}

export function WebSiteJsonLd() {
  return <JsonLd data={websiteJsonLd()} />;
}

export function HomeJsonLd(props: { description: string; locale: string; url: string }) {
  return <JsonLd data={homeJsonLd(props)} />;
}

export function ToolJsonLd(props: {
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
}) {
  return <JsonLd data={toolJsonLd(props)} />;
}

export function LegalJsonLd(props: {
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
}) {
  return <JsonLd data={legalJsonLd(props)} />;
}
