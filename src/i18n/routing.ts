import {defineRouting} from "next-intl/routing";

export const locales = ["en", "es"] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof locales)[number];
