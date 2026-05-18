import {getSql} from "@/server/db/client";
import {env} from "@/server/env";
import {logger} from "@/server/logger";

type LeadEventPayload = Readonly<Record<string, unknown>>;

type WriteLeadEventInput = Readonly<{
  leadId: string;
  eventType: string;
  payload: LeadEventPayload;
}>;

export async function writeLeadEvent({
  leadId,
  eventType,
  payload,
}: WriteLeadEventInput): Promise<void> {
  if (env.LEAD_STORAGE_MODE === "dry-run") {
    logger.info({
      event: "lead.event.dry_run",
      lead_id: leadId,
      event_type: eventType,
      payload,
    });
    return;
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when LEAD_STORAGE_MODE=postgres");
  }

  const sql = getSql();
  await sql`
    insert into lead_events (
      lead_submission_id,
      event_type,
      payload
    )
    values (
      ${leadId},
      ${eventType},
      ${JSON.stringify(payload)}::jsonb
    )
  `;
}
