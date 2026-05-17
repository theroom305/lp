import type {Metadata} from "next";
import {notFound} from "next/navigation";

import {BuildingDossier} from "@/components/atlas/building-dossier";
import {getDossierForBuilding, v1Buildings} from "@/content/atlas";
import {PageShell} from "@/components/site/page-shell";

type BuildingPageProps = Readonly<{
  params: Promise<{slug: string}>;
}>;

export function generateStaticParams(): Array<{slug: string}> {
  return v1Buildings.map((building) => ({slug: building.slug}));
}

export async function generateMetadata({
  params,
}: BuildingPageProps): Promise<Metadata> {
  const {slug} = await params;
  const dossier = getDossierForBuilding(slug);

  if (!dossier) {
    return {};
  }

  return {
    title: dossier.building.name,
    description: `Room 305 dossier scaffold for ${dossier.building.name}.`,
  };
}

export default async function BuildingPage({params}: BuildingPageProps) {
  const {slug} = await params;
  const dossier = getDossierForBuilding(slug);

  if (!dossier) {
    notFound();
  }

  return (
    <PageShell>
      <BuildingDossier dossier={dossier} />
    </PageShell>
  );
}
