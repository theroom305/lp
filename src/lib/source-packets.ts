import {beachwalkResortSourcePacket} from "@/content/source-packets/beachwalk-resort";
import type {
  BuildingSourcePacket,
  FreshnessState,
  SourceClaim,
} from "@/content/source-packets/types";

const sourcePacketsBySlug: Record<string, BuildingSourcePacket> = {
  "beachwalk-resort": beachwalkResortSourcePacket,
};

export type ClaimRenderState = Readonly<{
  state: FreshnessState;
  isRenderable: boolean;
  isReviewDue: boolean;
}>;

function daysUntil(date: string): number {
  const now = new Date();
  const target = new Date(`${date}T00:00:00Z`);
  const milliseconds = target.getTime() - now.getTime();

  return Math.ceil(milliseconds / 86_400_000);
}

export function getSourcePacket(
  slug: string,
): BuildingSourcePacket | undefined {
  return sourcePacketsBySlug[slug];
}

export function claimFreshness(claim: SourceClaim): ClaimRenderState {
  if (claim.freshnessState === "stale" || claim.freshnessState === "expired") {
    return {
      state: claim.freshnessState,
      isRenderable: false,
      isReviewDue: false,
    };
  }

  if (claim.validThroughDate && daysUntil(claim.validThroughDate) < 0) {
    return {
      state: "expired",
      isRenderable: false,
      isReviewDue: false,
    };
  }

  const isReviewDue =
    claim.freshnessState === "review-due" ||
    (claim.validThroughDate ? daysUntil(claim.validThroughDate) <= 60 : false);

  return {
    state: isReviewDue ? "review-due" : claim.freshnessState,
    isRenderable: true,
    isReviewDue,
  };
}

export function isPublicClaimRenderable(claim: SourceClaim): boolean {
  if (claim.visibility !== "public") {
    return false;
  }

  return claimFreshness(claim).isRenderable;
}

export function getPublicClaims(slug: string): readonly SourceClaim[] {
  return getSourcePacket(slug)?.claims.filter(isPublicClaimRenderable) ?? [];
}
