import Link from "next/link";
import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {
  getIndexableBuildings,
  getPendingVerificationBuildings,
} from "@/content/atlas";
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
    indexable: false,
  });
}

export default function BuildingsPage() {
  const t = useTranslations("buildings");
  const locale = useLocale() as Locale;
  const citableBuildings = getIndexableBuildings();
  const pendingBuildings = getPendingVerificationBuildings();

  return (
    <PageShell>
      <JsonLd
        data={itemListJsonLd("Room 305 building dossiers", citableBuildings)}
      />
      <main className="route-page atlas-index" aria-labelledby="buildings-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="buildings-heading">{t("title")}</h1>
        <p>{t("body")}</p>

        <div className="atlas-grid" data-test-id="buildings-index">
          {citableBuildings.map((building) => (
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

        <section className="atlas-subsection" aria-labelledby="verifying-buildings-heading">
          <p className="eyebrow">Verification queue</p>
          <h2 id="verifying-buildings-heading">Source review in progress</h2>
          <div className="atlas-grid" data-test-id="buildings-verifying-index">
            {pendingBuildings.map((building) => (
              <div
                className="atlas-card atlas-card-static"
                key={building.slug}
                data-test-id={`building-card-verifying-${building.slug}`}
              >
                <span className="atlas-card-meta">{building.city}</span>
                <h3>{building.name}</h3>
                <p>{building.stage.replaceAll("_", " ")}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
