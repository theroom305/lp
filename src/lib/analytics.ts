"use client";

export type AnalyticsEventName =
  | "path_selected"
  | "building_entered"
  | "atlas_link_clicked"
  | "form_started"
  | "form_step_completed"
  | "form_submitted"
  | "lead_classified"
  | "notification_sent"
  | "notification_failed"
  | "first_reply_logged"
  | "first_reply_sla_met"
  | "locale_switched";

type AnalyticsProperties = Readonly<Record<string, string | number | boolean>>;

type PlausibleWindow = Window &
  typeof globalThis & {
    plausible?: (eventName: string, options?: {props: AnalyticsProperties}) => void;
  };

export function trackEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  const plausible = (window as PlausibleWindow).plausible;

  if (typeof plausible !== "function") {
    return;
  }

  plausible(eventName, {props: properties});
}
