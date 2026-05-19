import type {Metadata} from "next";

import type {BuildingRecord} from "@/content/atlas";
import {isBuildingIndexable} from "@/content/atlas";
import type {Locale} from "@/i18n/routing";
import type {BuildingSourcePacket} from "@/content/source-packets/types";

export const siteUrl = "https://theroom305.com";

type RouteKey =
  | "home"
  | "buy"
  | "own"
  | "sell"
  | "buildings"
  | "building"
  | "new-developments"
  | "owners"
  | "about"
  | "contact"
  | "notes"
  | "calibration";

type RouteInput = Readonly<{
  key: RouteKey;
  locale: Locale;
  slug?: string;
}>;

type BreadcrumbItem = Readonly<{
  name: string;
  path: string;
}>;

type BuildingListItem = Readonly<{
  slug: string;
  name: string;
}>;

const localizedStaticPaths: Record<
  Exclude<RouteKey, "building">,
  Record<Locale, string>
> = {
  home: {
    en: "/",
    es: "/es",
  },
  buy: {
    en: "/buy",
    es: "/es/comprar",
  },
  own: {
    en: "/own",
    es: "/es/ya-tengo-propiedad",
  },
  sell: {
    en: "/sell",
    es: "/es/vender",
  },
  buildings: {
    en: "/buildings",
    es: "/es/edificios",
  },
  "new-developments": {
    en: "/new-developments",
    es: "/es/desarrollos-nuevos",
  },
  owners: {
    en: "/owners",
    es: "/es/propietarios",
  },
  about: {
    en: "/about",
    es: "/es/metodo",
  },
  contact: {
    en: "/contact",
    es: "/es/contacto",
  },
  notes: {
    en: "/notes",
    es: "/es/notas",
  },
  calibration: {
    en: "/calibration",
    es: "/es/calibracion",
  },
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Room 305",
  url: siteUrl,
};

export const founderPersonJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Room 305 founder",
  worksFor: {
    "@type": "Organization",
    name: "Room 305",
    url: siteUrl,
  },
};

export function localizedPath(input: RouteInput): string {
  if (input.key === "building") {
    if (!input.slug) {
      throw new Error("Building routes require slug.");
    }

    return input.locale === "es"
      ? `/es/edificios/${input.slug}`
      : `/buildings/${input.slug}`;
  }

  return localizedStaticPaths[input.key][input.locale];
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}

export function routeAlternates(
  key: RouteKey,
  slug?: string,
): NonNullable<Metadata["alternates"]> {
  const enPath = localizedPath({key, locale: "en", slug});
  const esPath = localizedPath({key, locale: "es", slug});

  return {
    canonical: absoluteUrl(enPath),
    languages: {
      en: absoluteUrl(enPath),
      es: absoluteUrl(esPath),
      "x-default": absoluteUrl(enPath),
    },
  };
}

export function sitemapAlternates(key: RouteKey, slug?: string) {
  const enPath = localizedPath({key, locale: "en", slug});
  const esPath = localizedPath({key, locale: "es", slug});

  return {
    languages: {
      en: absoluteUrl(enPath),
      es: absoluteUrl(esPath),
      "x-default": absoluteUrl(enPath),
    },
  };
}

export function robotsForLocaleAndIndexability(
  locale: Locale,
  indexable = true,
): Metadata["robots"] {
  const index = locale === "en" && indexable;

  return {
    index,
    follow: true,
    googleBot: {
      index,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export function pageMetadata(input: {
  title?: string;
  description: string;
  key: RouteKey;
  locale: Locale;
  slug?: string;
  indexable?: boolean;
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: routeAlternates(input.key, input.slug),
    robots: robotsForLocaleAndIndexability(input.locale, input.indexable ?? true),
  };
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildingJsonLd(building: BuildingRecord) {
  return {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: building.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: building.city,
      addressRegion: "FL",
      addressCountry: "US",
    },
    url: absoluteUrl(
      localizedPath({key: "building", locale: "en", slug: building.slug}),
    ),
    isAccessibleForFree: true,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "What we've verified",
        value: building.verificationState,
      },
      {
        "@type": "PropertyValue",
        name: "Public indexable",
        value: isBuildingIndexable(building) ? "yes" : "no",
      },
    ],
  };
}

export function itemListJsonLd(
  name: string,
  buildings: readonly BuildingListItem[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: buildings.map((building, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(
        localizedPath({
          key: "building",
          locale: "en",
          slug: building.slug,
        }),
      ),
      name: building.name,
    })),
  };
}

export function notesArticleJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Room 305 working notes",
    inLanguage: locale,
    publisher: organizationJsonLd,
    mainEntityOfPage: absoluteUrl(localizedPath({key: "notes", locale})),
  };
}

export function proofDossierArticleJsonLd({
  locale,
  slug,
  name,
  packet,
}: Readonly<{
  locale: Locale;
  slug: string;
  name: string;
  packet: BuildingSourcePacket;
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${name} Building Fit Review`,
    inLanguage: locale,
    mainEntityOfPage: absoluteUrl(localizedPath({key: "building", locale, slug})),
    dateModified: packet.lastReviewedAt,
    publisher: organizationJsonLd,
  };
}
