import {NextRequest} from "next/server";
import {ZodError} from "zod";

import {env} from "@/server/env";
import {logger} from "@/server/logger";
import {JsonBodyError, readJsonBody} from "@/server/http/request-body";
import {writeLeadEvent} from "@/server/lead/events";
import {generatePreCallBrief} from "@/server/lead/pre-call-brief";
import {notifyLeadSubmission} from "@/server/lead/notification";
import {generateLeadPacket} from "@/server/lead/packet";
import {
  leadIdFromKey,
  persistLeadSubmission,
  updateLeadNotificationStatus,
} from "@/server/lead/repository";
import {
  classifyLead,
  leadScoreFromClassification,
  type LeadClassification,
} from "@/server/lead/scoring";
import {
  isFunnelLeadRequest,
  isV7LeadRequest,
  leadRequestSchema,
  scoreLead,
  type LeadApiError,
  type LeadApiResponse,
} from "@/server/lead/schema";
import {checkRateLimit, rateLimitHeaders} from "@/server/rate-limit/check";

export const runtime = "nodejs";

function jsonResponse<T>(body: T, init?: ResponseInit): Response {
  return Response.json(body, init);
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  details: Record<string, unknown> = {},
): Response {
  const body: LeadApiError = {
    error: {
      code,
      message,
      details,
    },
  };

  return jsonResponse(body, {status});
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const rateLimit = await checkRateLimit(request, {
      scope: "api:lead",
      limit: 8,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return jsonResponse(
        {
          error: {
            code: rateLimit.reason,
            message:
              rateLimit.reason === "rate_limited"
                ? "Too many lead submissions. Try again shortly."
                : "Rate limiter unavailable.",
            details: {},
          },
        },
        {
          status: rateLimit.reason === "rate_limited" ? 429 : 503,
          headers: rateLimitHeaders(rateLimit, 8),
        },
      );
    }

    const payload = leadRequestSchema.parse(await readJsonBody(request, 12_000));
    const leadId = leadIdFromKey(payload.idempotencyKey);
    let classification: LeadClassification | null = null;
    const scored = isV7LeadRequest(payload)
      ? (() => {
          classification = classifyLead(payload);
          return leadScoreFromClassification(payload, classification);
        })()
      : scoreLead(payload);
    const preCallBriefMarkdown =
      isV7LeadRequest(payload) && classification
        ? generateLeadPacket({
            id: leadId,
            payload,
            classification,
          })
        : generatePreCallBrief({
            id: leadId,
            payload,
            score: scored,
          });
    const result = await persistLeadSubmission(payload, scored, {
      preCallBriefMarkdown,
      notificationStatus: "pending",
      classification: classification ?? undefined,
    });
    let notificationStatus: "dry-run" | "sent" | "skipped" = "skipped";

    if (classification && !result.duplicate) {
      await writeLeadEvent({
        leadId: result.leadId,
        eventType: "classified",
        payload: {
          tier: classification.tier,
          reason_codes: classification.reasonCodes,
          atlas_match: classification.atlasMatch,
          matched_building_slug: classification.matchedBuildingSlug,
        },
      });
    }

    if (!result.duplicate) {
      try {
        const notification = await notifyLeadSubmission({
          leadId: result.leadId,
          payload,
          score: scored,
          preCallBriefMarkdown,
        });
        notificationStatus = notification.status;
        await updateLeadNotificationStatus(result.leadId, notification.status);

        if (classification) {
          await writeLeadEvent({
            leadId: result.leadId,
            eventType: "notification_sent",
            payload: {
              mode: notification.status === "sent" ? "live" : "dry-run",
              tier: classification.tier,
              reason_codes: notification.reasonCodes,
            },
          });
        }
      } catch (notificationError) {
        await updateLeadNotificationStatus(result.leadId, "failed");

        if (classification) {
          await writeLeadEvent({
            leadId: result.leadId,
            eventType: "notification_failed",
            payload: {
              mode: "live",
              reason_code:
                notificationError instanceof Error
                  ? notificationError.message
                  : "unknown",
            },
          });
        }

        throw notificationError;
      }
    } else {
      notificationStatus = "skipped";

      if (classification) {
        await writeLeadEvent({
          leadId: result.leadId,
          eventType: "duplicate_submission",
          payload: {
            tier: classification.tier,
          },
        });
      }
    }

    logger.info({
      event: "lead.submission.accepted",
      lead_id: result.leadId,
      idempotency_key: payload.idempotencyKey,
      tier: scored.tier,
      stage: scored.stage,
      trigger: isV7LeadRequest(payload) ? "v7" : payload.profile.trigger,
      intent: isV7LeadRequest(payload)
        ? payload.customerState
        : isFunnelLeadRequest(payload)
          ? payload.intent
          : "legacy",
      locale: payload.context.locale,
      storage_mode: result.storageMode,
      notification_status: notificationStatus,
    });

    const response: LeadApiResponse = {
      status: "accepted",
      lead: {
        id: result.leadId,
        tier: scored.tier,
        stage: scored.stage,
        duplicate: result.duplicate,
      },
      nextAction:
        scored.tier === "c" ||
        scored.tier === "soft" ||
        scored.tier === "deflect"
          ? {kind: "nurture"}
          : {
              kind: "calendar",
              url: env.NEXT_PUBLIC_CALENDAR_URL,
            },
      preCallBrief: {
        generated: true,
        notification: notificationStatus,
      },
    };

    return jsonResponse(response, {status: result.duplicate ? 200 : 201});
  } catch (error) {
    if (error instanceof JsonBodyError) {
      return errorResponse(error.code, error.message, error.status);
    }

    if (error instanceof ZodError) {
      return errorResponse("validation_failed", "Invalid lead payload.", 400, {
        issues: error.issues,
      });
    }

    logger.error({
      event: "lead.submission.failed",
      reason: error instanceof Error ? error.message : "unknown",
    });

    return errorResponse("internal_error", "Lead submission failed.", 500);
  }
}
