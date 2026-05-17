import type {BuildingDossierData} from "@/content/atlas";
import {dossierSectionOrder} from "@/content/atlas";
import {CalibrationLog} from "@/components/atlas/calibration-log";
import {MemoSplitCTA} from "@/components/atlas/memo-split-cta";
import {
  OwnerTakeoverCTA,
  OwnerTakeoverIntakeForm,
} from "@/components/atlas/owner-takeover";
import {SourceDrawer, SourceStamp} from "@/components/atlas/source-provenance";
import {filterRenderablePublicFacts} from "@/server/claims/policy";

type BuildingDossierProps = Readonly<{
  dossier: BuildingDossierData;
}>;

export function BuildingDossier({dossier}: BuildingDossierProps) {
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
        <p className="eyebrow">{dossier.building.city}</p>
        <h1>{dossier.building.name}</h1>
        <SourceStamp
          label={dossier.building.verificationState.replaceAll("_", " ")}
          detail={dossier.building.stage.replaceAll("_", " ")}
        />
      </header>

      <div className="dossier-layout">
        <nav className="dossier-anchor-nav" aria-label="Dossier sections">
          {orderedSections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.label}
            </a>
          ))}
        </nav>

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

              {section.id === "operator-notes" ? (
                <CalibrationLog
                  variant="inline"
                  buildingSlug={dossier.building.slug}
                />
              ) : null}

              {section.id === "ownership-path" && dossier.building.isDelivered ? (
                <>
                  <OwnerTakeoverCTA buildingSlug={dossier.building.slug} />
                  <OwnerTakeoverIntakeForm buildingSlug={dossier.building.slug} />
                </>
              ) : null}

              {section.id === "sources" ? (
                <SourceDrawer
                  facts={filterRenderablePublicFacts(section.facts, "public_ui")}
                />
              ) : null}

              {section.id === "memo-split" ? (
                <MemoSplitCTA
                  buildingSlug={dossier.building.slug}
                  stage={dossier.building.stage}
                />
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
