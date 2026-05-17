import {neon} from "@neondatabase/serverless";
import {getTranslations} from "next-intl/server";

import {env} from "@/server/env";

type CalibrationLogProps = Readonly<
  | {
      variant: "inline";
      buildingSlug: string;
    }
  | {
      variant: "aggregator";
      buildingSlug?: never;
    }
>;

type CalibrationEntry = Readonly<{
  id: string;
  building_slug: string;
  projection_summary: string;
  actual_value_summary: string;
  accuracy_delta_pct: string | null;
  published_at: string | null;
}>;

type RawCalibrationEntry = Record<keyof CalibrationEntry, unknown>;

function normalizeCalibrationEntry(row: RawCalibrationEntry): CalibrationEntry {
  return {
    id: String(row.id),
    building_slug: String(row.building_slug),
    projection_summary: String(row.projection_summary),
    actual_value_summary: String(row.actual_value_summary),
    accuracy_delta_pct:
      row.accuracy_delta_pct === null || row.accuracy_delta_pct === undefined
        ? null
        : String(row.accuracy_delta_pct),
    published_at:
      row.published_at === null || row.published_at === undefined
        ? null
        : String(row.published_at),
  };
}

async function getCalibrationEntries(
  buildingSlug?: string,
): Promise<readonly CalibrationEntry[]> {
  if (!env.DATABASE_URL) {
    return [];
  }

  const sql = neon(env.DATABASE_URL);

  if (buildingSlug) {
    const rows = (await sql`
      select id, building_slug, projection_summary, actual_value_summary, accuracy_delta_pct, published_at
      from calibration_log_entries
      where is_public = true and building_slug = ${buildingSlug}
      order by published_at desc nulls last
      limit 12
    `) as unknown as readonly RawCalibrationEntry[];

    return rows.map(normalizeCalibrationEntry);
  }

  const rows = (await sql`
    select id, building_slug, projection_summary, actual_value_summary, accuracy_delta_pct, published_at
    from calibration_log_entries
    where is_public = true
    order by published_at desc nulls last
  `) as unknown as readonly RawCalibrationEntry[];

  return rows.map(normalizeCalibrationEntry);
}

function formatDelta(value: string | null): string {
  if (!value) {
    return "Pending";
  }

  return `${Number(value).toFixed(1)}%`;
}

export async function CalibrationLog(props: CalibrationLogProps) {
  const t = await getTranslations("calibrationLog");
  const entries = await getCalibrationEntries(
    props.variant === "inline" ? props.buildingSlug : undefined,
  );
  const deltas = entries
    .map((entry) =>
      entry.accuracy_delta_pct ? Math.abs(Number(entry.accuracy_delta_pct)) : null,
    )
    .filter((entry): entry is number => entry !== null);
  const rollingAccuracy =
    deltas.length > 0
      ? `${(deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length).toFixed(1)}% mean absolute miss`
      : t("emptySummary");

  return (
    <section
      className="calibration-log"
      aria-labelledby={
        props.variant === "inline"
          ? "inline-calibration-heading"
          : "calibration-heading"
      }
      data-test-id={`calibration-log-${props.variant}`}
    >
      <div className="section-heading">
        <p className="eyebrow">Calibration Log</p>
        <h2
          id={
            props.variant === "inline"
              ? "inline-calibration-heading"
              : "calibration-heading"
          }
        >
          Projected vs. actual
        </h2>
        <p>{rollingAccuracy}</p>
      </div>

      <div className="calibration-table" role="table">
        <div role="row" className="calibration-row calibration-head">
          <span role="columnheader">Building</span>
          <span role="columnheader">Projection</span>
          <span role="columnheader">Actual</span>
          <span role="columnheader">Delta</span>
        </div>
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div role="row" className="calibration-row" key={entry.id}>
              <span role="cell">{entry.building_slug}</span>
              <span role="cell">{entry.projection_summary}</span>
              <span role="cell">{entry.actual_value_summary}</span>
              <span role="cell">{formatDelta(entry.accuracy_delta_pct)}</span>
            </div>
          ))
        ) : (
          <p className="empty-state">{t("emptyBody")}</p>
        )}
      </div>
    </section>
  );
}
