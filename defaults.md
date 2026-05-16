---
name: Room 305 LP defaults
description: Named configuration defaults for the website, lead form, and integrations.
type: defaults
status: active
owner: codex
created_at: 2026-05-14
updated_at: 2026-05-16
---

# Defaults

| Default | Value | Reason |
|---|---|---|
| `NEXT_VERSION` | `15.5.18` | Project contract specifies Next.js 15. Pinned because `latest` is Next.js 16 in May 2026. |
| `LOCALES` | `en`, `es` | Bilingual from day one. |
| `DEFAULT_LOCALE` | `en` | English default; routes are prefixed (`/en`, `/es`) to avoid locale ambiguity. |
| `LEAD_STORAGE_MODE` | `dry-run` | Lead capture remains dry-run until Step 4 turns persistence on deliberately. |
| `NEXT_PUBLIC_CALENDAR_URL` | `https://calendar.app.google/dJn7nyv4bsVxXwTB7` | Dan provided Google Appointment Schedule as the v1 scheduling surface. |
| `RESEND_API_KEY` | `re_dry_run_step1` in preview env | Placeholder only; no live sends in Step 1. |
| `AUTH_SECRET` | generated per Vercel project | Server-only Auth.js secret; never `NEXT_PUBLIC_`. |
| `LEAD_NOTIFICATION_WEBHOOK_URL` | unset | Telegram notification target pending. |
| `SENTRY_DSN` | unset | Sentry is env-gated; no paid monitoring or live alerts by default. |
| `LOG_LEVEL` | `info` | Structured server logs without debug noise. |
| `JSON_LD_TYPE` | `Organization` | Do not publish `RealEstateAgent` schema before Stage 0 brokerage authority clears. |
