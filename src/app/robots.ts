import type {MetadataRoute} from "next";

import {siteUrl} from "@/lib/seo";

const hiddenFunnelRoutes = [
  "/about",
  "/about/",
  "/buyers",
  "/buyers/",
  "/buildings",
  "/buildings/",
  "/calibration",
  "/calibration/",
  "/new-developments",
  "/new-developments/",
  "/notes",
  "/notes/",
  "/owners",
  "/owners/",
  "/es/edificios",
  "/es/edificios/",
  "/es/desarrollos-nuevos",
  "/es/desarrollos-nuevos/",
  "/es/notas",
  "/es/notas/",
  "/es/calibracion",
  "/es/calibracion/",
  "/es/propietarios",
  "/es/propietarios/",
  "/es/metodo",
  "/es/metodo/",
];

const privateRoutes = [
  "/admin",
  "/api/auth",
  "/api/events",
  "/api/lead",
  "/internal",
  "/private",
  ...hiddenFunnelRoutes,
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
        ],
        allow: "/",
        disallow: privateRoutes,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
