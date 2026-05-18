import Link from "next/link";
import type {Metadata} from "next";
import {notFound} from "next/navigation";

import {BuildingDossier} from "@/components/atlas/building-dossier";
import {BuildingTonalPlate} from "@/components/marketplace/building-tonal-plate";
import {JsonLd} from "@/components/seo/json-ld";
import {AmbientStrip} from "@/components/site/ambient-strip";
import {
  getCorridorBuildingBySlug,
  isFullDossierSlug,
} from "@/content/building-registry";
import {getDossierForBuilding} from "@/content/atlas";
import type {Locale} from "@/i18n/routing";
import {breadcrumbJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {getPublicFactsForBuilding} from "@/server/claims/public-facts";
import {PageShell} from "@/components/site/page-shell";

export const dynamic = "force-dynamic";

type BuildingPageProps = Readonly<{
  params: Promise<{locale: Locale; slug: string}>;
}>;

function buildingContextHref(buildingSlug: string, locale: Locale): string {
  const buyPath = localizedPath({key: "buy", locale});
  return `${buyPath}?building=${encodeURIComponent(buildingSlug)}&intent=buy`;
}

export async function generateMetadata({
  params,
}: BuildingPageProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const building = getCorridorBuildingBySlug(slug);

  if (!building) {
    return {};
  }

  return pageMetadata({
    title: building.name,
    description: `Room 305 methodological scaffold for ${building.name}.`,
    key: "building",
    locale,
    slug,
    indexable: false,
  });
}

export default async function BuildingPage({params}: BuildingPageProps) {
  const {locale, slug} = await params;
  const building = getCorridorBuildingBySlug(slug);

  if (!building) {
    notFound();
  }

  const breadcrumb = (
    <JsonLd
      data={breadcrumbJsonLd([
        {name: "Room 305", path: localizedPath({key: "home", locale})},
        {
          name: "Buildings",
          path: localizedPath({key: "buildings", locale}),
        },
        {
          name: building.name,
          path: localizedPath({key: "building", locale, slug}),
        },
      ])}
    />
  );

  if (isFullDossierSlug(slug)) {
    const dossier = getDossierForBuilding(slug);

    if (!dossier) {
      notFound();
    }

    const publicFacts = await getPublicFactsForBuilding(slug, locale);
    const dossierWithFacts = {
      ...dossier,
      sections: dossier.sections.map((section) =>
        section.id === "sources" ? {...section, facts: publicFacts} : section,
      ),
    };

    return (
      <PageShell>
        {breadcrumb}
        <AmbientStrip placement="slug-shared-backdrop" variant="backdrop" />
        <BuildingDossier
          corridorBuilding={building}
          ctaHref={buildingContextHref(slug, locale)}
          dossier={dossierWithFacts}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {breadcrumb}
      <main
        className="dossier-page thin-dossier"
        data-test-id="thin-building-scaffold"
      >
        <aside className="dossier-context-panel">
          <BuildingTonalPlate building={building} variant="large" />
          <dl className="building-meta-list">
            <div>
              <dt>City</dt>
              <dd>{building.city}</dd>
            </div>
            <div>
              <dt>Timeline</dt>
              <dd>{building.stageLabel}</dd>
            </div>
            <div>
              <dt>Cadence frame</dt>
              <dd>{building.cadenceLabel}</dd>
            </div>
            <div>
              <dt>Source posture</dt>
              <dd>{building.verificationLabel}</dd>
            </div>
          </dl>
        </aside>
        <section className="thin-dossier-copy">
          <p className="eyebrow">{building.submarket}</p>
          <h1>{building.name}</h1>
          <p>
            Working scaffold. Room 305 follows this building, but the full
            operator context waits for declaration review and a private memo
            request.
          </p>
          <p>
            Cadence labels are methodological until primary records or HOA
            confirmation clear the public page.
          </p>
          <Link
            className="button-link button-link-primary"
            href={buildingContextHref(slug, locale)}
            data-test-id="thin-building-context-cta"
          >
            Use this building as my context
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
