export type SourceScope =
  | "public_ui"
  | "public_metadata"
  | "json_ld"
  | "llms_txt"
  | "private_note"
  | "internal_brief";

export type SourceTrustTier =
  | "primary_record"
  | "hoa_confirmed"
  | "developer_public"
  | "operator_observed"
  | "secondary_market"
  | "unverified";

export type PublicFact = Readonly<{
  id: string;
  buildingSlug: string;
  text: string;
  sourceId: string;
  scope: SourceScope;
  claimVisibility: "public" | "private_note_only" | "internal_only" | "restricted";
  trustTier: SourceTrustTier;
  expiresAt: string | null;
  confidence: "verified" | "secondary" | "operator_observed" | "verifying";
  locale: "en" | "es";
}>;

export type BuildingStage =
  | "pre_construction"
  | "under_construction"
  | "recently_delivered"
  | "stabilized";

export type DossierSectionId =
  | "answer"
  | "fit"
  | "rules"
  | "what-could-go-wrong"
  | "operator-notes"
  | "ownership-path"
  | "compare"
  | "sources"
  | "memo-split";

export const memoRequestTypes = [
  "rules",
  "operator",
  "investment_fit",
  "owner_takeover",
] as const;

export type MemoRequestType = (typeof memoRequestTypes)[number];

export type DossierSection = Readonly<{
  id: DossierSectionId;
  label: string;
  eyebrow: string;
  facts: readonly PublicFact[];
  placeholder: string;
}>;

export type BuildingRecord = Readonly<{
  slug: string;
  name: string;
  city: string;
  stage: BuildingStage;
  verificationState: "verifying" | "declaration_reviewed" | "hoa_confirmed" | "operator_known";
  isDelivered: boolean;
  publicPageV1: boolean;
}>;

export type BuildingDossierData = Readonly<{
  building: BuildingRecord;
  sections: readonly DossierSection[];
}>;

export const dossierSectionOrder: readonly DossierSectionId[] = [
  "answer",
  "fit",
  "rules",
  "what-could-go-wrong",
  "operator-notes",
  "ownership-path",
  "compare",
  "sources",
  "memo-split",
];

export const memoAdvisorMap: Record<
  MemoRequestType,
  {label: string; advisor: string; description: string; deliveredOnly: boolean}
> = {
  rules: {
    label: "Rules Memo",
    advisor: "Lawyer",
    description: "Declaration, rental terms, owner-use caps, local license path.",
    deliveredOnly: false,
  },
  operator: {
    label: "Working Notes",
    advisor: "Spouse / family",
    description: "Daily ownership reality, service tier, and building cautions.",
    deliveredOnly: false,
  },
  investment_fit: {
    label: "Investment-Fit Memo",
    advisor: "Accountant / wealth advisor",
    description: "Income shape, risk factors, structure questions, and exit optionality.",
    deliveredOnly: false,
  },
  owner_takeover: {
    label: "Owner Takeover Memo",
    advisor: "Current-owner advisor",
    description: "Switch review, current-manager pain, and what changes on day one.",
    deliveredOnly: true,
  },
};

export const v1Buildings: readonly BuildingRecord[] = [
  {
    slug: "beachwalk-resort",
    name: "Beachwalk Resort",
    city: "Hallandale Beach",
    stage: "stabilized",
    verificationState: "operator_known",
    isDelivered: true,
    publicPageV1: true,
  },
  {
    slug: "seven-park-residences",
    name: "Seven Park Residences",
    city: "Hallandale Beach",
    stage: "under_construction",
    verificationState: "verifying",
    isDelivered: false,
    publicPageV1: true,
  },
  {
    slug: "the-elser-miami",
    name: "The Elser Hotel & Residences",
    city: "Downtown Miami",
    stage: "recently_delivered",
    verificationState: "verifying",
    isDelivered: true,
    publicPageV1: true,
  },
  {
    slug: "the-crosby",
    name: "The Crosby",
    city: "Miami Worldcenter",
    stage: "under_construction",
    verificationState: "verifying",
    isDelivered: false,
    publicPageV1: true,
  },
  {
    slug: "e11even-hotel-residences",
    name: "E11EVEN Hotel & Residences",
    city: "Downtown Miami",
    stage: "recently_delivered",
    verificationState: "verifying",
    isDelivered: true,
    publicPageV1: true,
  },
  {
    slug: "costa-hollywood",
    name: "Costa Hollywood",
    city: "Hollywood Beach",
    stage: "stabilized",
    verificationState: "verifying",
    isDelivered: true,
    publicPageV1: true,
  },
];

const sectionLabels: Record<DossierSectionId, string> = {
  answer: "Answer",
  fit: "Fit",
  rules: "Rules",
  "what-could-go-wrong": "What Could Go Wrong",
  "operator-notes": "Working Notes",
  "ownership-path": "Ownership Path",
  compare: "Compare",
  sources: "Sources",
  "memo-split": "Memo Split CTA",
};

const sectionEyebrows: Record<DossierSectionId, string> = {
  answer: "Section 01",
  fit: "Section 02",
  rules: "Source status",
  "what-could-go-wrong": "Pratfall check",
  "operator-notes": "Building judgment",
  "ownership-path": "Owner path",
  compare: "Market context",
  sources: "Provenance",
  "memo-split": "Advisor memo",
};

const placeholders: Record<DossierSectionId, string> = {
  answer: "Direct building answer placeholder. CC drafts in Step 3.5.",
  fit: "Buyer-fit and avoid-if placeholder. CC drafts in Step 3.5.",
  rules: "Source-backed rules table placeholder. Declaration facts arrive after verification.",
  "what-could-go-wrong": "Per-building caution; CC drafts in Step 3.5.",
  "operator-notes": "Working judgment placeholder. No unverified numbers.",
  "ownership-path": "Buyer path and delivered-building owner path placeholder.",
  compare: "Adjacent-building comparison placeholder.",
  sources: "Layered source provenance placeholder.",
  "memo-split": "Advisor-targeted memo request placeholder.",
};

export function getBuildingBySlug(slug: string): BuildingRecord | undefined {
  return v1Buildings.find((building) => building.slug === slug);
}

export function getDossierForBuilding(slug: string): BuildingDossierData | undefined {
  const building = getBuildingBySlug(slug);

  if (!building) {
    return undefined;
  }

  return {
    building,
    sections: dossierSectionOrder.map((id) => ({
      id,
      label: sectionLabels[id],
      eyebrow: sectionEyebrows[id],
      facts: [],
      placeholder: placeholders[id],
    })),
  };
}

export function isBuildingIndexable(building: BuildingRecord): boolean {
  return building.verificationState !== "verifying";
}

export function getPublicAtlasBuildings(): readonly BuildingRecord[] {
  return v1Buildings.filter((building) => building.publicPageV1);
}

export function getIndexableBuildings(): readonly BuildingRecord[] {
  return getPublicAtlasBuildings().filter(isBuildingIndexable);
}

export function getPendingVerificationBuildings(): readonly BuildingRecord[] {
  return getPublicAtlasBuildings().filter(
    (building) => !isBuildingIndexable(building),
  );
}

export function getNewDevelopmentBuildings(): readonly BuildingRecord[] {
  return v1Buildings.filter(
    (building) =>
      building.stage === "pre_construction" ||
      building.stage === "under_construction",
  );
}
