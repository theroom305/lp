import {env} from "@/server/env";
import {logger} from "@/server/logger";
import type {
  FunnelLeadRequest,
  LeadRequest,
  LeadScore,
  V7LeadRequest,
} from "@/server/lead/schema";
import {isFunnelLeadRequest, isV7LeadRequest} from "@/server/lead/schema";

export type LeadNotificationResult = Readonly<{
  status: "dry-run" | "sent";
  recipients: string[];
  reasonCodes: string[];
}>;

export type LeadNotificationPreflight = Readonly<{
  mode: "dry-run" | "live";
  reasonCodes: string[];
  recipients: string[];
  from: string | null;
  replyTo: string | null;
}>;

type LeadNotificationInput = Readonly<{
  leadId: string;
  payload: LeadRequest;
  score: LeadScore;
  preCallBriefMarkdown: string;
}>;

function leadSubject(payload: LeadRequest, score: LeadScore): string {
  if (isV7LeadRequest(payload)) {
    return `Room 305 ${score.tier.toUpperCase()} ${payload.customerState} lead`;
  }

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

function v7ContactLine(payload: V7LeadRequest): string {
  return `${payload.contact.name} | ${payload.customerState} | ${payload.buildingOrArea} | ${payload.timeline}`;
}

function notificationPreview(payload: LeadRequest): string {
  if (isV7LeadRequest(payload)) {
    return v7ContactLine(payload);
  }

  if (!isFunnelLeadRequest(payload)) {
    return `Legacy lead from ${payload.profile.country}`;
  }

  return contactLine(payload);
}

export function leadNotificationPreflight(): LeadNotificationPreflight {
  const recipients = [
    env.LEAD_NOTIFY_PRIMARY,
    env.LEAD_NOTIFY_SECONDARY,
  ].filter((recipient): recipient is string => Boolean(recipient));
  const reasonCodes: string[] = [];

  if (!env.RESEND_API_KEY) {
    reasonCodes.push("missing_resend_api_key");
  }

  if (!env.RESEND_DOMAIN_VERIFIED) {
    reasonCodes.push("resend_domain_not_verified");
  }

  if (!env.LEAD_NOTIFY_PRIMARY) {
    reasonCodes.push("missing_lead_notify_primary");
  }

  if (!env.LEAD_NOTIFY_FROM) {
    reasonCodes.push("missing_lead_notify_from");
  }

  return {
    mode: reasonCodes.length === 0 ? "live" : "dry-run",
    reasonCodes,
    recipients,
    from: env.LEAD_NOTIFY_FROM ?? null,
    replyTo: env.LEAD_NOTIFY_REPLY_TO ?? env.LEAD_NOTIFY_PRIMARY ?? null,
  };
}

export async function notifyLeadSubmission({
  leadId,
  payload,
  score,
  preCallBriefMarkdown,
}: LeadNotificationInput): Promise<LeadNotificationResult> {
  const preflight = leadNotificationPreflight();

  if (preflight.mode === "dry-run") {
    logger.warn({
      event: "lead.notification.dry_run",
      lead_id: leadId,
      recipients_configured: preflight.recipients.length,
      reason_codes: preflight.reasonCodes,
      preview: notificationPreview(payload),
    });

    return {
      status: "dry-run",
      recipients: preflight.recipients,
      reasonCodes: preflight.reasonCodes,
    };
  }

  if (!env.RESEND_API_KEY || !preflight.from || preflight.recipients.length === 0) {
    throw new Error("Lead notification preflight reported live with missing env.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: `Room 305 <${preflight.from}>`,
      to: preflight.recipients,
      subject: leadSubject(payload, score),
      text: preCallBriefMarkdown,
      reply_to: preflight.replyTo,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed with ${response.status}: ${body}`);
  }

  logger.info({
    event: "lead.notification.sent",
    lead_id: leadId,
    recipients_count: preflight.recipients.length,
  });

  return {
    status: "sent",
    recipients: preflight.recipients,
    reasonCodes: [],
  };
}
