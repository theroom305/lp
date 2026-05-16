import {z} from "zod";

const envSchema = z.object({
  LEAD_STORAGE_MODE: z.enum(["dry-run", "postgres"]).default("dry-run"),
  DATABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_CALENDAR_URL: z
    .string()
    .url()
    .default("https://calendar.app.google/dJn7nyv4bsVxXwTB7"),
  RESEND_API_KEY: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  LEAD_NOTIFICATION_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

export const env = envSchema.parse({
  LEAD_STORAGE_MODE: process.env.LEAD_STORAGE_MODE,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CALENDAR_URL: process.env.NEXT_PUBLIC_CALENDAR_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  AUTH_SECRET: process.env.AUTH_SECRET,
  LEAD_NOTIFICATION_WEBHOOK_URL: process.env.LEAD_NOTIFICATION_WEBHOOK_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

export type Env = typeof env;
