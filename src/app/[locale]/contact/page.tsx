import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {LeadMicroform} from "@/components/marketplace/lead-microform";
import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {breadcrumbJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
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
    description: "Room 305 contact and lead-routing scaffold.",
    key: "contact",
    locale,
  });
}

export default function ContactPage() {
  const t = useTranslations("contact");
  const locale = useLocale() as Locale;

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
        <LeadMicroform />
      </main>
    </PageShell>
  );
}
