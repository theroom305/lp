"use client";

import {Send} from "lucide-react";
import {useState} from "react";

import {
  memoAdvisorMap,
  type BuildingStage,
  type MemoRequestType,
} from "@/content/atlas";

type MemoSplitCTAProps = Readonly<{
  buildingSlug: string;
  stage: BuildingStage;
}>;

const deliveredStages: readonly BuildingStage[] = [
  "recently_delivered",
  "stabilized",
];

export function MemoSplitCTA({buildingSlug, stage}: MemoSplitCTAProps) {
  const [status, setStatus] = useState<string>("");
  const isDelivered = deliveredStages.includes(stage);
  const memoEntries = Object.entries(memoAdvisorMap).filter(
    ([, memo]) => !memo.deliveredOnly || isDelivered,
  ) as Array<[MemoRequestType, (typeof memoAdvisorMap)[MemoRequestType]]>;

  async function requestMemo(memoRequestType: MemoRequestType): Promise<void> {
    setStatus("Saving memo request");

    const response = await fetch("/api/events", {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({
        eventType: "memo_request",
        buildingSlug,
        eventData: {
          memo_request_type: memoRequestType,
          advisor: memoAdvisorMap[memoRequestType].advisor,
        },
      }),
    });

    setStatus(response.ok ? "Memo request saved" : "Memo request could not be saved");
  }

  return (
    <div className="memo-split" data-test-id="memo-split-cta">
      {memoEntries.map(([memoRequestType, memo]) => (
        <article className="memo-card" key={memoRequestType}>
          <p className="eyebrow">{memo.advisor}</p>
          <h3>{memo.label}</h3>
          <p>{memo.description}</p>
          <button
            type="button"
            onClick={() => void requestMemo(memoRequestType)}
            data-test-id={`memo-request-${memoRequestType}`}
          >
            <Send aria-hidden="true" size={16} />
            Send memo
          </button>
        </article>
      ))}
      <p className="form-status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
