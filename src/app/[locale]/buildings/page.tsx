import type {Metadata} from "next";
import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {BuildingTonalPlate} from "@/components/marketplace/building-tonal-plate";
import {SubmarketFilter} from "@/components/marketplace/submarket-filter";
import {JsonLd} from "@/components/seo/json-ld";
import {corridorBuildings} from "@/content/building-registry";
import type {Locale} from "@/i18n/routing";
import {getSubmarketIdsForBuilding} from "@/lib/submarket-mapping";
import {itemListJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type BuildingsPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: BuildingsPageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    title: "Buildings",
    description:
      "Room 305 index of South Florida condo buildings currently followed.",
    key: "buildings",
    locale,
    indexable: true,
  });
}

export default function BuildingsPage() {
  const t = useTranslations("buildings");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd
        data={itemListJsonLd("Room 305 buildings we follow", corridorBuildings)}
      />
      <main className="route-page atlas-index" aria-labelledby="buildings-heading">
        <header className="buildings-header">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 id="buildings-heading">{t("title")}</h1>
          <p>{t("body")}</p>
        </header>

        <SubmarketFilter />

        <div
          className="atlas-grid"
          data-test-id="buildings-index"
          data-active-submarket="all"
        >
          {corridorBuildings.map((building) => {
            const submarketIds = getSubmarketIdsForBuilding(building).join(" ");
            return (
              <article
                className="atlas-card building-index-card"
                key={building.slug}
                data-submarket-ids={submarketIds}
                data-test-id={`building-card-${building.slug}`}
              >
                <Link
                  className="building-index-primary"
                  href={localizedPath({
                    key: "building",
                    locale,
                    slug: building.slug,
                  })}
                >
                  <BuildingTonalPlate building={building} />
                  <span className="atlas-card-meta">{building.submarket}</span>
                  <h2>{building.name}</h2>
                  <dl className="building-meta-list">
                    <div>
                      <dt>{t("stageLabel")}</dt>
                      <dd>{building.stageLabel}</dd>
                    </div>
                    <div>
                      <dt>{t("cadenceLabel")}</dt>
                      <dd>{building.cadenceLabel}</dd>
                    </div>
                    <div>
                      <dt>{t("sourceLabel")}</dt>
                      <dd>{building.verificationLabel}</dd>
                    </div>
                  </dl>
                </Link>
              </article>
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}
