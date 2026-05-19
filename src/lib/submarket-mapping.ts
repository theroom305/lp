import {corridorBuildings, type CorridorBuilding} from "@/content/building-registry";

export const submarketFilterIds = [
  "all",
  "hallandale",
  "hollywood",
  "downtown-worldcenter",
  "brickell-midtown",
  "miami-beach",
  "north-corridor",
] as const;

export type SubmarketFilterId = (typeof submarketFilterIds)[number];

function normalizedLocation(building: CorridorBuilding): string {
  return `${building.city} ${building.submarket}`.toLowerCase();
}

export function getSubmarketIdsForBuilding(
  building: CorridorBuilding,
): readonly Exclude<SubmarketFilterId, "all">[] {
  const location = normalizedLocation(building);
  const ids: Exclude<SubmarketFilterId, "all">[] = [];

  if (location.includes("hallandale")) {
    ids.push("hallandale");
  }

  if (location.includes("hollywood")) {
    ids.push("hollywood");
  }

  if (
    location.includes("downtown") ||
    location.includes("worldcenter") ||
    location.includes("park west")
  ) {
    ids.push("downtown-worldcenter");
  }

  if (
    location.includes("brickell") ||
    location.includes("midtown") ||
    location.includes("wynwood")
  ) {
    ids.push("brickell-midtown");
  }

  if (
    location.includes("miami beach") ||
    location.includes("south beach") ||
    location.includes("mid-beach") ||
    location.includes("surfside")
  ) {
    ids.push("miami-beach");
  }

  if (
    location.includes("sunny isles") ||
    location.includes("aventura") ||
    location.includes("pompano")
  ) {
    ids.push("north-corridor");
  }

  return ids;
}

export function buildingsForSubmarket(
  id: SubmarketFilterId,
): readonly CorridorBuilding[] {
  if (id === "all") {
    return corridorBuildings;
  }

  return corridorBuildings.filter((building) =>
    getSubmarketIdsForBuilding(building).includes(id),
  );
}

export function uncoveredBuildingSlugs(): readonly string[] {
  return corridorBuildings
    .filter((building) => getSubmarketIdsForBuilding(building).length === 0)
    .map((building) => building.slug);
}
