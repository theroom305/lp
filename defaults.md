---
name: Room 305 LP defaults
description: Named configuration defaults for the website, lead form, and integrations.
type: defaults
status: active
owner: codex
created_at: 2026-05-14
updated_at: 2026-05-18
---

# Defaults

| Default | Value | Reason |
|---|---|---|
| `NEXT_VERSION` | `15.5.18` | Project contract specifies Next.js 15. Pinned because `latest` is Next.js 16 in May 2026. |
| `LOCALES` | `en`, `es` | Bilingual from day one. |
| `DEFAULT_LOCALE` | `en` | English default; EN funnel routes are unprefixed (`/`, `/buy`, `/sell`, `/contact`) and ES stays prefixed/hidden until authored. |
| `LEAD_STORAGE_MODE` | `dry-run` | Lead capture remains dry-run until Step 4 turns persistence on deliberately. |
| `NEXT_PUBLIC_CALENDAR_URL` | `https://calendar.app.google/dJn7nyv4bsVxXwTB7` | Dan provided Google Appointment Schedule as the v1 scheduling surface. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `hello@theroom305.com` | Public placeholder contact until Dan supplies the live inbox. |
| `NEXT_PUBLIC_PHONE` | `(305) 794-8979` | Public phone display fallback. |
| `NEXT_PUBLIC_WHATSAPP_URL` | `https://wa.me/15555555555` | Placeholder WhatsApp deeplink until Isaac's business number is registered. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | unset | Plausible loads only when a public analytics domain is explicitly configured. |
| `RESEND_API_KEY` | `re_dry_run_step1` in preview env | Placeholder only; no live sends in Step 1. |
| `RESEND_DOMAIN_VERIFIED` | `false` | Lead notification stays dry-run unless the production domain is explicitly verified. |
| `LEAD_NOTIFY_PRIMARY` | unset | Dan provides the real primary lead-notification inbox in Vercel env. |
| `LEAD_NOTIFY_SECONDARY` | unset | Isaac or backup recipient is optional until real traffic is enabled. |
| `LEAD_NOTIFY_FROM` | unset | Required for live notification. If unset, v7 notification mode is dry-run and production is blocked by env. |
| `LEAD_NOTIFY_REPLY_TO` | unset | Optional reply-to; defaults to `LEAD_NOTIFY_PRIMARY` when live notification is enabled. |
| `AUTH_SECRET` | generated per Vercel project | Server-only Auth.js secret; never `NEXT_PUBLIC_`. |
| `LEAD_NOTIFICATION_WEBHOOK_URL` | unset | Telegram notification target pending. |
| `SENTRY_DSN` | unset | Sentry is env-gated; no paid monitoring or live alerts by default. |
| `LOG_LEVEL` | `info` | Structured server logs without debug noise. |
| `JSON_LD_TYPE` | `Organization` | Do not publish `RealEstateAgent` schema before Stage 0 brokerage authority clears. |
