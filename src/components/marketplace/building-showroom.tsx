import {useTranslations} from "next-intl";

import {buildings} from "@/content/buildings";

export function BuildingShowroom() {
  const t = useTranslations("showroom");

  return (
    <section className="showroom" aria-labelledby="showroom-heading">
      <div className="section-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 id="showroom-heading">{t("title")}</h2>
      </div>
      <div className="building-grid">
        {buildings.map((building) => (
          <article
            key={building.slug}
            className="building-card"
            data-test-id={`building-card-${building.slug}`}
          >
            <div
              className="building-card-media"
              data-tone={building.tone}
              aria-hidden="true"
            />
            <div className="building-card-body">
              <div>
                <h3>{building.name}</h3>
                <p>{building.neighborhood}</p>
              </div>
              <span>{building.status}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
