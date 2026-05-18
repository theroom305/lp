import {z} from "zod";

export const leadTriggerSchema = z.enum([
  "buy_self",
  "buy_investment",
  "sell_unit",
  "exploring",
  "better_operations",
]);

export const leadTierSchema = z.enum(["a", "b", "c"]);

export const leadStageSchema = z.enum([
  "new",
  "needs-triage",
  "qualified",
  "discovery-booked",
  "nurture",
]);

export const leadIntentSchema = z.enum(["buying", "selling"]);

const cleanText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

const profileSchema = z
  .object({
    country: cleanText(2, 80),
    trigger: leadTriggerSchema,
    openQuestion: z.string().trim().max(700).optional(),
  })
  .strict();

const legacyContactSchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(40).optional(),
    whatsapp: z.string().trim().max(40).optional(),
  })
  .strict()
  .optional();

const requiredContactSchema = z
  .object({
    email: z.string().email(),
    name: cleanText(2, 120),
    phone: z.string().trim().max(40).optional(),
    whatsapp: z.string().trim().max(40).optional(),
  })
  .strict();

const contextSchema = z
  .object({
    locale: z.enum(["en", "es"]),
    sourceUrl: z.string().url().optional(),
    referrer: z.string().url().optional(),
    sessionId: z.string().min(8).max(120).optional(),
    buildingSlug: z.string().max(80).optional(),
    unitSlug: z.string().max(80).optional(),
    utm: z
      .object({
        source: z.string().max(120).optional(),
        medium: z.string().max(120).optional(),
        campaign: z.string().max(120).optional(),
        content: z.string().max(120).optional(),
        term: z.string().max(120).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const consentSchema = z
  .object({
    marketing: z.boolean().default(false),
  })
  .strict();

export const financingPostureSchema = z.enum(["cash", "financing", "unsure"]);
export const sellerPainSchema = z.enum([
  "price",
  "tenant",
  "hoa",
  "broker",
  "uncertainty",
  "other",
]);

export const buyerLeadFieldsSchema = z
  .object({
    targetAreaOrBuilding: cleanText(2, 160),
    budgetRange: cleanText(2, 120),
    timeline: cleanText(2, 120),
    financingPosture: financingPostureSchema,
    avoidance: cleanText(2, 500),
  })
  .strict();

export const sellerLeadFieldsSchema = z
  .object({
    buildingUnit: cleanText(2, 180),
    currentlyListed: z.boolean(),
    timeline: cleanText(2, 120),
    pain: sellerPainSchema,
    expectedPrice: cleanText(2, 120),
  })
  .strict();

const commonFunnelFields = {
  idempotencyKey: z.string().min(16).max(120),
  profile: profileSchema,
  contact: requiredContactSchema,
  context: contextSchema,
  consent: consentSchema,
  callUsefulnessText: cleanText(2, 700),
};

export const buyingLeadRequestSchema = z
  .object({
    ...commonFunnelFields,
    intent: z.literal("buying"),
    buyer: buyerLeadFieldsSchema,
    seller: z.null().optional(),
  })
  .strict();

export const sellingLeadRequestSchema = z
  .object({
    ...commonFunnelFields,
    intent: z.literal("selling"),
    buyer: z.null().optional(),
    seller: sellerLeadFieldsSchema,
  })
  .strict();

export const funnelLeadRequestSchema = z.discriminatedUnion("intent", [
  buyingLeadRequestSchema,
  sellingLeadRequestSchema,
]);

export const legacyLeadRequestSchema = z
  .object({
    idempotencyKey: z.string().min(16).max(120),
    profile: profileSchema,
    contact: legacyContactSchema,
    context: contextSchema,
    consent: consentSchema,
  })
  .strict();

export const leadRequestSchema = z.union([
  funnelLeadRequestSchema,
  legacyLeadRequestSchema,
]);

export type LeadRequest = z.infer<typeof leadRequestSchema>;
export type FunnelLeadRequest = z.infer<typeof funnelLeadRequestSchema>;
export type LeadTrigger = z.infer<typeof leadTriggerSchema>;
export type LeadTier = z.infer<typeof leadTierSchema>;
export type LeadStage = z.infer<typeof leadStageSchema>;
export type LeadIntent = z.infer<typeof leadIntentSchema>;

export type LeadScore = Readonly<{
  tier: LeadTier;
  stage: LeadStage;
  points: number;
  reasons: string[];
}>;

export type LeadApiResponse = Readonly<{
  status: "accepted";
  lead: {
    id: string;
    tier: LeadTier;
    stage: LeadStage;
    duplicate: boolean;
  };
  nextAction:
    | {
        kind: "calendar";
        url: string;
      }
    | {
        kind: "nurture";
      };
  preCallBrief: {
    generated: boolean;
    notification: "dry-run" | "sent" | "skipped";
  };
}>;

export type LeadApiError = Readonly<{
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}>;

const highIntentTriggers: ReadonlySet<LeadTrigger> = new Set([
  "buy_self",
  "buy_investment",
  "sell_unit",
  "better_operations",
]);

const foreignPriorityCountries = new Set([
  "ar",
  "argentina",
  "br",
  "brazil",
  "mx",
  "mexico",
  "ve",
  "venezuela",
  "co",
  "colombia",
  "cl",
  "chile",
  "il",
  "israel",
  "uy",
  "uruguay",
  "pe",
  "peru",
  "ec",
  "ecuador",
]);

export function isFunnelLeadRequest(
  payload: LeadRequest,
): payload is FunnelLeadRequest {
  return "intent" in payload;
}

function normalizedCountry(country: string): string {
  return country.trim().toLowerCase();
}

export function scoreLead(payload: LeadRequest): LeadScore {
  const reasons: string[] = [];
  let points = 0;

  if (highIntentTriggers.has(payload.profile.trigger)) {
    points += 30;
    reasons.push("high_intent_trigger");
  }

  if (foreignPriorityCountries.has(normalizedCountry(payload.profile.country))) {
    points += 20;
    reasons.push("foreign_priority_country");
  }

  if (payload.context.buildingSlug || payload.context.unitSlug) {
    points += 15;
    reasons.push("building_or_unit_context");
  }

  const openQuestion = payload.profile.openQuestion ?? "";
  const callUsefulnessText = isFunnelLeadRequest(payload)
    ? payload.callUsefulnessText
    : openQuestion;

  if (callUsefulnessText.length >= 28) {
    points += 20;
    reasons.push("specific_call_context");
  } else if (callUsefulnessText.length > 0) {
    points += 8;
    reasons.push("some_call_context");
  }

  if (isFunnelLeadRequest(payload)) {
    points += 10;
    reasons.push(`intent_${payload.intent}`);

    if (payload.intent === "buying") {
      points += 10;
      reasons.push("buyer_budget_and_timeline");
    } else {
      points += 10;
      reasons.push("seller_property_and_timeline");
    }

    if (payload.contact.whatsapp) {
      points += 5;
      reasons.push("whatsapp_available");
    }
  }

  if (payload.profile.trigger === "exploring" && points < 45) {
    return {
      tier: "c",
      stage: "nurture",
      points,
      reasons: [...reasons, "exploring_low_intent"],
    };
  }

  if (points >= 70) {
    return {
      tier: "a",
      stage: "qualified",
      points,
      reasons,
    };
  }

  if (points >= 40) {
    return {
      tier: "b",
      stage: "needs-triage",
      points,
      reasons,
    };
  }

  return {
    tier: "c",
    stage: "nurture",
    points,
    reasons,
  };
}
