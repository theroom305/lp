import {env} from "@/server/env";
import {logger} from "@/server/logger";
import type {FunnelLeadRequest, LeadRequest, LeadScore} from "@/server/lead/schema";
import {isFunnelLeadRequest} from "@/server/lead/schema";

export type LeadNotificationResult = Readonly<{
  status: "dry-run" | "sent";
  recipients: string[];
}>;

type LeadNotificationInput = Readonly<{
  leadId: string;
  payload: LeadRequest;
  score: LeadScore;
  preCallBriefMarkdown: string;
}>;

function leadSubject(payload: LeadRequest, score: LeadScore): string {
  if (isFunnelLeadRequest(payload)) {
    const noun = payload.intent === "buying" ? "buyer" : "seller";
    return `Room 305 ${score.tier.toUpperCase()} ${noun} lead`;
  }

  return `Room 305 ${score.tier.toUpperCase()} lead`;
}

function contactLine(payload: FunnelLeadRequest): string {
  if (payload.intent === "buying") {
    return `${payload.contact.name} | ${payload.buyer.targetAreaOrBuilding} | ${payload.buyer.timeline}`;
  }

  return `${payload.contact.name} | ${payload.seller.buildingUnit} | ${payload.seller.timeline}`;
}

function notificationPreview(payload: LeadRequest): string {
  if (!isFunnelLeadRequest(payload)) {
    return `Legacy lead from ${payload.profile.country}`;
  }

  return contactLine(payload);
}

export async function notifyLeadSubmission({
  leadId,
  payload,
  score,
  preCallBriefMarkdown,
}: LeadNotificationInput): Promise<LeadNotificationResult> {
  const recipients = [
    env.LEAD_NOTIFY_PRIMARY,
    env.LEAD_NOTIFY_SECONDARY,
  ].filter((recipient): recipient is string => Boolean(recipient));

  if (!env.RESEND_DOMAIN_VERIFIED) {
    logger.info({
      event: "lead.notification.dry_run",
      lead_id: leadId,
      recipients_configured: recipients.length,
      preview: notificationPreview(payload),
    });

    return {
      status: "dry-run",
      recipients,
    };
  }

  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required when RESEND_DOMAIN_VERIFIED=true");
  }

  if (recipients.length === 0) {
    throw new Error("Lead notification recipients are required for production sends");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: `Room 305 <${env.LEAD_NOTIFY_FROM}>`,
      to: recipients,
      subject: leadSubject(payload, score),
      text: preCallBriefMarkdown,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed with ${response.status}: ${body}`);
  }

  logger.info({
    event: "lead.notification.sent",
    lead_id: leadId,
    recipients_count: recipients.length,
  });

  return {
    status: "sent",
    recipients,
  };
}
