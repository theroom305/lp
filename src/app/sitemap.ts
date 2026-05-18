import type {MetadataRoute} from "next";

import {absoluteUrl, localizedPath} from "@/lib/seo";

const publicRoutes = ["home", "buy", "sell", "contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return publicRoutes.map((key) => ({
    url: absoluteUrl(localizedPath({key, locale: "en"})),
    lastModified: now,
  }));
}
