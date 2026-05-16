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

export const leadRequestSchema = z.object({
  idempotencyKey: z.string().min(16).max(120),
  profile: z.object({
    country: z.string().length(2).transform((value) => value.toUpperCase()),
    trigger: leadTriggerSchema,
    openQuestion: z.string().trim().max(500).optional(),
  }),
  contact: z
    .object({
      email: z.string().email().optional(),
      name: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(40).optional(),
    })
    .optional(),
  context: z.object({
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
      .optional(),
  }),
  consent: z.object({
    marketing: z.boolean().default(false),
  }),
});

export type LeadRequest = z.infer<typeof leadRequestSchema>;
export type LeadTrigger = z.infer<typeof leadTriggerSchema>;
export type LeadTier = z.infer<typeof leadTierSchema>;
export type LeadStage = z.infer<typeof leadStageSchema>;

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
  "AR",
  "BR",
  "MX",
  "VE",
  "CO",
  "CL",
  "IL",
  "UY",
  "PE",
  "EC",
]);

export function scoreLead(payload: LeadRequest): LeadScore {
  const reasons: string[] = [];
  let points = 0;

  if (highIntentTriggers.has(payload.profile.trigger)) {
    points += 35;
    reasons.push("high_intent_trigger");
  }

  if (foreignPriorityCountries.has(payload.profile.country)) {
    points += 25;
    reasons.push("foreign_priority_country");
  }

  if (payload.context.buildingSlug || payload.context.unitSlug) {
    points += 20;
    reasons.push("building_or_unit_context");
  }

  const openQuestion = payload.profile.openQuestion ?? "";
  if (openQuestion.length >= 28) {
    points += 20;
    reasons.push("specific_open_question");
  } else if (openQuestion.length > 0) {
    points += 8;
    reasons.push("some_open_question");
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
