import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {CalibrationLog} from "@/components/atlas/calibration-log";
import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {breadcrumbJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type CalibrationPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: CalibrationPageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    title: "Calibration log",
    description: "Room 305 projected-vs-actual calibration scaffold.",
    key: "calibration",
    locale,
  });
}

export default function CalibrationPage() {
  const t = useTranslations("calibration");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
          {
            name: "Calibration",
            path: localizedPath({key: "calibration", locale}),
          },
        ])}
      />
      <main className="route-page calibration-page" aria-labelledby="calibration-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="calibration-heading">{t("title")}</h1>
        <p>{t("body")}</p>
        <CalibrationLog variant="aggregator" />
      </main>
    </PageShell>
  );
}
