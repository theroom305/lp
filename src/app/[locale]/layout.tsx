import type {Metadata} from "next";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";
import {notFound} from "next/navigation";

import "../globals.css";
import {routing, type Locale} from "@/i18n/routing";
import {organizationJsonLd} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL("https://theroom305.com"),
  title: {
    default: "Room 305",
    template: "%s | Room 305",
  },
  description:
    "A private Room 305 marketplace scaffold for South Florida building intelligence, buyer qualification, and founder-led follow-up.",
};

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages({locale});

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale as Locale} messages={messages}>
          {children}
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationJsonLd),
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
