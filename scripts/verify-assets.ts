import {existsSync} from "node:fs";
import {resolve} from "node:path";

import sharp from "sharp";

import {ambientAssets} from "../src/content/ambient-assets";
import {corridorBuildings} from "../src/content/building-registry";

const forbiddenIntents = new Set(["property", "building", "unit"]);
const requiredPlacements = new Set([
  "buy-intro",
  "sell-intro",
  "slug-shared-backdrop",
]);

function normalizeForCheck(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function forbiddenTerms(): readonly string[] {
  return corridorBuildings.flatMap((building) => [building.slug, building.name]);
}

function assertNoForbiddenTerms(label: string, value: string): void {
  const haystack = normalizeForCheck(value);

  for (const term of forbiddenTerms()) {
    const normalizedTerm = normalizeForCheck(term);

    if (normalizedTerm && haystack.includes(normalizedTerm)) {
      throw new Error(`${label} leaks corridor building term: ${term}`);
    }
  }
}

async function assertAssetFiles(): Promise<void> {
  for (const asset of ambientAssets) {
    const publicPaths = [asset.srcAvif, asset.srcWebp];

    for (const publicPath of publicPaths) {
      const filePath = resolve(process.cwd(), "public", publicPath.slice(1));

      if (!existsSync(filePath)) {
        throw new Error(`Ambient asset file missing: ${publicPath}`);
      }

      assertNoForbiddenTerms(`${asset.id} filename`, publicPath);

      const metadata = await sharp(filePath).metadata();

      if (metadata.width !== asset.width || metadata.height !== asset.height) {
        throw new Error(
          `${asset.id} dimensions mismatch for ${publicPath}: expected ${asset.width}x${asset.height}, got ${metadata.width}x${metadata.height}`,
        );
      }
    }
  }
}

function assertManifestContracts(): void {
  if (ambientAssets.length < 3 || ambientAssets.length > 4) {
    throw new Error(
      `Expected 3-4 shipped ambient assets, found ${ambientAssets.length}`,
    );
  }

  const placements = new Set<string>();

  for (const asset of ambientAssets) {
    if (forbiddenIntents.has(asset.intent)) {
      throw new Error(`Forbidden asset intent: ${asset.intent}`);
    }

    if (placements.has(asset.placement)) {
      throw new Error(`Duplicate ambient placement: ${asset.placement}`);
    }

    placements.add(asset.placement);
    assertNoForbiddenTerms(`${asset.id} alt`, asset.alt);
    assertNoForbiddenTerms(
      `${asset.id} attribution`,
      [
        asset.attribution?.photographer ?? "",
        asset.attribution?.sourceUrl ?? "",
        asset.attribution?.licenseUrl ?? "",
      ].join(" "),
    );
    assertNoForbiddenTerms(`${asset.id} promptDigest`, asset.promptDigest ?? "");

    const promptDigest: string | null = asset.promptDigest;
    const hasAttribution = asset.attribution !== null;

    if (asset.source === "generated-atmospheric") {
      if (!promptDigest || hasAttribution) {
        throw new Error(`Generated asset has invalid audit fields: ${asset.id}`);
      }
    } else if (!hasAttribution || promptDigest !== null) {
      throw new Error(`Real-photo asset has invalid audit fields: ${asset.id}`);
    }
  }

  for (const placement of requiredPlacements) {
    if (!placements.has(placement)) {
      throw new Error(`Missing required ambient placement: ${placement}`);
    }
  }
}

async function main(): Promise<void> {
  assertManifestContracts();
  await assertAssetFiles();
  console.log(`Verified ${ambientAssets.length} ambient assets.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
