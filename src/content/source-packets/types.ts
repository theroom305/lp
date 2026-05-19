// Internal marker stored in BuildingSourcePacket.reviewer when no human reviewer
// is approved. NEVER rendered publicly. Coupled to the e2e leak-detector
// assertion in e2e/funnel-smoke.spec.ts — both must reference this constant so a
// version bump is a compile error, not a silent test pass.
export const INTERNAL_REVIEWER_SENTINEL = "internal-v7.2.1-no-public-render";

export type SourceType =
  | "recorded-declaration"
  | "hoa-document"
  | "operator-observation"
  | "secondary-marketing"
  | "press"
  | "primary-record";

export type FreshnessState = "fresh" | "review-due" | "stale" | "expired";
export type Confidence = "verified" | "high" | "medium" | "verifying";
export type Visibility = "public" | "private" | "internal";

export type SourceClaim = Readonly<{
  buildingId: string;
  claimId: string;
  publicText: string;
  privateNotes?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  sourceDocReference?: string;
  observedDate: string;
  validThroughDate?: string;
  freshnessState: FreshnessState;
  confidence: Confidence;
  reviewer: string;
  visibility: Visibility;
  lastVerifiedBy: string;
  whatCouldChange: string;
}>;

export type BuildingSourcePacket = Readonly<{
  buildingId: string;
  packetVersion: string;
  lastReviewedAt: string;
  reviewer: string;
  humanReviewer?: string;
  claims: readonly SourceClaim[];
}>;
