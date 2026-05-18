import {createHash} from "crypto";

import {getSql} from "@/server/db/client";
import {env} from "@/server/env";
import {
  isFunnelLeadRequest,
  type LeadRequest,
  type LeadScore,
} from "@/server/lead/schema";

type PersistLeadResult = Readonly<{
  leadId: string;
  duplicate: boolean;
  storageMode: "dry-run" | "postgres";
}>;

type PersistLeadOptions = Readonly<{
  preCallBriefMarkdown?: string;
  notificationStatus?: string;
}>;

export function leadIdFromKey(idempotencyKey: string): string {
  const digest = createHash("sha256").update(idempotencyKey).digest("hex");
  return `lead_${digest.slice(0, 20)}`;
}

function normalizedLeadColumns(payload: LeadRequest) {
  if (!isFunnelLeadRequest(payload)) {
    return {
      intent: null,
      country: payload.profile.country,
      contactName: payload.contact?.name ?? null,
      contactEmail: payload.contact?.email ?? null,
      contactWhatsapp: payload.contact?.whatsapp ?? payload.contact?.phone ?? null,
      targetAreaOrBuilding: null,
      budgetRange: null,
      buyerTimeline: null,
      financingPosture: null,
      buyerAvoidance: null,
      buildingUnit: null,
      currentlyListed: null,
      sellerTimeline: null,
      sellerPain: null,
      expectedPrice: null,
      callUsefulnessText: payload.profile.openQuestion ?? null,
    };
  }

  return {
    intent: payload.intent,
    country: payload.profile.country,
    contactName: payload.contact.name,
    contactEmail: payload.contact.email,
    contactWhatsapp: payload.contact.whatsapp ?? payload.contact.phone ?? null,
    targetAreaOrBuilding:
      payload.intent === "buying" ? payload.buyer.targetAreaOrBuilding : null,
    budgetRange: payload.intent === "buying" ? payload.buyer.budgetRange : null,
    buyerTimeline: payload.intent === "buying" ? payload.buyer.timeline : null,
    financingPosture:
      payload.intent === "buying" ? payload.buyer.financingPosture : null,
    buyerAvoidance: payload.intent === "buying" ? payload.buyer.avoidance : null,
    buildingUnit: payload.intent === "selling" ? payload.seller.buildingUnit : null,
    currentlyListed:
      payload.intent === "selling" ? payload.seller.currentlyListed : null,
    sellerTimeline: payload.intent === "selling" ? payload.seller.timeline : null,
    sellerPain: payload.intent === "selling" ? payload.seller.pain : null,
    expectedPrice: payload.intent === "selling" ? payload.seller.expectedPrice : null,
    callUsefulnessText: payload.callUsefulnessText,
  };
}

export async function persistLeadSubmission(
  payload: LeadRequest,
  score: LeadScore,
  options: PersistLeadOptions = {},
): Promise<PersistLeadResult> {
  const leadId = leadIdFromKey(payload.idempotencyKey);
  const normalized = normalizedLeadColumns(payload);

  if (env.LEAD_STORAGE_MODE === "dry-run") {
    return {
      leadId,
      duplicate: false,
      storageMode: "dry-run",
    };
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when LEAD_STORAGE_MODE=postgres");
  }

  const sql = getSql();
  const rows = await sql`
    insert into lead_submissions (
      id,
      idempotency_key,
      payload,
      score,
      tier,
      stage,
      intent,
      country,
      contact_name,
      contact_email,
      contact_whatsapp,
      target_area_or_building,
      budget_range,
      buyer_timeline,
      financing_posture,
      buyer_avoidance,
      building_unit,
      currently_listed,
      seller_timeline,
      seller_pain,
      expected_price,
      call_usefulness_text,
      pre_call_brief_markdown,
      notification_status
    )
    values (
      ${leadId},
      ${payload.idempotencyKey},
      ${JSON.stringify(payload)}::jsonb,
      ${JSON.stringify(score)}::jsonb,
      ${score.tier},
      ${score.stage},
      ${normalized.intent},
      ${normalized.country},
      ${normalized.contactName},
      ${normalized.contactEmail},
      ${normalized.contactWhatsapp},
      ${normalized.targetAreaOrBuilding},
      ${normalized.budgetRange},
      ${normalized.buyerTimeline},
      ${normalized.financingPosture},
      ${normalized.buyerAvoidance},
      ${normalized.buildingUnit},
      ${normalized.currentlyListed},
      ${normalized.sellerTimeline},
      ${normalized.sellerPain},
      ${normalized.expectedPrice},
      ${normalized.callUsefulnessText},
      ${options.preCallBriefMarkdown ?? null},
      ${options.notificationStatus ?? null}
    )
    on conflict (idempotency_key)
    do update set
      duplicate_count = lead_submissions.duplicate_count + 1,
      pre_call_brief_markdown = excluded.pre_call_brief_markdown,
      notification_status = excluded.notification_status,
      updated_at = now()
    returning id, duplicate_count
  `;

  const duplicateCount = Number(rows[0]?.duplicate_count ?? 0);

  return {
    leadId,
    duplicate: duplicateCount > 0,
    storageMode: "postgres",
  };
}

export async function updateLeadNotificationStatus(
  leadId: string,
  notificationStatus: string,
): Promise<void> {
  if (env.LEAD_STORAGE_MODE === "dry-run") {
    return;
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when LEAD_STORAGE_MODE=postgres");
  }

  const sql = getSql();
  await sql`
    update lead_submissions
    set notification_status = ${notificationStatus},
        updated_at = now()
    where id = ${leadId}
  `;
}
