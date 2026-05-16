---
name: Room 305 LP defaults
description: Named configuration defaults for the website, lead form, and integrations.
type: defaults
status: active
owner: codex
created_at: 2026-05-14
updated_at: 2026-05-14
---

# Defaults

| Default | Value | Reason |
|---|---|---|
| `NEXT_VERSION` | `15.5.18` | Project contract specifies Next.js 15. Pinned because `latest` is Next.js 16 in May 2026. |
| `LOCALES` | `en`, `es` | Bilingual from day one. |
| `DEFAULT_LOCALE` | `en` | English default; routes are prefixed (`/en`, `/es`) to avoid locale ambiguity. |
| `LEAD_STORAGE_MODE` | `dry-run` | Build and test without creating a database or silently losing failures. |
| `CALCOM_BOOKING_URL` | `https://cal.com/room305/intro-call` | Typed placeholder until the founder's calendar is provisioned. |
| `LEAD_NOTIFICATION_WEBHOOK_URL` | unset | Telegram notification target pending. |
| `SENTRY_DSN` | unset | Sentry is env-gated; no paid monitoring or live alerts by default. |
| `LOG_LEVEL` | `info` | Structured server logs without debug noise. |
| `JSON_LD_TYPE` | `Organization` | Do not publish `RealEstateAgent` schema before Stage 0 brokerage authority clears. |
