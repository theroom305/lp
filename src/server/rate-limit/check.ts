import {neon} from "@neondatabase/serverless";
import {createHash} from "crypto";
import type {NextRequest} from "next/server";

import {env} from "@/server/env";
import {logger} from "@/server/logger";

type RateLimitConfig = Readonly<{
  scope: string;
  limit: number;
  windowSeconds: number;
}>;

type RateLimitResult = Readonly<
  | {
      allowed: true;
      remaining: number;
      resetAt: Date;
    }
  | {
      allowed: false;
      remaining: 0;
      resetAt: Date;
      reason: "rate_limited" | "limiter_unavailable";
    }
>;

type MemoryBucket = {
  count: number;
  resetAtMs: number;
};

const memoryBuckets = new Map<string, MemoryBucket>();

function getClientFingerprint(request: NextRequest, scope: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const realIp = request.headers.get("x-real-ip") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || realIp || "unknown";

  return createHash("sha256")
    .update(`${scope}:${ip}:${userAgent}`)
    .digest("hex");
}

function getWindowStart(nowMs: number, windowMs: number): Date {
  return new Date(Math.floor(nowMs / windowMs) * windowMs);
}

function checkMemoryLimit(
  identityHash: string,
  config: RateLimitConfig,
  nowMs: number,
): RateLimitResult {
  const windowMs = config.windowSeconds * 1000;
  const resetAtMs = Math.floor(nowMs / windowMs) * windowMs + windowMs;
  const key = `${config.scope}:${identityHash}:${resetAtMs}`;
  const existing = memoryBuckets.get(key);
  const nextCount = (existing?.count ?? 0) + 1;

  memoryBuckets.set(key, {count: nextCount, resetAtMs});

  for (const [bucketKey, bucket] of memoryBuckets) {
    if (bucket.resetAtMs < nowMs) {
      memoryBuckets.delete(bucketKey);
    }
  }

  if (nextCount > config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(resetAtMs),
      reason: "rate_limited",
    };
  }

  return {
    allowed: true,
    remaining: config.limit - nextCount,
    resetAt: new Date(resetAtMs),
  };
}

export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const nowMs = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const resetAt = new Date(Math.floor(nowMs / windowMs) * windowMs + windowMs);
  const identityHash = getClientFingerprint(request, config.scope);

  if (!env.DATABASE_URL) {
    return checkMemoryLimit(identityHash, config, nowMs);
  }

  try {
    const sql = neon(env.DATABASE_URL);
    const [row] = await sql`
      insert into rate_limit_events (
        scope,
        identity_hash,
        window_start,
        count
      )
      values (
        ${config.scope},
        ${identityHash},
        ${getWindowStart(nowMs, windowMs).toISOString()}::timestamptz,
        1
      )
      on conflict (scope, identity_hash, window_start)
      do update set
        count = rate_limit_events.count + 1,
        updated_at = now()
      returning count
    `;
    const count = Number(row?.count ?? config.limit + 1);

    if (count > config.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        reason: "rate_limited",
      };
    }

    return {
      allowed: true,
      remaining: config.limit - count,
      resetAt,
    };
  } catch (error) {
    logger.error({
      event: "rate_limit.failed",
      scope: config.scope,
      reason: error instanceof Error ? error.message : "unknown",
    });

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      reason: "limiter_unavailable",
    };
  }
}

export function rateLimitHeaders(
  result: RateLimitResult,
  limit: number,
): HeadersInit {
  return {
    "RateLimit-Limit": String(limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt.getTime() / 1000)),
  };
}
