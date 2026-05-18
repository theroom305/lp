import {corridorBuildings} from "./building-registry";

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
  // Photo by Kulbir via pexels; license https://www.pexels.com/license/; retrieved 2026-05-18.
  {
    id: "threshold-brass-light",
    intent: "arrival",
    placement: "buy-intro",
    source: "pexels",
    realPhotosAvailable: true,
    srcAvif: "/ambient/threshold-brass-light.avif",
    srcWebp: "/ambient/threshold-brass-light.webp",
    width: 1400,
    height: 1000,
    alt: "Warm light crossing brass door pulls on a pale private threshold.",
    blurDataUrl: "data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAAAQBACdASoYABEAPv1wsFIrJiSiqAqpYB+JZQC4MA19TlYzS6FoJI9igADwyGzKiogEAUQ0GyVpHS5xj6ryS8a4eEsbrKlZ2NaOdswcizYGOUbBw+UySGasBEad7AgZJFJQcNTmWzHvAAAA",
    attribution: {
          "photographer": "Kulbir",
          "sourceUrl": "https://www.pexels.com/photo/brass-handle-on-doors-9882313/",
          "licenseUrl": "https://www.pexels.com/license/",
          "retrievedAt": "2026-05-18"
    },
    promptDigest: null,
  },
  // Photo by Farhad Ibrahimzade via pexels; license https://www.pexels.com/license/; retrieved 2026-05-18.
  {
    id: "ceramic-linen-light",
    intent: "lifestyle-context",
    placement: "sell-intro",
    source: "pexels",
    realPhotosAvailable: true,
    srcAvif: "/ambient/ceramic-linen-light.avif",
    srcWebp: "/ambient/ceramic-linen-light.webp",
    width: 1400,
    height: 1000,
    alt: "Soft daylight over handmade ceramic vessels on a quiet neutral surface.",
    blurDataUrl: "data:image/webp;base64,UklGRoQAAABXRUJQVlA4IHgAAACQBACdASoYABEAPv1kq08rJSOiMBgMAWAfiWcAzNAOnh6bT+g7ibCJkORZGkAA/pdp4zuoPmiV21NcvFzNF/61i6bC/5UMgDaTMuzJLFdqfKOVhRdxCXKIn81f2S0zOjT1dqpExagennhk9ks2F1sN1cfYrjAAAAA=",
    attribution: {
          "photographer": "Farhad Ibrahimzade",
          "sourceUrl": "https://www.pexels.com/photo/minimalist-ceramic-cups-in-soft-sunlight-29904627/",
          "licenseUrl": "https://www.pexels.com/license/",
          "retrievedAt": "2026-05-18"
    },
    promptDigest: null,
  },
  // Photo by Matteo Milan via pexels; license https://www.pexels.com/license/; retrieved 2026-05-18.
  {
    id: "coastal-pool-stillness",
    intent: "ambient",
    placement: "slug-shared-backdrop",
    source: "pexels",
    realPhotosAvailable: true,
    srcAvif: "/ambient/coastal-pool-stillness.avif",
    srcWebp: "/ambient/coastal-pool-stillness.webp",
    width: 1600,
    height: 900,
    alt: "Quiet pool water and lounge chairs facing a soft coastal horizon at dusk.",
    blurDataUrl: "data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAAAQBACdASoYAA4APv1oq06rJaOiMAgBYB+JYwCdEf/gPImzwJSH7tAsgAD+0w75Lhd1LFaNIm6D3VFF9ZIO0OI+1rJcdKkgk/cwWvEBSkQqRcmsyTQykJoRTkJ1E5qG6Y1ItxL/rx3AAAAA",
    attribution: {
          "photographer": "Matteo Milan",
          "sourceUrl": "https://www.pexels.com/photo/swimming-pool-on-sea-shore-at-sunset-17648794/",
          "licenseUrl": "https://www.pexels.com/license/",
          "retrievedAt": "2026-05-18"
    },
    promptDigest: null,
  },
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
        `Ambient asset ${asset.id} leaks corridor building term: ${term}`,
      );
    }
  }
}

for (const asset of ambientAssets) {
  assertAmbientAssetSafety(asset);
}
