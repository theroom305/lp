import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {LeadMicroform} from "@/components/marketplace/lead-microform";
import {JsonLd} from "@/components/seo/json-ld";
import {AmbientStrip} from "@/components/site/ambient-strip";
import {
  featuredBuildings,
  getCorridorBuildingBySlug,
} from "@/content/building-registry";
import type {Locale} from "@/i18n/routing";
import {breadcrumbJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type SearchValue = string | string[] | undefined;

type BuyPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
  searchParams: Promise<Record<string, SearchValue>>;
}>;

function firstSearchValue(value: SearchValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

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

export default async function BuyPage({params, searchParams}: BuyPageProps) {
  const {locale} = await params;
  const t = await getTranslations("buy");
  const query = await searchParams;
  const buildingSlug = firstSearchValue(query.building);
  const buildingName = firstSearchValue(query.buildingName);
  const prefillBuilding = buildingSlug
    ? getCorridorBuildingBySlug(buildingSlug)
    : undefined;
  const prefillBuildingName = prefillBuilding?.name ?? buildingName;
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
          <div className="funnel-mini-list" aria-label={t("miniListLabel")}>
            {featuredBuildings.map((building) => (
              <span key={building.slug}>{building.name}</span>
            ))}
          </div>
          <AmbientStrip placement="buy-intro" variant="side" />
        </section>
        <LeadMicroform
          defaultCustomerState="buying"
          prefillBuildingName={prefillBuildingName}
        />
      </main>
    </PageShell>
  );
}
