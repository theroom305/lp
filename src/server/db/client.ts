import {neon, type NeonQueryFunction} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";

import * as schema from "../../../db/schema";
import {env} from "@/server/env";

let cachedSql: NeonQueryFunction<false, false> | null = null;
let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!cachedSql) {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for database access.");
    }
    cachedSql = neon(env.DATABASE_URL);
  }
  return cachedSql;
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!cachedDb) {
    cachedDb = drizzle(getSql(), {schema});
  }
  return cachedDb;
}
