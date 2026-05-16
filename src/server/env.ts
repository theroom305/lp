import {z} from "zod";

const envSchema = z.object({
  LEAD_STORAGE_MODE: z.enum(["dry-run", "postgres"]).default("dry-run"),
  DATABASE_URL: z.string().url().optional(),
  CALCOM_BOOKING_URL: z
    .string()
    .url()
    .default("https://cal.com/room305/intro-call"),
  LEAD_NOTIFICATION_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

export const env = envSchema.parse({
  LEAD_STORAGE_MODE: process.env.LEAD_STORAGE_MODE,
  DATABASE_URL: process.env.DATABASE_URL,
  CALCOM_BOOKING_URL: process.env.CALCOM_BOOKING_URL,
  LEAD_NOTIFICATION_WEBHOOK_URL: process.env.LEAD_NOTIFICATION_WEBHOOK_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
});

export type Env = typeof env;
