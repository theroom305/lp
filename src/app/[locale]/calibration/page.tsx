import {useTranslations} from "next-intl";

import {CalibrationLog} from "@/components/atlas/calibration-log";
import {PageShell} from "@/components/site/page-shell";

export default function CalibrationPage() {
  const t = useTranslations("calibration");

  return (
    <PageShell>
      <main className="route-page calibration-page" aria-labelledby="calibration-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="calibration-heading">{t("title")}</h1>
        <p>{t("body")}</p>
        <CalibrationLog variant="aggregator" />
      </main>
    </PageShell>
  );
}
