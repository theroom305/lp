import {NextRequest} from "next/server";
import {z, ZodError} from "zod";

import {events, tasks} from "../../../../db/schema";
import {getDb} from "@/server/db/client";
import {logger} from "@/server/logger";

export const runtime = "nodejs";

const eventRequestSchema = z.object({
  eventType: z.enum(["memo_request", "owner_takeover_intake"]),
  buildingSlug: z.string().min(1).max(120).optional(),
  eventData: z.record(z.string(), z.unknown()).default({}),
});

type EventResponse = Readonly<{
  status: "accepted";
  taskCreated: boolean;
}>;

function errorResponse(
  code: string,
  message: string,
  status: number,
  details: Record<string, unknown> = {},
): Response {
  return Response.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    {status},
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const payload = eventRequestSchema.parse(await request.json());
    const db = getDb();
    const referrer = request.headers.get("referer") ?? undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    await db.insert(events).values({
      eventType: payload.eventType,
      eventData: payload.eventData,
      buildingSlug: payload.buildingSlug,
      url: referrer,
      referrer,
      userAgent,
    });

    let taskCreated = false;

    if (payload.eventType === "owner_takeover_intake") {
      await db.insert(tasks).values({
        title: `HIGH: Owner takeover intake for ${payload.buildingSlug ?? "unknown building"}`,
        body: JSON.stringify(payload.eventData),
        priority: "high",
      });
      taskCreated = true;
    }

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
