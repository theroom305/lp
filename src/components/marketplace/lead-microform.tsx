"use client";

import {useLocale, useTranslations} from "next-intl";
import {type FormEvent, useMemo, useState} from "react";

type LeadIntent = "buying" | "selling";

type LeadMicroformProps = Readonly<{
  defaultIntent?: LeadIntent;
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

const financingOptions = ["cash", "financing", "unsure"] as const;
const sellerPainOptions = [
  "price",
  "tenant",
  "hoa",
  "broker",
  "uncertainty",
  "other",
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

function optionalFormValue(form: FormData, key: string): string | undefined {
  const value = formValue(form, key);
  return value.length > 0 ? value : undefined;
}

export function LeadMicroform({defaultIntent = "buying"}: LeadMicroformProps) {
  const t = useTranslations("leadForm");
  const locale = useLocale();
  const [intent, setIntent] = useState<LeadIntent>(defaultIntent);
  const [state, setState] = useState<SubmitState>({kind: "idle"});
  const idempotencyKey = useMemo(() => createIdempotencyKey(), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({kind: "submitting"});

    const form = new FormData(event.currentTarget);
    const currentIntent = formValue(form, "intent") as LeadIntent;
    const callUsefulnessText = formValue(form, "callUsefulnessText");
    const whatsapp = optionalFormValue(form, "whatsapp");
    const country = formValue(form, "country");

    const response = await fetch("/api/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey,
        intent: currentIntent,
        profile: {
          country,
          trigger: currentIntent === "buying" ? "buy_investment" : "sell_unit",
          openQuestion: callUsefulnessText,
        },
        buyer:
          currentIntent === "buying"
            ? {
                targetAreaOrBuilding: formValue(form, "targetAreaOrBuilding"),
                budgetRange: formValue(form, "budgetRange"),
                timeline: formValue(form, "buyerTimeline"),
                financingPosture: formValue(form, "financingPosture"),
                avoidance: formValue(form, "avoidance"),
              }
            : null,
        seller:
          currentIntent === "selling"
            ? {
                buildingUnit: formValue(form, "buildingUnit"),
                currentlyListed: formValue(form, "currentlyListed") === "yes",
                timeline: formValue(form, "sellerTimeline"),
                pain: formValue(form, "sellerPain"),
                expectedPrice: formValue(form, "expectedPrice"),
              }
            : null,
        callUsefulnessText,
        contact: {
          name: formValue(form, "name"),
          email: formValue(form, "email"),
          phone: whatsapp,
          whatsapp,
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
    };

    if (!response.ok || body.error) {
      setState({
        kind: "error",
        message: body.error?.message ?? t("error"),
      });
      return;
    }

    setState({kind: "success"});
  }

  return (
    <form className="lead-form" onSubmit={onSubmit} data-test-id="lead-form">
      <fieldset className="form-step">
        <legend>{t("intentLegend")}</legend>
        <div className="intent-toggle">
          <label>
            <input
              checked={intent === "buying"}
              name="intent"
              onChange={() => setIntent("buying")}
              type="radio"
              value="buying"
            />
            <span>{t("buying")}</span>
          </label>
          <label>
            <input
              checked={intent === "selling"}
              name="intent"
              onChange={() => setIntent("selling")}
              type="radio"
              value="selling"
            />
            <span>{t("selling")}</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="form-step">
        <legend>{t("stepContext")}</legend>
        <div>
          <label htmlFor="country">{t("country")}</label>
          <input id="country" name="country" required autoComplete="country-name" />
        </div>

        {intent === "buying" ? (
          <>
            <div>
              <label htmlFor="targetAreaOrBuilding">
                {t("targetAreaOrBuilding")}
              </label>
              <input
                id="targetAreaOrBuilding"
                name="targetAreaOrBuilding"
                required
                placeholder={t("targetAreaOrBuildingPlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="budgetRange">{t("budgetRange")}</label>
              <input
                id="budgetRange"
                name="budgetRange"
                required
                placeholder={t("budgetRangePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="buyerTimeline">{t("buyerTimeline")}</label>
              <input
                id="buyerTimeline"
                name="buyerTimeline"
                required
                placeholder={t("buyerTimelinePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="financingPosture">{t("financingPosture")}</label>
              <select id="financingPosture" name="financingPosture" required>
                {financingOptions.map((option) => (
                  <option key={option} value={option}>
                    {t(`financing.${option}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="avoidance">{t("avoidance")}</label>
              <textarea
                id="avoidance"
                name="avoidance"
                maxLength={500}
                required
                placeholder={t("avoidancePlaceholder")}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="buildingUnit">{t("buildingUnit")}</label>
              <input
                id="buildingUnit"
                name="buildingUnit"
                required
                placeholder={t("buildingUnitPlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="currentlyListed">{t("currentlyListed")}</label>
              <select id="currentlyListed" name="currentlyListed" required>
                <option value="no">{t("listedNo")}</option>
                <option value="yes">{t("listedYes")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="sellerTimeline">{t("sellerTimeline")}</label>
              <input
                id="sellerTimeline"
                name="sellerTimeline"
                required
                placeholder={t("sellerTimelinePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="sellerPain">{t("sellerPain")}</label>
              <select id="sellerPain" name="sellerPain" required>
                {sellerPainOptions.map((option) => (
                  <option key={option} value={option}>
                    {t(`sellerPainOptions.${option}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="expectedPrice">{t("expectedPrice")}</label>
              <input
                id="expectedPrice"
                name="expectedPrice"
                required
                placeholder={t("expectedPricePlaceholder")}
              />
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="form-step">
        <legend>{t("stepCall")}</legend>
        <div>
          <label htmlFor="callUsefulnessText">{t("callUsefulness")}</label>
          <textarea
            id="callUsefulnessText"
            name="callUsefulnessText"
            maxLength={700}
            required
            placeholder={t("callUsefulnessPlaceholder")}
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
          <input
            id="whatsapp"
            name="whatsapp"
            autoComplete="tel"
            placeholder={t("whatsappPlaceholder")}
          />
        </div>
      </fieldset>

      <p className="form-note">{t("privacyNote")}</p>

      <button
        type="submit"
        disabled={state.kind === "submitting"}
        data-test-id="lead-submit"
      >
        {state.kind === "submitting" ? t("submitting") : t("submit")}
      </button>

      <p className="form-status" aria-live="polite">
        {state.kind === "success" ? t("success") : null}
        {state.kind === "error" ? state.message : null}
      </p>
    </form>
  );
}
