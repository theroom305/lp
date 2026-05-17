import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {getNewDevelopmentBuildings} from "@/content/atlas";
import {PageShell} from "@/components/site/page-shell";

export default function NewDevelopmentsPage() {
  const t = useTranslations("newDevelopments");
  const locale = useLocale();
  const buildings = getNewDevelopmentBuildings();

  return (
    <PageShell>
      <main
        className="route-page atlas-index"
        aria-labelledby="new-developments-heading"
      >
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="new-developments-heading">{t("title")}</h1>
        <p>{t("body")}</p>

        <div className="atlas-grid" data-test-id="new-developments-index">
          {buildings.map((building) => (
            <Link
              className="atlas-card"
              href={
                locale === "es"
                  ? `/es/edificios/${building.slug}`
                  : `/en/buildings/${building.slug}`
              }
              key={building.slug}
              data-test-id={`new-development-card-${building.slug}`}
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
