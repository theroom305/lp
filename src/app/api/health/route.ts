import {sql} from "drizzle-orm";

import {getDb} from "@/server/db/client";
import {logger} from "@/server/logger";

export const runtime = "nodejs";

type HealthResponse = Readonly<{
  status: "ok";
  db: "connected";
  db_latency_ms: number;
}>;

type HealthErrorResponse = Readonly<{
  error: {
    code: "db_unavailable";
    message: string;
    details: Record<string, unknown>;
  };
}>;

export async function GET(): Promise<Response> {
  const startedAt = performance.now();

  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    const body: HealthResponse = {
      status: "ok",
      db: "connected",
      db_latency_ms: Math.round(performance.now() - startedAt),
    };

    return Response.json(body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database failure.";

    logger.error({
      event: "health.db.failed",
      reason: message,
    });

    const body: HealthErrorResponse = {
      error: {
        code: "db_unavailable",
        message: "Database health check failed.",
        details: {},
      },
    };

    return Response.json(body, {status: 503});
  }
}
