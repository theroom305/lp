import {z} from "zod";

const optionalEmail = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().email().optional(),
);

const optionalNumber = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

const envSchema = z.object({
  LEAD_STORAGE_MODE: z.enum(["dry-run", "postgres"]).default("dry-run"),
  DATABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_CALENDAR_URL: z
    .string()
    .url()
    .default("https://calendar.app.google/dJn7nyv4bsVxXwTB7"),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().email().default("hello@theroom305.com"),
  NEXT_PUBLIC_PHONE: z.string().min(1).default("(305) 794-8979"),
  NEXT_PUBLIC_WHATSAPP_URL: z
    .string()
    .url()
    .default("https://wa.me/15555555555"),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_DOMAIN_VERIFIED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  LEAD_NOTIFY_PRIMARY: optionalEmail,
  LEAD_NOTIFY_SECONDARY: optionalEmail,
  LEAD_NOTIFY_FROM: optionalEmail,
  LEAD_NOTIFY_REPLY_TO: optionalEmail,
  AUTH_SECRET: z.string().min(32),
  FOUNDER_SECTION_LIVE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  FOUNDER_VOICE_APPROVED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  FOUNDER_YEARS_OPERATING: optionalNumber,
  LEAD_NOTIFICATION_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

export const env = envSchema.parse({
  LEAD_STORAGE_MODE: process.env.LEAD_STORAGE_MODE,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CALENDAR_URL: process.env.NEXT_PUBLIC_CALENDAR_URL,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  NEXT_PUBLIC_PHONE: process.env.NEXT_PUBLIC_PHONE,
  NEXT_PUBLIC_WHATSAPP_URL: process.env.NEXT_PUBLIC_WHATSAPP_URL,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_DOMAIN_VERIFIED: process.env.RESEND_DOMAIN_VERIFIED,
  LEAD_NOTIFY_PRIMARY: process.env.LEAD_NOTIFY_PRIMARY,
  LEAD_NOTIFY_SECONDARY: process.env.LEAD_NOTIFY_SECONDARY,
  LEAD_NOTIFY_FROM: process.env.LEAD_NOTIFY_FROM,
  LEAD_NOTIFY_REPLY_TO: process.env.LEAD_NOTIFY_REPLY_TO,
  AUTH_SECRET: process.env.AUTH_SECRET,
  FOUNDER_SECTION_LIVE: process.env.FOUNDER_SECTION_LIVE,
  FOUNDER_VOICE_APPROVED: process.env.FOUNDER_VOICE_APPROVED,
  FOUNDER_YEARS_OPERATING: process.env.FOUNDER_YEARS_OPERATING,
  LEAD_NOTIFICATION_WEBHOOK_URL: process.env.LEAD_NOTIFICATION_WEBHOOK_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

export type Env = typeof env;
