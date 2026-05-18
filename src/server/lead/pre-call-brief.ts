import {
  isFunnelLeadRequest,
  isV7LeadRequest,
  type LeadRequest,
  type LeadScore,
} from "@/server/lead/schema";

type LeadSubmissionForBrief = Readonly<{
  id: string;
  payload: LeadRequest;
  score: LeadScore;
}>;

function clean(value: string | undefined): string {
  return (value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
}

function fallback(value: string | undefined, label = "Not provided"): string {
  const cleaned = clean(value);
  return cleaned.length > 0 ? cleaned : label;
}

function quoteForMarkdown(value: string): string {
  const cleaned = clean(value);
  if (cleaned.length === 0) {
    return "> Not provided";
  }

  return cleaned
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

function suggestedTalkingPoints(payload: LeadRequest): string[] {
  if (isV7LeadRequest(payload)) {
    return [
      `Start with the path: ${payload.customerState}.`,
      `Use the building or area they named: ${payload.buildingOrArea}.`,
      `Frame use mix and timing together: ${payload.useMix}; ${payload.timeline}.`,
      "Keep the first reply short and avoid claims that need source verification.",
    ];
  }

  if (!isFunnelLeadRequest(payload)) {
    return [
      "Clarify whether this is a buy, sell, or ownership-operation question.",
      "Ask for the building or area if it was not included.",
      "Keep the first reply short and route to a focused call only if context is clear.",
    ];
  }

  if (payload.intent === "buying") {
    return [
      `Start with the target: ${payload.buyer.targetAreaOrBuilding}.`,
      `Frame the budget and timing together: ${payload.buyer.budgetRange}; ${payload.buyer.timeline}.`,
      `Ask what would make them walk away, then compare that against the building rules and operating friction.`,
      `Confirm how they expect to buy: ${payload.buyer.financingPosture}.`,
    ];
  }

  return [
    `Start with the property: ${payload.seller.buildingUnit}.`,
    `Ask why the timing matters now: ${payload.seller.timeline}.`,
    `Probe the main pain point before discussing price: ${payload.seller.pain}.`,
    `Clarify whether the unit is already listed: ${payload.seller.currentlyListed ? "yes" : "no"}.`,
  ];
}

function intentSummary(payload: LeadRequest): string {
  if (isV7LeadRequest(payload)) {
    return [
      `Path: ${payload.customerState}.`,
      `Building/area: ${payload.buildingOrArea}.`,
      `Use mix: ${payload.useMix}.`,
      `Timeline: ${payload.timeline}.`,
      `Budget: ${payload.budgetBand ?? "not provided"}.`,
    ].join(" ");
  }

  if (!isFunnelLeadRequest(payload)) {
    return `Legacy lead trigger: ${payload.profile.trigger}.`;
  }

  if (payload.intent === "buying") {
    return [
      "Intent: buying.",
      `Target area/building: ${payload.buyer.targetAreaOrBuilding}.`,
      `Budget range: ${payload.buyer.budgetRange}.`,
      `Timeline: ${payload.buyer.timeline}.`,
      `Likely purchase posture: ${payload.buyer.financingPosture}.`,
    ].join(" ");
  }

  return [
    "Intent: selling.",
    `Building/unit: ${payload.seller.buildingUnit}.`,
    `Expected price: ${payload.seller.expectedPrice}.`,
    `Timeline: ${payload.seller.timeline}.`,
    `Currently listed: ${payload.seller.currentlyListed ? "yes" : "no"}.`,
  ].join(" ");
}

function painOrGoal(payload: LeadRequest): string {
  if (isV7LeadRequest(payload)) {
    return fallback(payload.mainConcern ?? undefined, "No stated concern yet.");
  }

  if (!isFunnelLeadRequest(payload)) {
    return fallback(payload.profile.openQuestion, "No stated question yet.");
  }

  if (payload.intent === "buying") {
    return `They want to avoid: ${payload.buyer.avoidance}.`;
  }

  return `The main issue is ${payload.seller.pain}; expected price context is ${payload.seller.expectedPrice}.`;
}

function callUsefulness(payload: LeadRequest): string {
  if (isV7LeadRequest(payload)) {
    return payload.mainConcern ?? "";
  }

  if (isFunnelLeadRequest(payload)) {
    return payload.callUsefulnessText;
  }

  return payload.profile.openQuestion ?? "";
}

export function generatePreCallBrief(
  leadSubmission: LeadSubmissionForBrief,
): string {
  const {id, payload, score} = leadSubmission;
  const contact = payload.contact;
  const email = contact?.email ?? "Not provided";
  const name = contact?.name ?? "Not provided";
  const whatsapp = contact?.whatsapp ?? contact?.phone ?? "Not provided";
  const country = isV7LeadRequest(payload)
    ? payload.countryOfResidence
    : payload.profile.country;
  const talkingPoints = suggestedTalkingPoints(payload)
    .map((point) => `- ${point}`)
    .join("\n");

  return `# Room 305 pre-call brief

Lead ID: ${id}
Tier: ${score.tier.toUpperCase()} (${score.points} points)
Stage: ${score.stage}

## Who they are

Name: ${fallback(name)}
Email: ${fallback(email)}
Country: ${fallback(country)}
WhatsApp: ${fallback(whatsapp)}

This lead came through the public funnel and should be treated as a short-context call, not a broad intake. The first response should confirm the decision they are trying to make, then keep the next step narrow enough that the person feels guided instead of processed.

## Intent and key context

${intentSummary(payload)}

Source URL: ${fallback(payload.context.sourceUrl)}
Locale: ${payload.context.locale}

## Their pain or goal

${painOrGoal(payload)}

The useful signal is not only the stated property context. It is what they are trying to avoid, where the timing pressure sits, and whether Room 305 can add judgment before the person spends more time sorting the building alone.

## What would make the call useful

${quoteForMarkdown(callUsefulness(payload))}

Use their words in the opening reply. If they are vague, ask one clarifying question before suggesting a call. If they are specific, prepare one building-context note before the call so the first conversation is not generic.

## Suggested talking points

${talkingPoints}

## Reminders for Isaac

- Do not make brokerage-service claims before Stage 0 is cleared.
- Do not mention specific returns, revenue, yield, or owner financials unless the source packet and approved private context support it.
- Use Sample D voice: operating truth, warm pronouns, no empty adjectives.
- Close in Sample E register: make the next step feel lighter, not louder.
- It is acceptable to say early that a building or timing is not a fit. That is part of the trust signal.
`;
}
