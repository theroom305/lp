import {corridorBuildings} from "@/content/building-registry";
import type {
  BudgetBand,
  CustomerState,
  LeadScore,
  UseMix,
  V7LeadRequest,
  V7LeadTier,
  V7Timeline,
} from "@/server/lead/schema";

export type LeadClassification = Readonly<{
  tier: V7LeadTier;
  reasonCodes: string[];
  atlasMatch: boolean;
  matchedBuildingSlug: string | null;
  operatorKnown: boolean;
  servicedLanguage: "en" | "es-LatAm" | "other";
  timezone: string | null;
}>;

type BuildingMatch = Readonly<{
  slug: string;
  operatorKnown: boolean;
}>;

const operatorKnownSlugs = new Set(["beachwalk-resort"]);
const latinAmericaCountryCodes = new Set([
  "ar",
  "br",
  "cl",
  "co",
  "cr",
  "do",
  "ec",
  "gt",
  "hn",
  "mx",
  "pa",
  "pe",
  "uy",
  "ve",
]);
const countryTimezoneHints: Readonly<Record<string, string>> = {
  ar: "America/Argentina/Buenos_Aires",
  br: "America/Sao_Paulo",
  cl: "America/Santiago",
  co: "America/Bogota",
  mx: "America/Mexico_City",
  pa: "America/Panama",
  pe: "America/Lima",
  us: "America/New_York",
  uy: "America/Montevideo",
  ve: "America/Caracas",
};
const outOfCorridorTerms = [
  "new york",
  "nyc",
  "manhattan",
  "orlando",
  "tampa",
  "los angeles",
  "california",
  "texas",
  "chicago",
  "atlanta",
] as const;

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeCountry(value: string | null | undefined): string {
  return normalizeSearchText(value ?? "").replace(/\s+/g, "");
}

function matchBuilding(buildingOrArea: string): BuildingMatch | null {
  const normalizedInput = normalizeSearchText(buildingOrArea);

  for (const building of corridorBuildings) {
    const candidates = [
      building.slug,
      building.name,
      building.city,
      building.submarket,
    ].map(normalizeSearchText);

    if (
      candidates.some(
        (candidate) =>
          normalizedInput.includes(candidate) || candidate.includes(normalizedInput),
      )
    ) {
      return {
        slug: building.slug,
        operatorKnown: operatorKnownSlugs.has(building.slug),
      };
    }
  }

  return null;
}

function servicedLanguage(payload: V7LeadRequest): "en" | "es-LatAm" | "other" {
  if (payload.context.locale === "es") {
    return "es-LatAm";
  }

  const country = normalizeCountry(payload.countryOfResidence);

  if (latinAmericaCountryCodes.has(country)) {
    return "es-LatAm";
  }

  return "en";
}

function timezoneForCountry(
  countryOfResidence: string | null | undefined,
): string | null {
  return countryTimezoneHints[normalizeCountry(countryOfResidence)] ?? null;
}

function isSpamOrTest(payload: V7LeadRequest): boolean {
  const checked = [
    payload.contact.name,
    payload.contact.email,
    payload.buildingOrArea,
    payload.mainConcern ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return /\b(spam|asdf|qwerty|fakelead)\b/.test(checked);
}

function isInCorridorOrUnknown(buildingOrArea: string, atlasMatch: boolean): boolean {
  if (atlasMatch) {
    return true;
  }

  const normalizedInput = normalizeSearchText(buildingOrArea);
  return !outOfCorridorTerms.some((term) => normalizedInput.includes(term));
}

function hasQualifiedBudget(budgetBand: BudgetBand | null | undefined): boolean {
  return (
    budgetBand === "500k-1m" ||
    budgetBand === "1m-2m" ||
    budgetBand === "2m-plus"
  );
}

function isRentalOrMixedUse(useMix: UseMix): boolean {
  return useMix === "mixed" || useMix === "rental-led";
}

function timelineIsNearTerm(timeline: V7Timeline): boolean {
  return timeline === "lt-3mo" || timeline === "3-12mo";
}

function appendBaseReasons(
  payload: V7LeadRequest,
  matchedBuilding: BuildingMatch | null,
): string[] {
  const reasons: string[] = [
    `customer_state_${payload.customerState}`,
    `use_mix_${payload.useMix}`,
    `timeline_${payload.timeline}`,
  ];

  if (matchedBuilding) {
    reasons.push("atlas_match");
  }

  if (matchedBuilding?.operatorKnown) {
    reasons.push("operator_known_building");
  }

  if (payload.advisorInvolved) {
    reasons.push("advisor_involved");
  }

  return reasons;
}

export function classifyLead(payload: V7LeadRequest): LeadClassification {
  const matchedBuilding = matchBuilding(payload.buildingOrArea);
  const atlasMatch = Boolean(matchedBuilding);
  const language = servicedLanguage(payload);
  const baseReasons = appendBaseReasons(payload, matchedBuilding);

  if (isSpamOrTest(payload)) {
    return {
      tier: "deflect",
      reasonCodes: [...baseReasons, "spam_or_test_signal"],
      atlasMatch,
      matchedBuildingSlug: matchedBuilding?.slug ?? null,
      operatorKnown: matchedBuilding?.operatorKnown ?? false,
      servicedLanguage: language,
      timezone: timezoneForCountry(payload.countryOfResidence),
    };
  }

  if (language === "other") {
    return {
      tier: "deflect",
      reasonCodes: [...baseReasons, "unsupported_language"],
      atlasMatch,
      matchedBuildingSlug: matchedBuilding?.slug ?? null,
      operatorKnown: matchedBuilding?.operatorKnown ?? false,
      servicedLanguage: language,
      timezone: timezoneForCountry(payload.countryOfResidence),
    };
  }

  if (!isInCorridorOrUnknown(payload.buildingOrArea, atlasMatch)) {
    return {
      tier: "deflect",
      reasonCodes: [...baseReasons, "out_of_corridor"],
      atlasMatch,
      matchedBuildingSlug: matchedBuilding?.slug ?? null,
      operatorKnown: matchedBuilding?.operatorKnown ?? false,
      servicedLanguage: language,
      timezone: timezoneForCountry(payload.countryOfResidence),
    };
  }

  if (
    payload.customerState === "i-own" &&
    matchedBuilding?.operatorKnown
  ) {
    return {
      tier: "high",
      reasonCodes: [...baseReasons, "owner_in_operator_known_building"],
      atlasMatch,
      matchedBuildingSlug: matchedBuilding.slug,
      operatorKnown: true,
      servicedLanguage: language,
      timezone: timezoneForCountry(payload.countryOfResidence),
    };
  }

  if (isRentalOrMixedUse(payload.useMix)) {
    if (timelineIsNearTerm(payload.timeline)) {
      if (hasQualifiedBudget(payload.budgetBand) || payload.advisorInvolved) {
        return {
          tier: "high",
          reasonCodes: [...baseReasons, "near_term_rental_or_mixed_with_context"],
          atlasMatch,
          matchedBuildingSlug: matchedBuilding?.slug ?? null,
          operatorKnown: matchedBuilding?.operatorKnown ?? false,
          servicedLanguage: language,
          timezone: timezoneForCountry(payload.countryOfResidence),
        };
      }

      return {
        tier: "qualified",
        reasonCodes: [...baseReasons, "near_term_rental_or_mixed"],
        atlasMatch,
        matchedBuildingSlug: matchedBuilding?.slug ?? null,
        operatorKnown: matchedBuilding?.operatorKnown ?? false,
        servicedLanguage: language,
        timezone: timezoneForCountry(payload.countryOfResidence),
      };
    }

    return {
      tier: "qualified",
      reasonCodes: [...baseReasons, "rental_or_mixed_later_timeline"],
      atlasMatch,
      matchedBuildingSlug: matchedBuilding?.slug ?? null,
      operatorKnown: matchedBuilding?.operatorKnown ?? false,
      servicedLanguage: language,
      timezone: timezoneForCountry(payload.countryOfResidence),
    };
  }

  if (payload.useMix === "personal-led" || payload.timeline === "exploring") {
    return {
      tier: "soft",
      reasonCodes: [...baseReasons, "personal_or_exploring"],
      atlasMatch,
      matchedBuildingSlug: matchedBuilding?.slug ?? null,
      operatorKnown: matchedBuilding?.operatorKnown ?? false,
      servicedLanguage: language,
      timezone: timezoneForCountry(payload.countryOfResidence),
    };
  }

  return {
    tier: "qualified",
    reasonCodes: [...baseReasons, "default_qualified"],
    atlasMatch,
    matchedBuildingSlug: matchedBuilding?.slug ?? null,
    operatorKnown: matchedBuilding?.operatorKnown ?? false,
    servicedLanguage: language,
    timezone: timezoneForCountry(payload.countryOfResidence),
  };
}

export function leadScoreFromClassification(
  payload: V7LeadRequest,
  classification: LeadClassification,
): LeadScore {
  const tierToPoints: Record<V7LeadTier, number> = {
    high: 90,
    qualified: 65,
    soft: 30,
    deflect: 0,
  };
  const stage =
    classification.tier === "high" || classification.tier === "qualified"
      ? "qualified"
      : "nurture";

  return {
    tier: classification.tier,
    stage,
    points: tierToPoints[classification.tier],
    reasons: [
      ...classification.reasonCodes,
      `building_or_area_${normalizeSearchText(payload.buildingOrArea)}`,
    ],
  };
}

export function pathLabel(customerState: CustomerState): string {
  if (customerState === "buying") {
    return "Buying";
  }

  if (customerState === "i-own") {
    return "I own here";
  }

  return "Selling";
}
