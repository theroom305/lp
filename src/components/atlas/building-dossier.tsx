import Link from "next/link";

import {BuildingTonalPlate} from "@/components/marketplace/building-tonal-plate";
import {SourceDrawer, SourceStamp} from "@/components/atlas/source-provenance";
import type {BuildingDossierData} from "@/content/atlas";
import {dossierSectionOrder} from "@/content/atlas";
import type {CorridorBuilding} from "@/content/building-registry";
import {filterRenderablePublicFacts} from "@/server/claims/policy";

type BuildingDossierProps = Readonly<{
  corridorBuilding: CorridorBuilding;
  ctaHref: string;
  dossier: BuildingDossierData;
}>;

export function BuildingDossier({
  corridorBuilding,
  ctaHref,
  dossier,
}: BuildingDossierProps) {
  const orderedSections = dossierSectionOrder.map((id) => {
    const section = dossier.sections.find((entry) => entry.id === id);

    if (!section) {
      throw new Error(`Missing dossier section: ${id}`);
    }

    return section;
  });

  return (
    <main className="dossier-page" data-test-id="building-dossier">
      <header className="dossier-hero">
        <p className="eyebrow">{corridorBuilding.submarket}</p>
        <h1>{dossier.building.name}</h1>
        <SourceStamp
          label={corridorBuilding.verificationLabel}
          detail={corridorBuilding.stageLabel}
        />
      </header>

      <div className="dossier-layout">
        <aside className="dossier-context-panel">
          <BuildingTonalPlate building={corridorBuilding} variant="large" />
          <dl className="building-meta-list">
            <div>
              <dt>City</dt>
              <dd>{corridorBuilding.city}</dd>
            </div>
            <div>
              <dt>Rental-rule view</dt>
              <dd>{corridorBuilding.cadenceLabel}</dd>
            </div>
            <div>
              <dt>Brand tier</dt>
              <dd>{corridorBuilding.brandTier}</dd>
            </div>
            <div>
              <dt>Source status</dt>
              <dd>{corridorBuilding.verificationLabel}</dd>
            </div>
          </dl>
          <Link
            className="button-link button-link-primary"
            href={ctaHref}
            data-test-id="building-dossier-context-cta"
          >
            Use this building as my context →
          </Link>
        </aside>

        <div className="dossier-sections">
          {orderedSections.map((section) => (
            <section
              className="dossier-section"
              id={section.id}
              key={section.id}
              data-test-id={`dossier-section-${section.id}`}
            >
              <div className="section-heading">
                <p className="eyebrow">{section.eyebrow}</p>
                <h2>{section.label}</h2>
                <p>{section.placeholder}</p>
              </div>

              {section.id === "sources" ? (
                <SourceDrawer
                  facts={filterRenderablePublicFacts(section.facts, "public_ui")}
                />
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
