import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {LeadMicroform} from "@/components/marketplace/lead-microform";
import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {breadcrumbJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type BuyPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: BuyPageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    title: "Buy",
    description:
      "Start a Room 305 buyer call with area, building, timeline, and contact context.",
    key: "buy",
    locale,
  });
}

export default function BuyPage() {
  const t = useTranslations("buy");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
          {name: "Buy", path: localizedPath({key: "buy", locale})},
        ])}
      />
      <main className="funnel-page" aria-labelledby="buy-heading">
        <section className="funnel-intro">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 id="buy-heading">{t("title")}</h1>
          <p>{t("body")}</p>
        </section>
        <LeadMicroform defaultIntent="buying" />
      </main>
    </PageShell>
  );
}
