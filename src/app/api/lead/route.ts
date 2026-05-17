import {NextRequest} from "next/server";
import {ZodError} from "zod";

import {env} from "@/server/env";
import {logger} from "@/server/logger";
import {persistLeadSubmission} from "@/server/lead/repository";
import {
  leadRequestSchema,
  scoreLead,
  type LeadApiError,
  type LeadApiResponse,
} from "@/server/lead/schema";
import {JsonBodyError, readJsonBody} from "@/server/http/request-body";
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
    const scored = scoreLead(payload);
    const result = await persistLeadSubmission(payload, scored);

    logger.info({
      event: "lead.submission.accepted",
      lead_id: result.leadId,
      idempotency_key: payload.idempotencyKey,
      tier: scored.tier,
      stage: scored.stage,
      trigger: payload.profile.trigger,
      locale: payload.context.locale,
      storage_mode: result.storageMode,
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
        scored.tier === "c"
          ? {kind: "nurture"}
          : {
              kind: "calendar",
              url: env.NEXT_PUBLIC_CALENDAR_URL,
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
