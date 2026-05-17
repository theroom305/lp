import Link from "next/link";
import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {getNewDevelopmentBuildings, isBuildingIndexable} from "@/content/atlas";
import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {itemListJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type NewDevelopmentsPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: NewDevelopmentsPageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    title: "New developments",
    description: "Room 305 scaffold for source-gated new-development pages.",
    key: "new-developments",
    locale,
  });
}

export default function NewDevelopmentsPage() {
  const t = useTranslations("newDevelopments");
  const locale = useLocale() as Locale;
  const buildings = getNewDevelopmentBuildings();

  return (
    <PageShell>
      <JsonLd
        data={itemListJsonLd(
          "Room 305 new developments",
          buildings.filter(isBuildingIndexable),
        )}
      />
      <main
        className="route-page atlas-index"
        aria-labelledby="new-developments-heading"
      >
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="new-developments-heading">{t("title")}</h1>
        <p>{t("body")}</p>

        <div className="atlas-grid" data-test-id="new-developments-index">
          {buildings.map((building) => (
            <Link
              className="atlas-card"
              href={localizedPath({
                key: "building",
                locale,
                slug: building.slug,
              })}
              key={building.slug}
              data-test-id={`new-development-card-${building.slug}`}
            >
              <span className="atlas-card-meta">{building.city}</span>
              <h2>{building.name}</h2>
              <p>{building.stage.replaceAll("_", " ")}</p>
            </Link>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
