import {useTranslations} from "next-intl";

import {v1Buildings, type BuildingRecord} from "@/content/atlas";

function toneForBuilding(building: BuildingRecord): "coast" | "city" | "garden" {
  if (building.city.includes("Hallandale") || building.city.includes("Hollywood")) {
    return "coast";
  }

  return building.stage === "stabilized" ? "garden" : "city";
}

export function BuildingShowroom() {
  const t = useTranslations("showroom");

  return (
    <section className="showroom" aria-labelledby="showroom-heading">
      <div className="section-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 id="showroom-heading">{t("title")}</h2>
      </div>
      <div className="building-grid">
        {v1Buildings.map((building) => (
          <article
            key={building.slug}
            className="building-card"
            data-test-id={`building-card-${building.slug}`}
          >
            <div
              className="building-card-media"
              data-tone={toneForBuilding(building)}
              aria-hidden="true"
            />
            <div className="building-card-body">
              <div className="building-card-copy">
                <h3>{building.name}</h3>
                <p>{building.city}</p>
              </div>
              <span className="building-card-badge">
                {building.verificationState.replaceAll("_", " ")}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
