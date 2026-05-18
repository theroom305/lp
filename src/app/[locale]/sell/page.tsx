import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {LeadMicroform} from "@/components/marketplace/lead-microform";
import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {breadcrumbJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type SellPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: SellPageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    title: "Sell",
    description:
      "Start a Room 305 seller call with building, unit, timeline, and contact context.",
    key: "sell",
    locale,
  });
}

export default function SellPage() {
  const t = useTranslations("sell");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
          {name: "Sell", path: localizedPath({key: "sell", locale})},
        ])}
      />
      <main className="funnel-page" aria-labelledby="sell-heading">
        <section className="funnel-intro">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 id="sell-heading">{t("title")}</h1>
          <p>{t("body")}</p>
        </section>
        <LeadMicroform defaultIntent="selling" />
      </main>
    </PageShell>
  );
}
