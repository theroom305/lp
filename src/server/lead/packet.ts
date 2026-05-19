import {
  corridorBuildings,
  getCorridorBuildingBySlug,
} from "@/content/building-registry";
import type {LeadClassification} from "@/server/lead/scoring";
import {pathLabel} from "@/server/lead/scoring";
import type {
  BudgetBand,
  HoldHorizon,
  UseMix,
  V7LeadRequest,
  V7LeadTier,
  V7Timeline,
} from "@/server/lead/schema";

type LeadPacketInput = Readonly<{
  id: string;
  payload: V7LeadRequest;
  classification: LeadClassification;
}>;

const useMixLabels: Record<UseMix, string> = {
  "personal-led": "Mostly personal use",
  mixed: "Mixed: personal + rental income",
  "rental-led": "Mostly rental income",
  unsure: "Not sure yet",
};

const holdHorizonLabels: Record<HoldHorizon, string> = {
  "under-2y": "Under 2 years",
  "2-5y": "2 to 5 years",
  "5-plus": "5+ years",
  opportunistic: "Opportunistic exit",
};

const timelineLabels: Record<V7Timeline, string> = {
  "lt-3mo": "Within 3 months",
  "3-12mo": "3 to 12 months",
  "12-24mo": "12 to 24 months",
  exploring: "Just exploring",
};

const budgetBandLabels: Record<BudgetBand, string> = {
  "under-500k": "Under $500K",
  "500k-1m": "$500K to $1M",
  "1m-2m": "$1M to $2M",
  "2m-plus": "$2M+",
};

function sanitize(value: string | null | undefined): string {
  return (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}

function countryName(country: string | null | undefined, locale: "en" | "es"): string {
  const clean = sanitize(country);

  if (clean.length === 0) {
    return "-";
  }

  if (/^[a-z]{2}$/i.test(clean)) {
    const displayNames = new Intl.DisplayNames([locale], {type: "region"});
    return displayNames.of(clean.toUpperCase()) ?? clean;
  }

  return clean;
}

function atlasMatchInline(classification: LeadClassification): string {
  return classification.atlasMatch && classification.matchedBuildingSlug
    ? ` · atlas match: ${classification.matchedBuildingSlug}`
    : "";
}

function advisorInline(payload: V7LeadRequest): string {
  if (!payload.advisorInvolved) {
    return "No";
  }

  const name = sanitize(payload.advisorName);
  return name.length > 0 ? `Yes · ${name}` : "Yes";
}

function concernQuoted(payload: V7LeadRequest): string {
  const concern = sanitize(payload.mainConcern);
  return concern.length > 0 ? `"${concern}"` : "-";
}

function buildingContextBlock(classification: LeadClassification): string {
  if (!classification.atlasMatch || !classification.matchedBuildingSlug) {
    return [
      "No atlas match for input. Treat as area-level inquiry.",
      "Probable submarket: none",
    ].join("\n");
  }

  const building = getCorridorBuildingBySlug(classification.matchedBuildingSlug);

  if (!building) {
    return [
      "No atlas match for input. Treat as area-level inquiry.",
      "Probable submarket: none",
    ].join("\n");
  }

  const base = `${building.name} · ${building.verificationLabel} · Cadence: ${building.cadenceLabel}`;

  if (classification.operatorKnown) {
    return [
      base,
    "Room 305 relationship: Beachwalk is the building Isaac knows best; public unit count withheld pending Guesty and Isaac source sign-off",
    "Watch: internal relationship context. Do not imply public unit count, yield, or management service.",
    ].join("\n");
  }

  return [
    base,
    "Room 305 relationship: none confirmed",
    "We can review this building too - declaration lookup recommended",
  ].join("\n");
}

function leadAngle(
  payload: V7LeadRequest,
  classification: LeadClassification,
): string {
  if (
    classification.tier === "high" &&
    classification.atlasMatch &&
    classification.operatorKnown &&
    (payload.useMix === "mixed" || payload.useMix === "rental-led")
  ) {
    return "Lead with Beachwalk-specific context and the rental-rule specifics.";
  }

  if (
    (classification.tier === "high" || classification.tier === "qualified") &&
    (payload.useMix === "mixed" || payload.useMix === "rental-led") &&
    !classification.operatorKnown
  ) {
    return "Lead with our methodology — how we'd assess this building's rental posture from declaration + HOA.";
  }

  if (classification.tier === "qualified" && payload.useMix === "personal-led") {
    return "Lead with the lifestyle question — what they're hoping to use it for, and what fit issues might come up.";
  }

  if (payload.customerState === "selling") {
    return "Lead with their timeline and what they're trying to accomplish next.";
  }

  if (payload.customerState === "i-own") {
    return "Lead with current operator pain — what's making them rethink.";
  }

  if (classification.tier === "soft") {
    return "Lead with two open questions to learn more before pitching anything.";
  }

  if (classification.tier === "deflect") {
    return "Acknowledge politely and refer out if appropriate. Don't pitch.";
  }

  return "Lead with two open questions to learn more before pitching anything.";
}

function avoidLine(
  payload: V7LeadRequest,
  classification: LeadClassification,
): string {
  if (
    (classification.tier === "high" || classification.tier === "qualified") &&
    (payload.useMix === "mixed" || payload.useMix === "rental-led")
  ) {
    return "Avoid generic luxury language. Avoid promising yields. Avoid implying management services.";
  }

  if (classification.tier === "soft" || payload.useMix === "personal-led") {
    return "Avoid investor pitch. Avoid STR-push. Match their lifestyle framing.";
  }

  if (payload.customerState === "selling") {
    return "Avoid implying we're licensed brokerage (Room 305 LLC is not). Defer commission talk.";
  }

  if (payload.customerState === "i-own") {
    return "Avoid criticizing current operator before knowing the relationship.";
  }

  return "Avoid claims we can't verify.";
}

function slaHours(tier: V7LeadTier): number {
  if (tier === "high") {
    return 4;
  }

  if (tier === "qualified") {
    return 8;
  }

  if (tier === "soft") {
    return 24;
  }

  return 0;
}

export function knownBuildingSlugs(): readonly string[] {
  return corridorBuildings.map((building) => building.slug);
}

export function generateLeadPacket({
  id,
  payload,
  classification,
}: LeadPacketInput): string {
  const locale = payload.context.locale;
  const whatsapp = sanitize(payload.contact.whatsapp ?? payload.contact.phone);
  const whatsappInline = whatsapp.length > 0 ? ` · ${whatsapp}` : "";
  const language = classification.servicedLanguage;

  return `LEAD #${id} | ${classification.tier.toUpperCase()}
${sanitize(payload.contact.name)} (${countryName(payload.countryOfResidence, locale)}, ${language}) · ${sanitize(payload.contact.email)}${whatsappInline}

WHAT THEY WANT
- Path: ${pathLabel(payload.customerState)}
- Building/area: "${sanitize(payload.buildingOrArea)}"${atlasMatchInline(classification)}
- Use mix: ${useMixLabels[payload.useMix]}
- Timeline: ${timelineLabels[payload.timeline]}
- Hold horizon: ${payload.holdHorizon ? holdHorizonLabels[payload.holdHorizon] : "-"}
- Budget: ${payload.budgetBand ? budgetBandLabels[payload.budgetBand] : "-"}
- Advisor: ${advisorInline(payload)}
- Main concern: ${concernQuoted(payload)}

BUILDING CONTEXT
${buildingContextBlock(classification)}

SUGGESTED FIRST-REPLY ANGLE
- Lead with: ${leadAngle(payload, classification)}
- Avoid: ${avoidLine(payload, classification)}

CLASSIFICATION
- Tier: ${classification.tier.toUpperCase()}
- Reason: ${classification.reasonCodes.join(", ")}

LINKS
- SLA clock: starts now (${slaHours(classification.tier)} business hours)
`;
}
