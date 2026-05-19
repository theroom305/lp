import type {CSSProperties} from "react";

import {
  assetForPlacement,
  type AssetPlacement,
} from "@/content/ambient-assets";

type AmbientStripProps = Readonly<{
  placement: AssetPlacement;
  variant?: "side" | "backdrop" | "divider";
}>;

type AmbientStripStyle = CSSProperties &
  Readonly<{
    "--ambient-aspect-ratio": string;
    "--ambient-blur": string;
  }>;

const sizesByVariant: Record<NonNullable<AmbientStripProps["variant"]>, string> = {
  backdrop: "(min-width: 960px) 88vw, 100vw",
  divider: "(min-width: 960px) 88vw, 100vw",
  side: "(min-width: 760px) 42vw, 100vw",
};

export function AmbientStrip({
  placement,
  variant = "divider",
}: AmbientStripProps) {
  const asset = assetForPlacement(placement);
  const isLikelyLcp = variant === "side" || variant === "backdrop";

  if (!asset) {
    return null;
  }

  const style: AmbientStripStyle = {
    "--ambient-aspect-ratio": `${asset.width} / ${asset.height}`,
    "--ambient-blur": `url(${asset.blurDataUrl})`,
  };

  return (
    <figure
      className="ambient-strip"
      data-placement={placement}
      data-source={asset.source}
      data-variant={variant}
      style={style}
    >
      <picture>
        <source srcSet={asset.srcAvif} type="image/avif" />
        <source srcSet={asset.srcWebp} type="image/webp" />
        <img
          alt={asset.alt}
          decoding="async"
          fetchPriority={isLikelyLcp ? "high" : "auto"}
          height={asset.height}
          loading={isLikelyLcp ? "eager" : "lazy"}
          sizes={sizesByVariant[variant]}
          src={asset.srcWebp}
          width={asset.width}
        />
      </picture>
    </figure>
  );
}
