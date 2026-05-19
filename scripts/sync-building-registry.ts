import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

import {parse} from "yaml";

const registryPath = resolve(
  process.cwd(),
  "../shared-brain/products/room305aioperator/market/buildings/registry.yml",
);
const outputPath = resolve(
  process.cwd(),
  "src/content/building-registry.generated.ts",
);

const expectedSlugs = [
  "lyfe-resort-hollywood",
  "beachwalk-resort",
  "gale-residences-miami",
  "the-elser-miami",
  "costa-hollywood",
  "natiivo-miami",
  "w-pompano-beach",
  "standard-residences-brickell",
  "standard-residences-midtown",
  "e11even-hotel-residences",
  "the-crosby",
  "eden-aventura",
  "seven-park-residences",
  "hollywood-moon-residences",
  "gaia-hollywood",
  "ritz-carlton-residences-miami-beach",
  "bentley-residences-sunny-isles",
  "porsche-design-tower",
  "five-park-miami-beach",
] as const;

const fullDossierSlugs = new Set([
  "beachwalk-resort",
  "seven-park-residences",
  "the-elser-miami",
  "the-crosby",
  "e11even-hotel-residences",
  "costa-hollywood",
]);

type SourceRecord = Record<string, unknown>;


type PublicBuilding = Readonly<{
  slug: string;
  name: string;
  city: string;
  submarket: string;
  year: number | null;
  stageLabel: string;
  brandTier: string;
  cadenceLabel: string;
  verificationLabel: string;
  tone: string;
  isFullDossier: boolean;
}>;

function validateCommittedProjection(): void {
  if (!existsSync(outputPath)) {
    throw new Error(
      `Building registry missing and generated projection not found: ${outputPath}`,
    );
  }

  const generated = readFileSync(outputPath, "utf8");

  for (const slug of expectedSlugs) {
    if (!generated.includes(`"slug": "${slug}"`)) {
      throw new Error(`Generated building projection missing slug: ${slug}`);
    }
  }

  if (/"name": "[^"]*\(/.test(generated)) {
    throw new Error("Generated building projection contains name parentheticals.");
  }

  if (
    /legal_|isaac_relationship|operating_units_room305|priority|bankruptcy/.test(
      generated,
    )
  ) {
    throw new Error("Generated building projection contains private registry data.");
  }
}

function requireString(record: SourceRecord, key: string): string {
  const value = record[key];

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  throw new Error(`Building registry entry missing string field: ${key}`);
}

function publicBuildingName(rawName: string): string {
  return rawName.replace(/\s+\([^)]*\)/g, "").trim();
}

function optionalYear(record: SourceRecord): number | null {
  const value = record.year;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/\d{4}/);
    return match ? Number(match[0]) : null;
  }

  return null;
}

function stageLabelForYear(year: number | null): string {
  if (!year) {
    return "Timeline verifying";
  }

  return year <= 2025 ? `Delivered ${year}` : `Delivering ${year}`;
}

function cadenceLabelForStatus(status: string): string {
  switch (status) {
    case "legal_7_night_min":
      return "Weekly rules pending";
    case "legal_no_minimum":
      return "Short-stay rules pending";
    case "legal_30_night_min":
      return "Monthly rules pending";
    case "residential_only":
      return "Residential rules pending";
    case "unverified":
      return "Rental rules under review";
    default:
      return "Rental rules under review";
  }
}

function verificationLabelFor(record: SourceRecord): string {
  const relationship = requireString(record, "isaac_relationship");
  const source = requireString(record, "str_source");
  const status = requireString(record, "str_status");

  if (relationship === "operating") {
    return "Where we operate today";
  }

  if (status === "unverified") {
    return "Declaration review pending";
  }

  if (source === "secondary") {
    return "Secondary source reviewed";
  }

  return "Declaration review pending";
}

function toneFor(record: SourceRecord): string {
  const city = requireString(record, "city").toLowerCase();
  const submarket = requireString(record, "submarket").toLowerCase();
  const combined = `${city} ${submarket}`;

  if (
    combined.includes("hallandale") ||
    combined.includes("hollywood") ||
    combined.includes("pompano")
  ) {
    return "sand-dusk";
  }

  if (combined.includes("brickell") || combined.includes("downtown")) {
    return "brass-forest";
  }

  if (
    combined.includes("edgewater") ||
    combined.includes("midtown") ||
    combined.includes("wynwood")
  ) {
    return "olive-pearl";
  }

  if (
    combined.includes("sunny isles") ||
    combined.includes("bal harbour") ||
    combined.includes("aventura")
  ) {
    return "pearl-champagne";
  }

  if (combined.includes("miami beach") || combined.includes("south beach")) {
    return "coral-sand";
  }

  return "brass-forest";
}

function toPublicBuilding(record: SourceRecord): PublicBuilding {
  const slug = requireString(record, "slug");
  const year = optionalYear(record);

  return {
    slug,
    name: publicBuildingName(requireString(record, "name")),
    city: requireString(record, "city"),
    submarket: requireString(record, "submarket"),
    year,
    stageLabel: stageLabelForYear(year),
    brandTier: requireString(record, "brand_tier").replaceAll("-", " "),
    cadenceLabel: cadenceLabelForStatus(requireString(record, "str_status")),
    verificationLabel: verificationLabelFor(record),
    tone: toneFor(record),
    isFullDossier: fullDossierSlugs.has(slug),
  };
}

if (!existsSync(registryPath)) {
  validateCommittedProjection();
  console.warn(
    `Building registry source not found at ${registryPath}; using committed public projection.`,
  );
  process.exit(0);
}

const rawRegistry = parse(readFileSync(registryPath, "utf8")) as unknown;

if (!Array.isArray(rawRegistry)) {
  throw new Error("Building registry must be a YAML list.");
}

const publicBuildings = rawRegistry.map((entry) => {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error("Building registry entry must be an object.");
  }

  return toPublicBuilding(entry as SourceRecord);
});

const actualSlugs = publicBuildings.map((building) => building.slug);

if (publicBuildings.length !== expectedSlugs.length) {
  throw new Error(
    `Expected ${expectedSlugs.length} corridor buildings, found ${publicBuildings.length}.`,
  );
}

for (const slug of expectedSlugs) {
  if (!actualSlugs.includes(slug)) {
    throw new Error(`Expected corridor building missing from registry: ${slug}`);
  }
}

const fileBody = `import type {CorridorBuilding} from "./building-registry";

// Generated by scripts/sync-building-registry.ts.
// Public-safe projection only; internal registry fields are not emitted.
export const corridorBuildings = ${JSON.stringify(publicBuildings, null, 2)} as const satisfies readonly CorridorBuilding[];
`;

writeFileSync(outputPath, fileBody);
