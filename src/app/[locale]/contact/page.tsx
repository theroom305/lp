import type {Metadata} from "next";
import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {breadcrumbJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {env} from "@/server/env";
import {PageShell} from "@/components/site/page-shell";

type ContactPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    title: "Contact",
    description: "Contact Room 305 by email, WhatsApp, calendar, or the buyer and seller paths.",
    key: "contact",
    locale,
  });
}

export default function ContactPage() {
  const t = useTranslations("contact");
  const locale = useLocale() as Locale;
  const emailHref = `mailto:${env.NEXT_PUBLIC_CONTACT_EMAIL}`;

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
          {name: "Contact", path: localizedPath({key: "contact", locale})},
        ])}
      />
      <main className="route-page" aria-labelledby="contact-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="contact-heading">{t("title")}</h1>
        <p>{t("body")}</p>
        <div className="contact-methods" data-test-id="contact-methods">
          <a href={emailHref}>
            <span>{t("emailLabel")}</span>
            <strong>{env.NEXT_PUBLIC_CONTACT_EMAIL}</strong>
          </a>
          <a href={env.NEXT_PUBLIC_WHATSAPP_URL}>
            <span>{t("whatsappLabel")}</span>
            <strong>WhatsApp</strong>
          </a>
          <a href={env.NEXT_PUBLIC_CALENDAR_URL}>
            <span>{t("calendarLabel")}</span>
            <strong>Calendar</strong>
          </a>
        </div>
        <div className="hero-actions">
          <Link className="button-link button-link-primary" href={localizedPath({key: "buy", locale})}>
            {t("buyCta")}
          </Link>
          <Link className="button-link" href={localizedPath({key: "sell", locale})}>
            {t("sellCta")}
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
