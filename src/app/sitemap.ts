import type {MetadataRoute} from "next";

import {getIndexableBuildings} from "@/content/atlas";
import {absoluteUrl, localizedPath, sitemapAlternates} from "@/lib/seo";

const coreRoutes = [
  "home",
  "buildings",
  "new-developments",
  "owners",
  "about",
  "contact",
  "notes",
  "calibration",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const coreEntries = coreRoutes.map((key) => ({
    url: absoluteUrl(localizedPath({key, locale: "en"})),
    lastModified: now,
    alternates: sitemapAlternates(key),
  }));
  const buildingEntries = getIndexableBuildings().map((building) => ({
    url: absoluteUrl(
      localizedPath({key: "building", locale: "en", slug: building.slug}),
    ),
    lastModified: now,
    alternates: sitemapAlternates("building", building.slug),
  }));

  return [...coreEntries, ...buildingEntries];
}
