import {NextRequest} from "next/server";
import {z, ZodError} from "zod";

import {events, tasks} from "../../../../db/schema";
import {enqueueApproval, logAgentAction} from "@/server/agent-infra/enforcement";
import {getDb} from "@/server/db/client";
import {JsonBodyError, readJsonBody} from "@/server/http/request-body";
import {logger} from "@/server/logger";
import {checkRateLimit, rateLimitHeaders} from "@/server/rate-limit/check";
import {memoAdvisorMap} from "@/content/atlas";

export const runtime = "nodejs";

const memoRequestTypeSchema = z.enum([
  "rules",
  "operator",
  "investment_fit",
  "owner_takeover",
]);

const eventRequestSchema = z.discriminatedUnion("eventType", [
  z
    .object({
      eventType: z.literal("memo_request"),
      buildingSlug: z.string().min(1).max(120),
      eventData: z
        .object({
          memo_request_type: memoRequestTypeSchema,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      eventType: z.literal("owner_takeover_intake"),
      buildingSlug: z.string().min(1).max(120),
      eventData: z
        .object({
          current_pm_company: z.string().trim().max(160),
          current_pm_response_time: z.string().trim().max(80),
          projection_actual_gap_pct: z.string().trim().max(80),
          specific_incident: z.string().trim().max(1200),
          exit_terms: z.string().trim().max(800),
          switch_timeline: z.string().trim().max(120),
          desired_differences: z.array(z.string().trim().max(180)).max(3),
        })
        .strict(),
    })
    .strict(),
]);

type EventResponse = Readonly<{
  status: "accepted";
  taskCreated: boolean;
}>;

function errorResponse(
  code: string,
  message: string,
  status: number,
  details: Record<string, unknown> = {},
  headers?: HeadersInit,
): Response {
  return Response.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    {status, headers},
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const rateLimit = await checkRateLimit(request, {
      scope: "api:events",
      limit: 12,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return errorResponse(
        rateLimit.reason,
        rateLimit.reason === "rate_limited"
          ? "Too many event submissions. Try again shortly."
          : "Rate limiter unavailable.",
        rateLimit.reason === "rate_limited" ? 429 : 503,
        {},
        rateLimitHeaders(rateLimit, 12),
      );
    }

    const payload = eventRequestSchema.parse(await readJsonBody(request, 10_000));
    const eventDataBytes = new TextEncoder().encode(
      JSON.stringify(payload.eventData),
    ).length;

    if (eventDataBytes > 4_096) {
      return errorResponse(
        "event_data_too_large",
        "Event data exceeds 4096 bytes.",
        413,
        {maxBytes: 4_096},
      );
    }

    const db = getDb();
    const referrer = request.headers.get("referer") ?? undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const eventData =
      payload.eventType === "memo_request"
        ? {
            memo_request_type: payload.eventData.memo_request_type,
            advisor:
              memoAdvisorMap[payload.eventData.memo_request_type].advisor,
          }
        : payload.eventData;

    const [eventRow] = await db.insert(events).values({
      eventType: payload.eventType,
      eventData,
      buildingSlug: payload.buildingSlug,
      url: referrer,
      referrer,
      userAgent,
    }).returning({id: events.id});

    let taskCreated = false;
    let approvalQueueId: string | undefined;

    if (payload.eventType === "owner_takeover_intake") {
      approvalQueueId = await enqueueApproval({
        actionType: "owner_takeover_followup",
        riskClass: "medium",
        sensitivityClass: "confidential",
        payloadRef: `events:${eventRow.id}`,
        payloadSummary: `Owner takeover intake for ${payload.buildingSlug}`,
        relatedBuildingSlug: payload.buildingSlug,
        proposerAgent: "room305-api",
        requiresTwoEyes: false,
        evidence: {
          event_id: eventRow.id,
          referrer,
        },
      });

      await db.insert(tasks).values({
        title: `HIGH: Owner takeover intake for ${payload.buildingSlug}`,
        body: JSON.stringify(eventData),
        priority: "high",
      });
      taskCreated = true;
    }

    await logAgentAction({
      agent: "room305-api",
      action: payload.eventType,
      sensitivityClass:
        payload.eventType === "owner_takeover_intake"
          ? "confidential"
          : "internal",
      approvalQueueId,
      relatedBuildingSlug: payload.buildingSlug,
      outputExcerptRedacted: `accepted:${payload.eventType}`,
    });

    logger.info({
      event: "event.accepted",
      event_type: payload.eventType,
      building_slug: payload.buildingSlug,
      task_created: taskCreated,
    });

    const response: EventResponse = {
      status: "accepted",
      taskCreated,
    };

    return Response.json(response, {status: 201});
  } catch (error) {
    if (error instanceof JsonBodyError) {
      return errorResponse(error.code, error.message, error.status);
    }

    if (error instanceof ZodError) {
      return errorResponse("validation_failed", "Invalid event payload.", 400, {
        issues: error.issues,
      });
    }

    logger.error({
      event: "event.failed",
      reason: error instanceof Error ? error.message : "unknown",
    });

    return errorResponse("internal_error", "Event submission failed.", 500);
  }
}
