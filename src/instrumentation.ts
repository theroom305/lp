export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
      enabled: true,
    });
  }
}
