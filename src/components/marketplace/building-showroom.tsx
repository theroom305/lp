import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {BuildingTonalPlate} from "@/components/marketplace/building-tonal-plate";
import {corridorBuildings} from "@/content/building-registry";
import type {Locale} from "@/i18n/routing";
import {localizedPath} from "@/lib/seo";

function buildingContextHref(buildingSlug: string, locale: Locale): string {
  const buyPath = localizedPath({key: "buy", locale});
  return `${buyPath}?building=${encodeURIComponent(buildingSlug)}&intent=buy`;
}

export function BuildingShowroom() {
  const t = useTranslations("showroom");
  const locale = useLocale() as Locale;

  return (
    <section
      className="showroom atlas-showroom"
      aria-labelledby="showroom-heading"
      data-test-id="building-showroom"
    >
      <div className="section-heading showroom-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 id="showroom-heading">{t("title")}</h2>
        <p>{t("body")}</p>
      </div>
      <div className="building-grid">
        {corridorBuildings.map((building) => (
          <article
            key={building.slug}
            className="building-card"
            data-test-id={`building-card-${building.slug}`}
          >
            <Link
              className="building-card-link"
              href={localizedPath({
                key: "building",
                locale,
                slug: building.slug,
              })}
            >
              <BuildingTonalPlate building={building} />
              <div className="building-card-body">
                <div className="building-card-copy">
                  <h3>{building.name}</h3>
                  <p>{building.submarket}</p>
                </div>
                <span className="building-card-badge">
                  {building.cadenceLabel}
                </span>
              </div>
            </Link>
            <div className="building-card-actions">
              <span>{building.verificationLabel}</span>
              <Link
                href={buildingContextHref(building.slug, locale)}
                data-test-id={`building-context-${building.slug}`}
              >
                {t("useContext")}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
