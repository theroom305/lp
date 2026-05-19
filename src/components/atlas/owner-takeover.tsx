"use client";

import {ClipboardCheck, Send} from "lucide-react";
import {useState} from "react";

type OwnerTakeoverCTAProps = Readonly<{
  buildingSlug: string;
}>;

export function OwnerTakeoverCTA({buildingSlug}: OwnerTakeoverCTAProps) {
  return (
    <aside
      className="owner-takeover-cta"
      data-test-id="owner-takeover-cta"
      aria-label="Owner takeover"
    >
      <ClipboardCheck aria-hidden="true" size={20} />
      <div>
        <h3>Already own here?</h3>
        <p>Request a private operating review for this building.</p>
        <a href={`#owner-takeover-intake-${buildingSlug}`}>Open intake</a>
      </div>
    </aside>
  );
}

type OwnerTakeoverIntakeFormProps = Readonly<{
  buildingSlug: string;
}>;

export function OwnerTakeoverIntakeForm({
  buildingSlug,
}: OwnerTakeoverIntakeFormProps) {
  const [status, setStatus] = useState("");

  async function submit(formData: FormData): Promise<void> {
    setStatus("Saving intake");

    const desiredDifferences = [
      formData.get("desired_difference_1"),
      formData.get("desired_difference_2"),
      formData.get("desired_difference_3"),
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);

    const response = await fetch("/api/events", {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({
        eventType: "owner_takeover_intake",
        buildingSlug,
        eventData: {
          current_pm_company: String(formData.get("current_pm_company") ?? ""),
          current_pm_response_time: String(
            formData.get("current_pm_response_time") ?? "",
          ),
          projection_actual_gap_pct: String(
            formData.get("projection_actual_gap_pct") ?? "",
          ),
          specific_incident: String(formData.get("specific_incident") ?? ""),
          exit_terms: String(formData.get("exit_terms") ?? ""),
          switch_timeline: String(formData.get("switch_timeline") ?? ""),
          desired_differences: desiredDifferences,
        },
      }),
    });

    setStatus(response.ok ? "Owner intake saved" : "Owner intake failed");
  }

  return (
    <form
      id={`owner-takeover-intake-${buildingSlug}`}
      className="owner-intake-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
      data-test-id="owner-takeover-intake-form"
    >
      <h3>Owner takeover intake</h3>
      <label>
        Current PM company
        <input name="current_pm_company" autoComplete="organization" />
      </label>
      <label>
        Current PM response time
        <input name="current_pm_response_time" placeholder="Hours or days" />
      </label>
      <label>
        Last 12-month projection-vs-actual gap
        <input name="projection_actual_gap_pct" placeholder="e.g. 18% under" />
      </label>
      <label>
        Specific incident mishandled
        <textarea name="specific_incident" rows={4} />
      </label>
      <label>
        Exit terms with current PM
        <textarea name="exit_terms" rows={3} />
      </label>
      <label>
        Desired switch timeline
        <input name="switch_timeline" placeholder="e.g. 30-60 days" />
      </label>
      <label>
        Desired difference 1
        <input name="desired_difference_1" />
      </label>
      <label>
        Desired difference 2
        <input name="desired_difference_2" />
      </label>
      <label>
        Desired difference 3
        <input name="desired_difference_3" />
      </label>
      <button type="submit">
        <Send aria-hidden="true" size={16} />
        Save intake
      </button>
      <p className="form-status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
