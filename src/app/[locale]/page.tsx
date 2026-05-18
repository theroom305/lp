import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {BuildingShowroom} from "@/components/marketplace/building-showroom";
import {HomeFunnelHero} from "@/components/marketplace/home-funnel-hero";
import {JsonLd} from "@/components/seo/json-ld";
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

const proofKeys = ["item1", "item2", "item3"] as const;
const remoteOwnershipSteps = ["step1", "step2", "step3", "step4"] as const;

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
      <HomeFunnelHero
        locale={locale}
        title={t("hero")}
        subcopy={t("subcopy")}
        buyingLabel={t("paths.buying")}
        ownLabel={t("paths.own")}
        sellingLabel={t("paths.selling")}
        buildingPlaceholder={t("buildingInputPlaceholder")}
        trustLine={t("trustLine")}
        atlasHref={localizedPath({key: "buildings", locale})}
        atlasLabel={t("atlasLink")}
        buyHref={localizedPath({key: "buy", locale})}
        ownHref={localizedPath({key: "own", locale})}
        sellHref={localizedPath({key: "sell", locale})}
      />

      <section className="proof-band" aria-labelledby="proof-heading">
        <div>
          <p className="eyebrow">{t("proofEyebrow")}</p>
          <h2 id="proof-heading">{t("proofTitle")}</h2>
        </div>
        <div className="proof-grid">
          {proofKeys.map((key) => (
            <article className="proof-item" key={key}>
              <p>{t(`proof.${key}`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="founder-band" aria-labelledby="remote-heading">
        <div>
          <p className="eyebrow">{t("remoteEyebrow")}</p>
          <h2 id="remote-heading">{t("remoteOwnership.heading")}</h2>
        </div>
        <ol className="remote-ownership-list">
          {remoteOwnershipSteps.map((step) => (
            <li key={step}>{t(`remoteOwnership.${step}`)}</li>
          ))}
        </ol>
      </section>

      <BuildingShowroom />

      <section className="close-band" aria-labelledby="close-heading">
        <h2 id="close-heading">{t("footerCta")}</h2>
      </section>
    </PageShell>
  );
}
