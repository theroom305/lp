import Link from "next/link";
import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {getIndexableBuildings, v1Buildings} from "@/content/atlas";
import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
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
    title: "Building dossiers",
    description: "Room 305 scaffold for source-gated building dossiers.",
    key: "buildings",
    locale,
  });
}

export default function BuildingsPage() {
  const t = useTranslations("buildings");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd
        data={itemListJsonLd(
          "Room 305 building dossiers",
          getIndexableBuildings(),
        )}
      />
      <main className="route-page atlas-index" aria-labelledby="buildings-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="buildings-heading">{t("title")}</h1>
        <p>{t("body")}</p>

        <div className="atlas-grid" data-test-id="buildings-index">
          {v1Buildings.map((building) => (
            <Link
              className="atlas-card"
              href={localizedPath({
                key: "building",
                locale,
                slug: building.slug,
              })}
              key={building.slug}
              data-test-id={`building-card-${building.slug}`}
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
