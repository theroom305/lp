import type {Locale} from "@/i18n/routing";
import {claimFreshness} from "@/lib/source-packets";
import type {SourceClaim, SourceType} from "@/content/source-packets/types";

type SourceStatusBadgeProps = Readonly<{
  claim: SourceClaim;
  locale: Locale;
}>;

const sourceTypeLabels: Record<SourceType, {en: string; es: string}> = {
  "recorded-declaration": {
    en: "Recorded declaration",
    es: "Declaración registrada",
  },
  "hoa-document": {
    en: "HOA document",
    es: "Documento del HOA",
  },
  "operator-observation": {
    en: "Operator observation",
    es: "Observación operativa",
  },
  "secondary-marketing": {
    en: "Public market source",
    es: "Fuente pública de mercado",
  },
  press: {
    en: "Press",
    es: "Prensa",
  },
  "primary-record": {
    en: "Primary record",
    es: "Registro primario",
  },
};

function formatMonthYear(date: string, locale: Locale): string {
  const formatter = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });

  return formatter.format(new Date(`${date}T00:00:00Z`));
}

export function SourceStatusBadge({claim, locale}: SourceStatusBadgeProps) {
  const renderState = claimFreshness(claim);
  const sourceLabel = sourceTypeLabels[claim.sourceType][locale];
  const observed = formatMonthYear(claim.observedDate, locale);
  const validThrough = claim.validThroughDate
    ? formatMonthYear(claim.validThroughDate, locale)
    : null;

  const statusText =
    claim.confidence === "verifying"
      ? locale === "es"
        ? `En verificación ${observed}`
        : `Verifying ${observed}`
      : renderState.isReviewDue && validThrough
        ? locale === "es"
          ? `Revisar antes de ${validThrough}`
          : `Review due ${validThrough}`
        : locale === "es"
          ? `Verificado ${observed}`
          : `Verified ${observed}`;

  return (
    <span
      className="source-status-badge"
      data-freshness-state={renderState.state}
      data-test-id={`source-status-${claim.claimId}`}
    >
      <span aria-hidden="true" className="source-status-dot" />
      <span>{statusText}</span>
      <span className="source-status-source">
        {locale === "es" ? "Fuente" : "Source"}: {sourceLabel}
      </span>
    </span>
  );
}
