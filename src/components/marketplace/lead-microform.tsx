"use client";

import {useLocale, useTranslations} from "next-intl";
import {useMemo, useState} from "react";

type SubmitState =
  | {
      kind: "idle";
    }
  | {
      kind: "submitting";
    }
  | {
      kind: "success";
      tier: string;
      nextAction: string;
    }
  | {
      kind: "error";
      message: string;
    };

const countryOptions = ["US", "AR", "BR", "MX", "CO", "CL", "VE", "IL"];

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function LeadMicroform() {
  const t = useTranslations("leadForm");
  const locale = useLocale();
  const [state, setState] = useState<SubmitState>({kind: "idle"});
  const idempotencyKey = useMemo(() => createIdempotencyKey(), []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({kind: "submitting"});

    const form = new FormData(event.currentTarget);
    const country = String(form.get("country") ?? "");
    const trigger = String(form.get("trigger") ?? "");
    const openQuestion = String(form.get("openQuestion") ?? "");

    const response = await fetch("/api/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey,
        profile: {
          country,
          trigger,
          openQuestion,
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
      lead?: {tier: string};
      nextAction?: {kind: string};
      error?: {message: string};
    };

    if (!response.ok || body.error) {
      setState({
        kind: "error",
        message: body.error?.message ?? t("error"),
      });
      return;
    }

    setState({
      kind: "success",
      tier: body.lead?.tier ?? "c",
      nextAction: body.nextAction?.kind ?? "nurture",
    });
  }

  return (
    <form className="lead-form" onSubmit={onSubmit} data-test-id="lead-form">
      <div>
        <label htmlFor="country">{t("country")}</label>
        <select id="country" name="country" required defaultValue="US">
          {countryOptions.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="trigger">{t("trigger")}</label>
        <select id="trigger" name="trigger" required defaultValue="exploring">
          <option value="buy_self">{t("triggers.buySelf")}</option>
          <option value="buy_investment">{t("triggers.buyInvestment")}</option>
          <option value="sell_unit">{t("triggers.sellUnit")}</option>
          <option value="better_operations">{t("triggers.operations")}</option>
          <option value="exploring">{t("triggers.exploring")}</option>
        </select>
      </div>

      <div>
        <label htmlFor="openQuestion">{t("openQuestion")}</label>
        <input
          id="openQuestion"
          name="openQuestion"
          maxLength={500}
          placeholder={t("placeholder")}
        />
      </div>

      <button
        type="submit"
        disabled={state.kind === "submitting"}
        data-test-id="lead-submit"
      >
        {state.kind === "submitting" ? t("submitting") : t("submit")}
      </button>

      <p className="form-status" aria-live="polite">
        {state.kind === "success"
          ? t("success", {tier: state.tier.toUpperCase(), nextAction: state.nextAction})
          : null}
        {state.kind === "error" ? state.message : null}
      </p>
    </form>
  );
}
