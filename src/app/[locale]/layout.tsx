import type {Metadata} from "next";
import {Source_Serif_4} from "next/font/google";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";
import {notFound} from "next/navigation";
import Script from "next/script";

import "../globals.css";
import {routing, type Locale} from "@/i18n/routing";
import {organizationJsonLd} from "@/lib/seo";
import {env} from "@/server/env";

type IntlMessages = Awaited<ReturnType<typeof getMessages>>;
type MessageTree = Record<string, unknown>;

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-source-serif-pro",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://theroom305.com"),
  title: {
    default: "Room 305",
    template: "%s | Room 305",
  },
  description:
    "A Room 305 scaffold for South Florida building context, buyer qualification, and founder-led follow-up.",
};

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

function stripServerOnlyMessages(messages: IntlMessages): IntlMessages {
  const home = messages.home;
  const beachwalk = messages.beachwalk;
  const nextMessages: MessageTree = {...messages};

  if (!home || typeof home !== "object" || Array.isArray(home)) {
    return nextMessages as IntlMessages;
  }

  const clientHome: MessageTree = {...home};
  delete clientHome.founder;
  nextMessages.home = clientHome;

  if (beachwalk && typeof beachwalk === "object" && !Array.isArray(beachwalk)) {
    const clientBeachwalk: MessageTree = {...beachwalk};
    delete clientBeachwalk.memo;
    nextMessages.beachwalk = clientBeachwalk;
  }

  return nextMessages as IntlMessages;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages({locale});
  const clientMessages = stripServerOnlyMessages(messages);

  return (
    <html lang={locale}>
      <body className={sourceSerif.variable}>
        <NextIntlClientProvider locale={locale as Locale} messages={clientMessages}>
          {env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
            <Script
              defer
              data-domain={env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
              src="https://plausible.io/js/script.js"
              strategy="afterInteractive"
            />
          ) : null}
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
