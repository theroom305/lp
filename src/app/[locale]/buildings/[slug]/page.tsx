import Link from "next/link";
import type {Metadata} from "next";
import {getMessages} from "next-intl/server";
import {notFound} from "next/navigation";

import {BeachwalkProofDossier} from "@/components/atlas/beachwalk-proof-dossier";
import {BuildingDossier} from "@/components/atlas/building-dossier";
import {BuildingTonalPlate} from "@/components/marketplace/building-tonal-plate";
import {JsonLd} from "@/components/seo/json-ld";
import {AmbientStrip} from "@/components/site/ambient-strip";
import {
  corridorBuildings,
  getDossierType,
  getCorridorBuildingBySlug,
} from "@/content/building-registry";
import type {BuildingSourcePacket} from "@/content/source-packets/types";
import {getDossierForBuilding} from "@/content/atlas";
import {locales, type Locale} from "@/i18n/routing";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  localizedPath,
  pageMetadata,
} from "@/lib/seo";
import {getPublicClaims, getSourcePacket} from "@/lib/source-packets";
import {getPublicFactsForBuilding} from "@/server/claims/public-facts";
import {PageShell} from "@/components/site/page-shell";

export const revalidate = 60;

type BuildingPageProps = Readonly<{
  params: Promise<{locale: Locale; slug: string}>;
}>;

export function generateStaticParams(): Array<{locale: Locale; slug: string}> {
  return locales.flatMap((locale) =>
    corridorBuildings.map((building) => ({locale, slug: building.slug})),
  );
}

function buildingContextHref(buildingSlug: string, locale: Locale): string {
  const buyPath = localizedPath({key: "buy", locale});
  return `${buyPath}?building=${encodeURIComponent(buildingSlug)}&intent=buy`;
}

function beachwalkArticleJsonLd(
  locale: Locale,
  packet: BuildingSourcePacket,
) {
  const path = localizedPath({
    key: "building",
    locale,
    slug: "beachwalk-resort",
  });

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Beachwalk Resort Building Fit Review",
    inLanguage: locale,
    mainEntityOfPage: absoluteUrl(path),
    dateModified: packet.lastReviewedAt,
    publisher: {
      "@type": "Organization",
      name: "Room 305",
      url: "https://theroom305.com",
    },
  };
}

function extractBeachwalkMemo(messages: Record<string, unknown>): string {
  const beachwalk = messages.beachwalk;

  if (!beachwalk || typeof beachwalk !== "object" || Array.isArray(beachwalk)) {
    return "";
  }

  const memo = (beachwalk as Record<string, unknown>).memo;
  return typeof memo === "string" ? memo : "";
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
    description: `Room 305 building context scaffold for ${building.name}.`,
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

  const dossierType = getDossierType(slug);

  if (dossierType === "proof") {
    const packet = getSourcePacket(slug);

    if (!packet) {
      notFound();
    }

    const messages = (await getMessages({locale})) as Record<string, unknown>;

    return (
      <PageShell>
        {breadcrumb}
        <JsonLd data={beachwalkArticleJsonLd(locale, packet)} />
        <AmbientStrip placement="slug-shared-backdrop" variant="backdrop" />
        <BeachwalkProofDossier
          building={building}
          locale={locale}
          memo={extractBeachwalkMemo(messages)}
          packet={packet}
          publicClaims={getPublicClaims(slug)}
        />
      </PageShell>
    );
  }

  if (dossierType === "full") {
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
              <dt>Rental-rule view</dt>
              <dd>{building.cadenceLabel}</dd>
            </div>
            <div>
              <dt>Source status</dt>
              <dd>{building.verificationLabel}</dd>
            </div>
          </dl>
        </aside>
        <section className="thin-dossier-copy">
          <p className="eyebrow">{building.submarket}</p>
          <h1>{building.name}</h1>
          <p>
            Working scaffold. Room 305 follows this building, but the full
            building context waits for declaration review and a private memo
            request.
          </p>
          <p>
            Rental-rule labels are conservative until primary records or HOA
            confirmation clear the public page.
          </p>
          <Link
            className="button-link button-link-primary"
            href={buildingContextHref(slug, locale)}
            data-test-id="thin-building-context-cta"
          >
            Use this building as my context →
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
