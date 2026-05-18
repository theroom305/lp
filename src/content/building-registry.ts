import {corridorBuildings} from "./building-registry.generated";

const featuredSlugs = [
  "beachwalk-resort",
  "five-park-miami-beach",
  "ritz-carlton-residences-miami-beach",
  "the-crosby",
  "e11even-hotel-residences",
] as const;

export type CorridorBuilding = Readonly<{
  slug: string;
  name: string;
  city: string;
  submarket: string;
  year: number | null;
  stageLabel: string;
  brandTier: string;
  cadenceLabel: string;
  verificationLabel: string;
  tone:
    | "sand-dusk"
    | "brass-forest"
    | "olive-pearl"
    | "pearl-champagne"
    | "coral-sand";
  isFullDossier: boolean;
}>;

export {corridorBuildings};

export const featuredBuildings = featuredSlugs.map((slug) => {
  const building = corridorBuildings.find((candidate) => candidate.slug === slug);

  if (!building) {
    throw new Error(`Featured building missing from registry: ${slug}`);
  }

  return building;
});

export function getCorridorBuildingBySlug(
  slug: string,
): CorridorBuilding | undefined {
  return corridorBuildings.find((building) => building.slug === slug);
}

export function getCorridorBuildingName(slug: string): string | undefined {
  return getCorridorBuildingBySlug(slug)?.name;
}

export function isFullDossierSlug(slug: string): boolean {
  return getCorridorBuildingBySlug(slug)?.isFullDossier ?? false;
}
