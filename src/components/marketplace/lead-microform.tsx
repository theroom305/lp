"use client";

import {useLocale, useTranslations} from "next-intl";
import {type FormEvent, useMemo, useState} from "react";

import {corridorBuildings} from "@/content/building-registry";
import {trackEvent} from "@/lib/analytics";

type CustomerState = "buying" | "i-own" | "selling";
type UseMix = "personal-led" | "mixed" | "rental-led" | "unsure";

type LeadMicroformProps = Readonly<{
  defaultCustomerState?: CustomerState;
  prefillBuildingName?: string;
}>;

type SubmitState =
  | {
      kind: "idle";
    }
  | {
      kind: "submitting";
    }
  | {
      kind: "success";
    }
  | {
      kind: "error";
      message: string;
    };

type ChipOption = Readonly<{
  label: string;
  value: string;
}>;

const useMixOptions = [
  "personal-led",
  "mixed",
  "rental-led",
  "unsure",
] as const;
const holdHorizonOptions = [
  "under-2y",
  "2-5y",
  "5-plus",
  "opportunistic",
] as const;
const timelineOptions = ["lt-3mo", "3-12mo", "12-24mo", "exploring"] as const;
const budgetBandOptions = [
  "under-500k",
  "500k-1m",
  "1m-2m",
  "2m-plus",
] as const;

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formValue(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function optionalFormValue(form: FormData, key: string): string | null {
  const value = formValue(form, key);
  return value.length > 0 ? value : null;
}

function chipGroupId(name: string): string {
  return `${name}-legend`;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasAtlasMatch(value: string): boolean {
  const normalized = normalize(value);

  if (normalized.length === 0) {
    return false;
  }

  return corridorBuildings.some((building) => {
    const candidates = [
      building.slug,
      building.name,
      building.city,
      building.submarket,
    ].map(normalize);

    return candidates.some(
      (candidate) => normalized.includes(candidate) || candidate.includes(normalized),
    );
  });
}

type ChipGroupProps = Readonly<{
  legend: string;
  name: string;
  options: readonly ChipOption[];
  required?: boolean;
  onChange?: (value: string) => void;
}>;

function ChipGroup({legend, name, options, required, onChange}: ChipGroupProps) {
  return (
    <fieldset className="chip-fieldset" aria-labelledby={chipGroupId(name)}>
      <legend id={chipGroupId(name)}>{legend}</legend>
      <div className="chip-group">
        {options.map((option) => (
          <label key={option.value}>
            <input
              name={name}
              required={required}
              type="radio"
              value={option.value}
              onChange={() => onChange?.(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function pathForCustomerState(customerState: CustomerState): "buying" | "own" | "selling" {
  if (customerState === "i-own") {
    return "own";
  }

  return customerState;
}

export function LeadMicroform({
  defaultCustomerState = "buying",
  prefillBuildingName,
}: LeadMicroformProps) {
  const t = useTranslations("leadForm");
  const locale = useLocale() as "en" | "es";
  const [useMix, setUseMix] = useState<UseMix>("unsure");
  const [state, setState] = useState<SubmitState>({kind: "idle"});
  const [started, setStarted] = useState(false);
  const idempotencyKey = useMemo(() => createIdempotencyKey(), []);
  const path = pathForCustomerState(defaultCustomerState);
  const showHoldHorizon = useMix === "mixed" || useMix === "rental-led";

  function markStarted() {
    if (started) {
      return;
    }

    setStarted(true);
    trackEvent("form_started", {path, locale});
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({kind: "submitting"});

    const form = new FormData(event.currentTarget);
    const buildingOrArea = formValue(form, "buildingOrArea");
    const advisorInvolved = form.get("advisorInvolved") === "on";
    const submittedUseMix = formValue(form, "useMix") as UseMix;

    trackEvent("form_step_completed", {
      path,
      step_index: 1,
      step_name: "Context",
      locale,
    });
    trackEvent("form_step_completed", {
      path,
      step_index: 2,
      step_name: "Situation",
      locale,
    });
    trackEvent("form_step_completed", {
      path,
      step_index: 3,
      step_name: "Contact",
      locale,
    });
    trackEvent("form_submitted", {
      path,
      locale,
      has_advisor: advisorInvolved,
      has_concern: Boolean(optionalFormValue(form, "mainConcern")),
    });

    const response = await fetch("/api/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey,
        customerState: defaultCustomerState,
        buildingOrArea,
        countryOfResidence: formValue(form, "countryOfResidence"),
        useMix: submittedUseMix,
        holdHorizon: showHoldHorizon
          ? optionalFormValue(form, "holdHorizon")
          : null,
        timeline: formValue(form, "timeline"),
        budgetBand: optionalFormValue(form, "budgetBand"),
        advisorInvolved,
        advisorName: advisorInvolved ? optionalFormValue(form, "advisorName") : null,
        mainConcern: optionalFormValue(form, "mainConcern"),
        contact: {
          name: formValue(form, "name"),
          email: formValue(form, "email"),
          phone: optionalFormValue(form, "whatsapp") ?? undefined,
          whatsapp: optionalFormValue(form, "whatsapp") ?? undefined,
        },
        context: {
          locale,
          sourceUrl: window.location.href,
          referrer: document.referrer || undefined,
        },
        consent: {
          marketing: false,
        },
      }),
    });

    const body = (await response.json()) as {
      error?: {message: string};
      lead?: {tier: string};
      preCallBrief?: {notification: "dry-run" | "sent" | "skipped"};
    };

    if (!response.ok || body.error) {
      setState({
        kind: "error",
        message: body.error?.message ?? t("error"),
      });
      return;
    }

    if (body.lead?.tier) {
      trackEvent("lead_classified", {
        tier: body.lead.tier,
        locale,
        has_atlas_match: hasAtlasMatch(buildingOrArea),
      });
    }

    if (body.preCallBrief?.notification) {
      trackEvent("notification_sent", {
        mode: body.preCallBrief.notification === "sent" ? "live" : "dry-run",
        tier: body.lead?.tier ?? "unknown",
      });
    }

    setState({kind: "success"});
  }

  if (state.kind === "success") {
    return (
      <section
        className="lead-success-card"
        aria-live="polite"
        data-test-id="lead-success"
      >
        <h2>{t("successHeading")}</h2>
        <p>{t("successBody")}</p>
      </section>
    );
  }

  return (
    <form
      className="lead-form"
      onFocus={markStarted}
      onSubmit={onSubmit}
      data-test-id="lead-form"
    >
      <input type="hidden" name="customerState" value={defaultCustomerState} />
      <ol className="step-indicator" aria-label={t("stepsLabel")}>
        <li>{t("stepContext")}</li>
        <li>{t("stepSituation")}</li>
        <li>{t("stepContact")}</li>
      </ol>

      <fieldset className="form-step">
        <legend>{t("stepContext")}</legend>
        <div>
          <label htmlFor="buildingOrArea">{t("buildingOrArea")}</label>
          <input
            id="buildingOrArea"
            name="buildingOrArea"
            required
            defaultValue={prefillBuildingName ?? ""}
            placeholder={t("buildingOrAreaPlaceholder")}
            onBlur={(event) => {
              if (event.currentTarget.value.trim().length > 0) {
                trackEvent("building_entered", {
                  has_atlas_match: hasAtlasMatch(event.currentTarget.value),
                  locale,
                });
              }
            }}
          />
        </div>
        <div>
          <label htmlFor="countryOfResidence">{t("countryOfResidence")}</label>
          <input
            id="countryOfResidence"
            name="countryOfResidence"
            required
            autoComplete="country-name"
          />
        </div>
      </fieldset>

      <fieldset className="form-step">
        <legend>{t("stepSituation")}</legend>
        <ChipGroup
          legend={t("useMixLabel")}
          name="useMix"
          required
          options={useMixOptions.map((option) => ({
            value: option,
            label: t(`useMix.${option}`),
          }))}
          onChange={(value) => setUseMix(value as UseMix)}
        />
        {showHoldHorizon ? (
          <ChipGroup
            legend={t("holdHorizonLabel")}
            name="holdHorizon"
            required
            options={holdHorizonOptions.map((option) => ({
              value: option,
              label: t(`holdHorizon.${option}`),
            }))}
          />
        ) : null}
        <ChipGroup
          legend={t("timelineLabel")}
          name="timeline"
          required
          options={timelineOptions.map((option) => ({
            value: option,
            label: t(`timeline.${option}`),
          }))}
        />
        <ChipGroup
          legend={t("budgetBandLabel")}
          name="budgetBand"
          options={budgetBandOptions.map((option) => ({
            value: option,
            label: t(`budgetBand.${option}`),
          }))}
        />
        <div className="checkbox-row">
          <label htmlFor="advisorInvolved">
            <input id="advisorInvolved" name="advisorInvolved" type="checkbox" />
            <span>{t("advisorInvolved")}</span>
          </label>
        </div>
        <div>
          <label htmlFor="advisorName">{t("advisorName")}</label>
          <input
            id="advisorName"
            name="advisorName"
            maxLength={80}
            placeholder={t("advisorNamePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="mainConcern">{t("mainConcern")}</label>
          <textarea
            id="mainConcern"
            name="mainConcern"
            maxLength={200}
            placeholder={t("mainConcernHelper")}
          />
        </div>
      </fieldset>

      <fieldset className="form-step">
        <legend>{t("stepContact")}</legend>
        <div>
          <label htmlFor="name">{t("name")}</label>
          <input id="name" name="name" required autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email">{t("email")}</label>
          <input id="email" name="email" required type="email" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="whatsapp">{t("whatsapp")}</label>
          <input id="whatsapp" name="whatsapp" autoComplete="tel" />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={state.kind === "submitting"}
        data-test-id="lead-submit"
      >
        {state.kind === "submitting" ? t("submitting") : t("submit")}
      </button>

      <p className="form-status" aria-live="polite" role="status">
        {state.kind === "error" ? state.message : null}
      </p>
    </form>
  );
}
