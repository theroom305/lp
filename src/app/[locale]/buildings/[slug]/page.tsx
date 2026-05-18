import type {Metadata} from "next";
import {notFound} from "next/navigation";

import {BuildingDossier} from "@/components/atlas/building-dossier";
import {JsonLd} from "@/components/seo/json-ld";
import {getDossierForBuilding} from "@/content/atlas";
import type {Locale} from "@/i18n/routing";
import {
  breadcrumbJsonLd,
  localizedPath,
  pageMetadata,
} from "@/lib/seo";
import {getPublicFactsForBuilding} from "@/server/claims/public-facts";
import {PageShell} from "@/components/site/page-shell";

export const dynamic = "force-dynamic";

type BuildingPageProps = Readonly<{
  params: Promise<{locale: Locale; slug: string}>;
}>;

export async function generateMetadata({
  params,
}: BuildingPageProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const dossier = getDossierForBuilding(slug);

  if (!dossier) {
    return {};
  }

  return pageMetadata({
    title: dossier.building.name,
    description: `Room 305 dossier scaffold for ${dossier.building.name}.`,
    key: "building",
    locale,
    slug,
    indexable: false,
  });
}

export default async function BuildingPage({params}: BuildingPageProps) {
  const {locale, slug} = await params;
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
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
          {
            name: "Buildings",
            path: localizedPath({key: "buildings", locale}),
          },
          {
            name: dossier.building.name,
            path: localizedPath({key: "building", locale, slug}),
          },
        ])}
      />
      <BuildingDossier dossier={dossierWithFacts} />
    </PageShell>
  );
}
