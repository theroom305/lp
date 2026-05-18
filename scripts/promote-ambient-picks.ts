import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

import sharp from "sharp";

type AssetIntent = "ambient" | "material" | "arrival" | "lifestyle-context";
type AssetPlacement = "buy-intro" | "sell-intro" | "slug-shared-backdrop";
type AssetSource = "unsplash" | "pexels" | "generated-atmospheric";
type CropPosition = "center" | "south";

type Attribution = Readonly<{
  photographer: string;
  sourceUrl: string;
  licenseUrl: string;
  retrievedAt: string;
}>;

type QualityScores = Readonly<{
  light: number;
  composition: number;
  material: number;
  palette: number;
  mood: number;
  composite: number;
}>;

type SelectedPick = Readonly<{
  id: string;
  intent: AssetIntent;
  placement: AssetPlacement;
  source: AssetSource;
  inputPath: string;
  outputBase: string;
  width: number;
  height: number;
  position: CropPosition;
  alt: string;
  sourceUrl: string | null;
  attribution: Attribution | null;
  promptDigest: string | null;
  qualityScores: QualityScores;
}>;

type SelectedAssets = Readonly<{
  selectedAt: string;
  sourcePolicy: string;
  picks: readonly SelectedPick[];
}>;

type PromotedPick = SelectedPick &
  Readonly<{
    srcAvif: string;
    srcWebp: string;
    blurDataUrl: string;
  }>;

const selectedPath = resolve(process.cwd(), "_curation/selected-assets.json");
const publicAmbientPath = resolve(process.cwd(), "public/ambient");
const manifestPath = resolve(process.cwd(), "src/content/ambient-assets.ts");
const picksFinalPath = resolve(process.cwd(), "_curation/picks-final.json");

function readSelectedAssets(): SelectedAssets {
  return JSON.parse(readFileSync(selectedPath, "utf8")) as SelectedAssets;
}

function scoreFloor(pick: SelectedPick): void {
  if (pick.qualityScores.composite < 4.5) {
    throw new Error(
      `Selected ambient pick below 4.5 composite floor: ${pick.id}`,
    );
  }
}

function sourceContract(pick: SelectedPick): void {
  if (pick.source === "generated-atmospheric") {
    if (!pick.promptDigest || pick.attribution !== null) {
      throw new Error(`Generated pick has invalid source fields: ${pick.id}`);
    }

    return;
  }

  if (!pick.attribution || pick.promptDigest !== null) {
    throw new Error(`Real-photo pick has invalid attribution fields: ${pick.id}`);
  }
}

async function promotePick(pick: SelectedPick): Promise<PromotedPick> {
  scoreFloor(pick);
  sourceContract(pick);

  const inputPath = resolve(process.cwd(), pick.inputPath);
  const srcAvif = `/ambient/${pick.outputBase}.avif`;
  const srcWebp = `/ambient/${pick.outputBase}.webp`;
  const outputAvif = resolve(publicAmbientPath, `${pick.outputBase}.avif`);
  const outputWebp = resolve(publicAmbientPath, `${pick.outputBase}.webp`);
  const basePipeline = sharp(inputPath).rotate().resize({
    fit: "cover",
    height: pick.height,
    position: pick.position,
    width: pick.width,
  });

  await basePipeline.clone().avif({quality: 46, effort: 7}).toFile(outputAvif);
  await basePipeline.clone().webp({quality: 70, effort: 6}).toFile(outputWebp);

  const blurBuffer = await sharp(inputPath)
    .rotate()
    .resize({
      fit: "cover",
      height: Math.max(1, Math.round((24 * pick.height) / pick.width)),
      position: pick.position,
      width: 24,
    })
    .webp({quality: 36})
    .toBuffer();

  return {
    ...pick,
    blurDataUrl: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
    srcAvif,
    srcWebp,
  };
}

function assetEntry(pick: PromotedPick): string {
  const attributionComment = pick.attribution
    ? `  // Photo by ${pick.attribution.photographer} via ${pick.source}; license ${pick.attribution.licenseUrl}; retrieved ${pick.attribution.retrievedAt}.`
    : "  // Generated atmospheric image; prompt digest retained for audit.";

  return `${attributionComment}
  {
    id: ${JSON.stringify(pick.id)},
    intent: ${JSON.stringify(pick.intent)},
    placement: ${JSON.stringify(pick.placement)},
    source: ${JSON.stringify(pick.source)},
    realPhotosAvailable: ${pick.source === "generated-atmospheric" ? "false" : "true"},
    srcAvif: ${JSON.stringify(pick.srcAvif)},
    srcWebp: ${JSON.stringify(pick.srcWebp)},
    width: ${pick.width},
    height: ${pick.height},
    alt: ${JSON.stringify(pick.alt)},
    blurDataUrl: ${JSON.stringify(pick.blurDataUrl)},
    attribution: ${JSON.stringify(pick.attribution, null, 6)
      .split("\n")
      .join("\n    ")},
    promptDigest: ${JSON.stringify(pick.promptDigest)},
  }`;
}

function manifestBody(promoted: readonly PromotedPick[]): string {
  const entries = promoted.map(assetEntry).join(",\n");

  return `import {corridorBuildings} from "./building-registry";

export type AssetIntent = "ambient" | "material" | "arrival" | "lifestyle-context";
export type AssetPlacement = "buy-intro" | "sell-intro" | "slug-shared-backdrop";
export type AssetSource = "unsplash" | "pexels" | "generated-atmospheric";

export type AmbientAttribution = Readonly<{
  photographer: string;
  sourceUrl: string;
  licenseUrl: string;
  retrievedAt: string;
}>;

type AmbientAssetBase = Readonly<{
  id: string;
  intent: AssetIntent;
  placement: AssetPlacement;
  source: AssetSource;
  realPhotosAvailable: boolean;
  srcAvif: string;
  srcWebp: string;
  width: number;
  height: number;
  alt: string;
  blurDataUrl: string;
}>;

type RealPhotoAmbientAsset = AmbientAssetBase &
  Readonly<{
    source: "unsplash" | "pexels";
    attribution: AmbientAttribution;
    promptDigest: null;
    realPhotosAvailable: true;
  }>;

type GeneratedAmbientAsset = AmbientAssetBase &
  Readonly<{
    source: "generated-atmospheric";
    attribution: null;
    promptDigest: string;
    realPhotosAvailable: false;
  }>;

export type AmbientAsset = RealPhotoAmbientAsset | GeneratedAmbientAsset;

export const ambientAssets: readonly AmbientAsset[] = [
${entries},
];

export function assetForPlacement(
  placement: AssetPlacement,
): AmbientAsset | undefined {
  return ambientAssets.find((asset) => asset.placement === placement);
}

export function assetsByIntent(intent: AssetIntent): readonly AmbientAsset[] {
  return ambientAssets.filter((asset) => asset.intent === intent);
}

const forbiddenAssetTerms = corridorBuildings.flatMap((building) => [
  building.slug,
  building.name,
]);

function normalizeForAssetCheck(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function assertAmbientAssetSafety(asset: AmbientAsset): void {
  const filenameText = [asset.srcAvif, asset.srcWebp]
    .map((path) => path.split("/").at(-1) ?? path)
    .join(" ");
  const checkedFields = [
    asset.alt,
    filenameText,
    asset.promptDigest ?? "",
    asset.attribution?.photographer ?? "",
    asset.attribution?.sourceUrl ?? "",
  ];
  const haystack = normalizeForAssetCheck(checkedFields.join(" "));

  for (const term of forbiddenAssetTerms) {
    const normalizedTerm = normalizeForAssetCheck(term);

    if (normalizedTerm && haystack.includes(normalizedTerm)) {
      throw new Error(
        \`Ambient asset \${asset.id} leaks corridor building term: \${term}\`,
      );
    }
  }
}

for (const asset of ambientAssets) {
  assertAmbientAssetSafety(asset);
}
`;
}

async function main(): Promise<void> {
  mkdirSync(publicAmbientPath, {recursive: true});

  const selectedAssets = readSelectedAssets();
  const promoted = await Promise.all(selectedAssets.picks.map(promotePick));

  writeFileSync(manifestPath, manifestBody(promoted));
  writeFileSync(
    picksFinalPath,
    `${JSON.stringify(
      {
        promotedAt: new Date().toISOString(),
        sourcePolicy: selectedAssets.sourcePolicy,
        picks: promoted.map((pick) => ({
          id: pick.id,
          intent: pick.intent,
          placement: pick.placement,
          source: pick.source,
          srcAvif: pick.srcAvif,
          srcWebp: pick.srcWebp,
          width: pick.width,
          height: pick.height,
          alt: pick.alt,
          attribution: pick.attribution,
          promptDigest: pick.promptDigest,
          qualityScores: pick.qualityScores,
        })),
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
