import {defineRouting} from "next-intl/routing";

export const locales = ["en", "es"] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/buildings": {
      en: "/buildings",
      es: "/edificios",
    },
    "/buildings/[slug]": {
      en: "/buildings/[slug]",
      es: "/edificios/[slug]",
    },
    "/new-developments": {
      en: "/new-developments",
      es: "/desarrollos-nuevos",
    },
    "/owners": "/owners",
    "/notes": {
      en: "/notes",
      es: "/notas",
    },
    "/about": "/about",
    "/contact": "/contact",
    "/calibration": {
      en: "/calibration",
      es: "/calibracion",
    },
    "/buyers": "/buyers",
  },
});

export type Locale = (typeof locales)[number];
