import {createHash} from "crypto";

import {getSql} from "@/server/db/client";
import {env} from "@/server/env";
import type {LeadRequest, LeadScore} from "@/server/lead/schema";

type PersistLeadResult = Readonly<{
  leadId: string;
  duplicate: boolean;
  storageMode: "dry-run" | "postgres";
}>;

function leadIdFromKey(idempotencyKey: string): string {
  const digest = createHash("sha256").update(idempotencyKey).digest("hex");
  return `lead_${digest.slice(0, 20)}`;
}

export async function persistLeadSubmission(
  payload: LeadRequest,
  score: LeadScore,
): Promise<PersistLeadResult> {
  const leadId = leadIdFromKey(payload.idempotencyKey);

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
      stage
    )
    values (
      ${leadId},
      ${payload.idempotencyKey},
      ${JSON.stringify(payload)}::jsonb,
      ${JSON.stringify(score)}::jsonb,
      ${score.tier},
      ${score.stage}
    )
    on conflict (idempotency_key)
    do update set
      duplicate_count = lead_submissions.duplicate_count + 1,
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
