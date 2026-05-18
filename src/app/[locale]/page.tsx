import type {Metadata} from "next";
import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {BuildingShowroom} from "@/components/marketplace/building-showroom";
import {JsonLd} from "@/components/seo/json-ld";
import {HeroBitmap} from "@/components/site/hero-bitmap";
import {corridorBuildings} from "@/content/building-registry";
import type {Locale} from "@/i18n/routing";
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  localizedPath,
  pageMetadata,
} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type HomePageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    description:
      "Room 305 helps buyers and sellers of South Florida condos with operator-level building judgment.",
    key: "home",
    locale,
  });
}

const proofKeys = ["building", "operator", "foreign", "founder"] as const;

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
        ])}
      />
      <JsonLd
        data={itemListJsonLd("Room 305 corridor building atlas", corridorBuildings)}
      />
      <HeroBitmap
        eyebrow={t("eyebrow")}
        title={t("title")}
        intro={t("intro")}
        buyHref={localizedPath({key: "buy", locale})}
        buyLabel={t("primaryBuy")}
        sellHref={localizedPath({key: "sell", locale})}
        sellLabel={t("primarySell")}
      />

      <section className="proof-band" aria-labelledby="proof-heading">
        <div>
          <p className="eyebrow">{t("proofEyebrow")}</p>
          <h2 id="proof-heading">{t("proofTitle")}</h2>
        </div>
        <div className="proof-grid">
          {proofKeys.map((key) => (
            <article className="proof-item" key={key}>
              <h3>{t(`proof.${key}.title`)}</h3>
              <p>{t(`proof.${key}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <BuildingShowroom />

      <section className="founder-band" aria-labelledby="founder-heading">
        <div>
          <p className="eyebrow">{t("founderEyebrow")}</p>
          <h2 id="founder-heading">{t("founderTitle")}</h2>
        </div>
        <div className="founder-copy">
          <p>{t("founderBody")}</p>
          <blockquote>{t("founderQuote")}</blockquote>
        </div>
      </section>

      <section className="close-band" aria-labelledby="close-heading">
        <h2 id="close-heading">{t("closeTitle")}</h2>
        <p>{t("closeBody")}</p>
        <div className="hero-actions" aria-label="Choose your path">
          <Link
            className="button-link button-link-primary"
            href={localizedPath({key: "buy", locale})}
          >
            {t("primaryBuy")}
          </Link>
          <Link className="button-link" href={localizedPath({key: "sell", locale})}>
            {t("primarySell")}
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
