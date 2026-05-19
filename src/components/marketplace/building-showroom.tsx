import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {BuildingTonalPlate} from "@/components/marketplace/building-tonal-plate";
import {featuredBuildings} from "@/content/featured-buildings";
import type {Locale} from "@/i18n/routing";
import {localizedPath} from "@/lib/seo";

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
        {featuredBuildings.map((building) => (
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
                <span className="building-card-source">
                  {building.verificationLabel}
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
