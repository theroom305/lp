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
  claims: readonly SourceClaim[];
}>;
