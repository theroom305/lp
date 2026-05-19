// Showroom curation — intentionally independent of atlas.v1Buildings.
// v1Buildings governs full-dossier slug pages; featuredBuildings governs the
// homepage showroom strip. They may drift on purpose as either surface evolves.
import {
  getCorridorBuildingBySlug,
} from "@/content/building-registry";

export const featuredBuildingSlugs = [
  "beachwalk-resort",
  "the-elser-miami",
  "e11even-hotel-residences",
  "the-crosby",
  "costa-hollywood",
  "seven-park-residences",
] as const;

export const featuredBuildings = featuredBuildingSlugs.map((slug) => {
  const building = getCorridorBuildingBySlug(slug);

  if (!building) {
    throw new Error(`Featured building missing from registry: ${slug}`);
  }

  return building;
});
