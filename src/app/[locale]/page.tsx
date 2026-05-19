import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {BuildingShowroom} from "@/components/marketplace/building-showroom";
import {HomeFunnelHero} from "@/components/marketplace/home-funnel-hero";
import {JsonLd} from "@/components/seo/json-ld";
import {FounderSection} from "@/components/site/founder-section";
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
      "Room 305 helps buyers and sellers choose South Florida condo buildings with corridor-deep context.",
    key: "home",
    locale,
  });
}

const proofKeys = ["item1", "item2", "item3"] as const;
const remoteOwnershipSteps = ["step1", "step2", "step3", "step4"] as const;
const problemFrameRows = ["row1", "row2", "row3"] as const;

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
        data={itemListJsonLd("Room 305 buildings we follow", corridorBuildings)}
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

      <section
        className="problem-frame-band"
        aria-labelledby="problem-frame-heading"
        data-test-id="problem-frame-section"
      >
        <div className="problem-frame-copy">
          <p className="eyebrow">{t("problemFrame.eyebrow")}</p>
          <h2 id="problem-frame-heading">{t("problemFrame.title")}</h2>
          <p>{t("problemFrame.body1")}</p>
          <p>{t("problemFrame.body2")}</p>
        </div>
        <div className="old-new-comparison" data-test-id="old-way-our-way">
          <div className="comparison-column">
            <h3>{t("problemFrame.oldWayTitle")}</h3>
            {problemFrameRows.map((row) => (
              <p key={`${row}-old`}>
                {t(`problemFrame.rows.${row}Old`)}
              </p>
            ))}
          </div>
          <div className="comparison-column comparison-column-primary">
            <h3>{t("problemFrame.ourWayTitle")}</h3>
            {problemFrameRows.map((row) => (
              <p key={`${row}-our`}>
                {t(`problemFrame.rows.${row}Our`)}
              </p>
            ))}
          </div>
        </div>
      </section>

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

      <FounderSection />

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
      <div className="showroom-link-row">
        <a className="text-link" href={localizedPath({key: "buildings", locale})}>
          {t("atlasLink")}
        </a>
      </div>

      <section className="close-band" aria-labelledby="close-heading">
        <h2 id="close-heading">{t("footerCta")}</h2>
      </section>
    </PageShell>
  );
}
