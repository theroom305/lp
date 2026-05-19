import {corridorBuildings} from "./building-registry.generated";

export type DossierType = "proof" | "full" | null;

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
  dossierType: DossierType;
}>;

export {corridorBuildings};

export function getCorridorBuildingBySlug(
  slug: string,
): CorridorBuilding | undefined {
  return corridorBuildings.find((building) => building.slug === slug);
}

export function getCorridorBuildingName(slug: string): string | undefined {
  return getCorridorBuildingBySlug(slug)?.name;
}

export function getDossierType(slug: string): DossierType {
  return getCorridorBuildingBySlug(slug)?.dossierType ?? null;
}
