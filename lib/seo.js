// SEO helpers: canonical URLs, page metadata and JSON-LD structured data.

import { site } from "@/content/site";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

export function absoluteUrl(path = "/") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Consistent per-page metadata (title template lives in app/layout.js). */
export function pageMetadata({ title, description, path, image, noIndex = false }) {
  const url = absoluteUrl(path);
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: url },
    openGraph: {
      title: title ? `${title} | ${site.name}` : site.name,
      description,
      url,
      siteName: site.name,
      type: "website",
      locale: "en_IN",
      ...(image && {
        images: [{ url: image.src, width: image.width, height: image.height, alt: image.alt }],
      }),
    },
    twitter: { card: "summary_large_image" },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

function toJson(data) {
  // Escape "<" so content can never close the <script> tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** @param {typeof site} siteData resolved settings from lib/data getSite() */
export function organizationJsonLd(siteData = site) {
  const { contact } = siteData;
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.legalName,
    alternateName: site.name,
    description: site.description,
    url: siteUrl,
    foundingDate: siteData.establishedYear ? String(siteData.establishedYear) : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address.line1 ?? undefined,
      addressLocality: contact.address.city,
      addressRegion: contact.address.state,
      addressCountry: "IN",
    },
    telephone: contact.phone ?? undefined,
    email: contact.email ?? undefined,
    areaServed: "IN",
    sameAs: Object.values(siteData.social).filter(Boolean),
  };
  return toJson(data);
}

export function breadcrumbJsonLd(trail) {
  return toJson({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.label,
      item: absoluteUrl(b.href ?? "/"),
    })),
  });
}

export function serviceJsonLd(category) {
  return toJson({
    "@context": "https://schema.org",
    "@type": "Service",
    name: category.name,
    description: category.overview,
    serviceType: category.name,
    url: absoluteUrl(`/solutions/${category.slug}`),
    areaServed: "IN",
    provider: { "@type": "Organization", name: site.legalName, url: siteUrl },
  });
}
