import {defineRouting} from "next-intl/routing";

export const locales = ["en", "es"] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/buyers": "/buyers",
    "/owners": "/owners",
    "/about": "/about",
    "/contact": "/contact",
  },
});

export type Locale = (typeof locales)[number];
