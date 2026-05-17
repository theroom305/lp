import {NextRequest} from "next/server";
import {z, ZodError} from "zod";

import {getSql} from "@/server/db/client";
import {JsonBodyError, readJsonBody} from "@/server/http/request-body";
import {logger} from "@/server/logger";
import {checkRateLimit, rateLimitHeaders} from "@/server/rate-limit/check";
import {memoAdvisorMap, memoRequestTypes} from "@/content/atlas";

export const runtime = "nodejs";

const memoRequestTypeSchema = z.enum(memoRequestTypes);

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

type EventPayload = z.infer<typeof eventRequestSchema>;

type EventWriteInput = Readonly<{
  payload: EventPayload;
  eventData: Record<string, unknown>;
  referrer: string | null;
  userAgent: string | null;
}>;

async function writeMemoRequestEvent(input: EventWriteInput): Promise<void> {
  const sql = getSql();
  const outputExcerpt = `accepted:${input.payload.eventType}`;

  await sql`
    with inserted_event as (
      insert into events (
        event_type,
        event_data,
        building_slug,
        url,
        referrer,
        user_agent
      )
      values (
        ${input.payload.eventType},
        ${JSON.stringify(input.eventData)}::jsonb,
        ${input.payload.buildingSlug},
        ${input.referrer},
        ${input.referrer},
        ${input.userAgent}
      )
      returning id
    )
    insert into agent_action_log (
      agent,
      action,
      sensitivity_class,
      related_building_slug,
      output_excerpt_redacted
    )
    select
      'room305-api',
      ${input.payload.eventType},
      ${"internal"}::sensitivity_class,
      ${input.payload.buildingSlug},
      ${outputExcerpt}
    from inserted_event
  `;
}

async function writeOwnerTakeoverEvent(input: EventWriteInput): Promise<void> {
  const sql = getSql();
  const outputExcerpt = `accepted:${input.payload.eventType}`;

  await sql`
    with inserted_event as (
      insert into events (
        event_type,
        event_data,
        building_slug,
        url,
        referrer,
        user_agent
      )
      values (
        ${input.payload.eventType},
        ${JSON.stringify(input.eventData)}::jsonb,
        ${input.payload.buildingSlug},
        ${input.referrer},
        ${input.referrer},
        ${input.userAgent}
      )
      returning id
    ),
    inserted_approval as (
      insert into approval_queue (
        action_type,
        risk_class,
        sensitivity_class,
        payload_ref,
        payload_summary,
        related_building_slug,
        evidence,
        proposer_agent,
        requires_two_eyes
      )
      select
        'owner_takeover_followup',
        ${"medium"}::risk_class,
        ${"confidential"}::sensitivity_class,
        'events:' || inserted_event.id::text,
        ${`Owner takeover intake for ${input.payload.buildingSlug}`},
        ${input.payload.buildingSlug},
        jsonb_build_object(
          'event_id',
          inserted_event.id,
          'referrer',
          ${input.referrer}::text
        ),
        'room305-api',
        false
      from inserted_event
      returning id
    ),
    inserted_task as (
      insert into tasks (
        title,
        body,
        priority
      )
      values (
        ${`HIGH: Owner takeover intake for ${input.payload.buildingSlug}`},
        ${JSON.stringify(input.eventData)},
        ${"high"}::task_priority
      )
      returning id
    )
    insert into agent_action_log (
      agent,
      action,
      sensitivity_class,
      approval_queue_id,
      related_building_slug,
      output_excerpt_redacted
    )
    select
      'room305-api',
      ${input.payload.eventType},
      ${"confidential"}::sensitivity_class,
      inserted_approval.id,
      ${input.payload.buildingSlug},
      ${outputExcerpt}
    from inserted_approval
  `;
}

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

    const referrer = request.headers.get("referer");
    const userAgent = request.headers.get("user-agent");
    const eventData: Record<string, unknown> =
      payload.eventType === "memo_request"
        ? {
            memo_request_type: payload.eventData.memo_request_type,
            advisor:
              memoAdvisorMap[payload.eventData.memo_request_type].advisor,
          }
        : payload.eventData;

    if (payload.eventType === "owner_takeover_intake") {
      await writeOwnerTakeoverEvent({
        payload,
        eventData,
        referrer,
        userAgent,
      });
    } else {
      await writeMemoRequestEvent({
        payload,
        eventData,
        referrer,
        userAgent,
      });
    }

    const taskCreated = payload.eventType === "owner_takeover_intake";

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
