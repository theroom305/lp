import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {v1Buildings} from "@/content/atlas";
import {PageShell} from "@/components/site/page-shell";

export default function BuildingsPage() {
  const t = useTranslations("buildings");
  const locale = useLocale();

  return (
    <PageShell>
      <main className="route-page atlas-index" aria-labelledby="buildings-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="buildings-heading">{t("title")}</h1>
        <p>{t("body")}</p>

        <div className="atlas-grid" data-test-id="buildings-index">
          {v1Buildings.map((building) => (
            <Link
              className="atlas-card"
              href={
                locale === "es"
                  ? `/es/edificios/${building.slug}`
                  : `/en/buildings/${building.slug}`
              }
              key={building.slug}
              data-test-id={`building-card-${building.slug}`}
            >
              <span>{building.city}</span>
              <h2>{building.name}</h2>
              <p>{building.stage.replaceAll("_", " ")}</p>
            </Link>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
