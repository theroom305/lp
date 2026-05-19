import Link from "next/link";
import type {ReactNode} from "react";

import {SourceStatusBadge} from "@/components/marketplace/source-status-badge";
import type {CorridorBuilding} from "@/content/building-registry";
import type {
  BuildingSourcePacket,
  SourceClaim,
} from "@/content/source-packets/types";
import type {Locale} from "@/i18n/routing";
import {shouldRenderOperatorMemo} from "@/lib/operator-memo";
import {localizedPath} from "@/lib/seo";
import {env} from "@/server/env";

type LocalizedDossierCopy = Readonly<{
  subtitle: string;
  headerNote: string;
  atAGlanceEyebrow: string;
  atAGlanceTitle: string;
  knownEyebrow: string;
  knownTitle: string;
  unknownEyebrow: string;
  unknownTitle: string;
  verifyEyebrow: string;
  verifyTitle: string;
  memoEyebrow: string;
  memoTitle: string;
  fitReviewEyebrow: string;
  fitReviewTitle: string;
  ctaTitle: string;
  ctaBody: string;
  ctaLabel: string;
  sourceFooterEyebrow: string;
  sourceFooterTitle: string;
  sourcePacketVersion: string;
  lastReviewed: string;
  reviewer: string;
  sourceUpdateNote: string;
  sourceListTitle: string;
  sampleScenario: string;
  sampleDecision: string;
  knownLabel: string;
  unknownLabel: string;
  verifyLabel: string;
  sampleKnown: readonly string[];
  sampleUnknown: readonly string[];
  sampleVerify: readonly string[];
  unknowns: readonly string[];
  verifyItems: readonly string[];
  factCards: readonly {
    claimId: string;
    label: string;
    detail: string;
  }[];
  knownClaims: readonly {
    claimId: string;
    label: string;
    detail: string;
  }[];
}>;

type BeachwalkProofDossierProps = Readonly<{
  building: CorridorBuilding;
  packet: BuildingSourcePacket;
  publicClaims: readonly SourceClaim[];
  locale: Locale;
  memo: string;
}>;

const copy: Record<Locale, LocalizedDossierCopy> = {
  en: {
    subtitle: "Hallandale Beach, Hallandale Beach intracoastal",
    headerNote:
      "Beachwalk is the first Room 305 dossier rebuilt around source packets: what is known, what remains open, and what we would verify before a buyer writes an offer.",
    atAGlanceEyebrow: "At a glance",
    atAGlanceTitle: "A working condo-hotel, not a generic condo page.",
    knownEyebrow: "Known",
    knownTitle: "What we can say from the current packet.",
    unknownEyebrow: "Unknown",
    unknownTitle: "What we will not pretend to know yet.",
    verifyEyebrow: "Verify before offer",
    verifyTitle: "The checklist that should shape the first call.",
    memoEyebrow: "Operator memo",
    memoTitle: "Isaac's note",
    fitReviewEyebrow: "Building Fit Review sample",
    fitReviewTitle: "What a one-page review looks like.",
    ctaTitle: "Talk to us about Beachwalk",
    ctaBody:
      "We'll send a real Building Fit Review based on your situation, with sources cited and unknowns named.",
    ctaLabel: "Talk to us about Beachwalk →",
    sourceFooterEyebrow: "Source packet",
    sourceFooterTitle: "What this page is based on.",
    sourcePacketVersion: "Source packet version",
    lastReviewed: "Last reviewed",
    reviewer: "Reviewer",
    sourceUpdateNote:
      "If anything here has changed, tell us. We update from sources before we turn a building opinion into a buyer recommendation.",
    sourceListTitle: "Renderable public claims",
    sampleScenario:
      "Imagine: foreign buyer, mixed personal use plus rental income, 12-month timeline, comparing Beachwalk against newer short-stay buildings.",
    sampleDecision:
      "Initial direction: Beachwalk can stay in the conversation, but only if the buyer is comfortable with an older condo-hotel operating environment and the governing-document review confirms the intended use.",
    knownLabel: "Known",
    unknownLabel: "Unknown",
    verifyLabel: "Verify Before Offer",
    sampleKnown: [
      "Public profiles consistently identify Beachwalk as a 300-unit delivered building in Hallandale Beach.",
      "The packet supports a condo-hotel reading, with public summaries describing a hotel-condominium and residential-unit mix.",
      "Room 305's current public posture is relationship depth at Beachwalk, not a published unit count or income claim.",
    ],
    sampleUnknown: [
      "The exact declaration paragraph governing rental cadence is still pending primary-record review.",
      "Current owner-use limits and rental-program contract terms must be verified for the specific path.",
      "Comp context needs a dated MLS or advisor snapshot before an offer conversation.",
    ],
    sampleVerify: [
      "Pull the recorded declaration and any current amendments.",
      "Request the current rental-program agreement and owner-use language.",
      "Review HOA reserves, recent assessments, and open board issues.",
      "Refresh closed comps for the exact stack, view, and unit condition.",
      "Confirm the buyer's intended use against the rule set before discussing units.",
    ],
    unknowns: [
      "Primary declaration review is still pending. The page names the rental-cadence question, but does not convert it into professional or offer-stage advice.",
      "The owner-use cap is not published as a settled public claim. It belongs in the pre-offer review because program terms can matter as much as headline rental cadence.",
      "Current building politics, board posture, litigation, assessments, and reserves need a fresh read before any buyer treats this as a go-forward recommendation.",
      "Current unit economics are intentionally absent. Public figures without a source packet, approved operating ledger extract, and Isaac review would weaken trust.",
    ],
    verifyItems: [
      "Recorded declaration and amendments: the exact paragraphs on rental cadence, owner use, and program participation.",
      "Current rental-program contract: who controls pricing, guest screening, blackout dates, fees, and cancellation rules.",
      "HOA reserve health: assessments, insurance pressure, litigation, and board minutes that could change ownership cost.",
      "Comparable sales: the specific tower, stack, view, furnishing condition, and timing of the closest closed transactions.",
      "Operational friction: front desk, elevator rhythm, housekeeping access, lock procedures, and guest-arrival flow.",
      "Exit path: whether the buyer's likely future buyer pool matches the unit type and program constraints.",
    ],
    factCards: [
      {
        claimId: "delivery-year",
        label: "Delivered",
        detail:
          "The completion year is stable enough for public orientation, while still sourced to a public profile until primary records are attached.",
      },
      {
        claimId: "unit-count",
        label: "Scale",
        detail:
          "The count frames building size; it is not a Room 305 operating count and should not be read as one.",
      },
      {
        claimId: "condo-hotel-mix",
        label: "Use structure",
        detail:
          "The hotel-condominium and residential split is a fit question, because buyer use depends on more than the listing.",
      },
      {
        claimId: "rental-minimum",
        label: "Rental cadence",
        detail:
          "The cadence is deliberately marked verifying until the recorded declaration is pulled into the packet.",
      },
      {
        claimId: "rental-program-shape",
        label: "Operator known",
        detail:
          "Beachwalk is treated as a working building with multiple operating paths, not as a flat condo inventory page.",
      },
    ],
    knownClaims: [
      {
        claimId: "address",
        label: "Where the building sits",
        detail:
          "The address anchors the review in Hallandale Beach, with the Intracoastal and beach-club context shaping buyer expectations.",
      },
      {
        claimId: "developer",
        label: "Developer context",
        detail:
          "Developer attribution helps compare Beachwalk with newer Related Group corridor projects, but it does not answer fit by itself.",
      },
      {
        claimId: "condo-hotel-mix",
        label: "Condo-hotel structure",
        detail:
          "The mixed structure explains why a buyer needs to ask how the specific unit participates, not just whether the building is attractive.",
      },
      {
        claimId: "comps-refresh",
        label: "Offer timing",
        detail:
          "A buyer should treat comp data as perishable. This dossier gives method; the offer packet needs a current snapshot.",
      },
    ],
  },
  es: {
    subtitle: "Hallandale Beach, intracoastal de Hallandale Beach",
    headerNote:
      "Beachwalk es el primer dossier de Room 305 reconstruido alrededor de paquetes de fuentes: lo que se sabe, lo que queda abierto, y lo que verificaríamos antes de que un comprador haga una oferta.",
    atAGlanceEyebrow: "Vista rápida",
    atAGlanceTitle: "Un condo-hotel activo, no una página genérica de condominio.",
    knownEyebrow: "Se sabe",
    knownTitle: "Lo que podemos decir con el paquete actual.",
    unknownEyebrow: "No se sabe aún",
    unknownTitle: "Lo que no vamos a fingir que sabemos.",
    verifyEyebrow: "Verificar antes de ofrecer",
    verifyTitle: "La lista que debe guiar la primera llamada.",
    memoEyebrow: "Nota operativa",
    memoTitle: "Nota de Isaac",
    fitReviewEyebrow: "Ejemplo de Building Fit Review",
    fitReviewTitle: "Cómo se ve una revisión de una página.",
    ctaTitle: "Hable con nosotros sobre Beachwalk",
    ctaBody:
      "Le enviaremos un Building Fit Review real según su situación, con fuentes citadas y preguntas abiertas nombradas.",
    ctaLabel: "Hablar sobre Beachwalk →",
    sourceFooterEyebrow: "Paquete de fuentes",
    sourceFooterTitle: "En qué se basa esta página.",
    sourcePacketVersion: "Versión del paquete",
    lastReviewed: "Última revisión",
    reviewer: "Revisor",
    sourceUpdateNote:
      "Si algo aquí cambió, díganos. Actualizamos desde fuentes antes de convertir una opinión sobre el edificio en recomendación de compra.",
    sourceListTitle: "Afirmaciones públicas renderizadas",
    sampleScenario:
      "Imagine: comprador extranjero, uso mixto personal más renta, horizonte de 12 meses, comparando Beachwalk con edificios nuevos de estadía corta.",
    sampleDecision:
      "Dirección inicial: Beachwalk puede seguir en la conversación, pero solo si el comprador se siente cómodo con un condo-hotel más establecido y la revisión de documentos confirma el uso previsto.",
    knownLabel: "Se sabe",
    unknownLabel: "No se sabe aún",
    verifyLabel: "Verificar antes de ofrecer",
    sampleKnown: [
      "Los perfiles públicos identifican de forma consistente a Beachwalk como un edificio entregado de 300 unidades en Hallandale Beach.",
      "El paquete respalda una lectura de condo-hotel, con resúmenes públicos que describen una mezcla de hotel-condominio y unidades residenciales.",
      "La postura pública actual de Room 305 es profundidad de relación en Beachwalk, no una cantidad publicada de unidades ni una afirmación de ingresos.",
    ],
    sampleUnknown: [
      "El párrafo exacto de la declaración sobre la cadencia de alquiler sigue pendiente de revisión primaria.",
      "Los límites actuales de uso del propietario y los términos del programa deben verificarse para el camino específico.",
      "El contexto de comparables requiere una captura fechada de MLS o asesor antes de hablar de oferta.",
    ],
    sampleVerify: [
      "Obtener la declaración registrada y cualquier enmienda vigente.",
      "Pedir el acuerdo actual del programa de renta y lenguaje de uso del propietario.",
      "Revisar reservas del HOA, evaluaciones recientes y asuntos abiertos de la junta.",
      "Actualizar comparables cerrados para torre, línea, vista y condición de unidad.",
      "Confirmar el uso previsto del comprador contra las reglas antes de hablar de unidades.",
    ],
    unknowns: [
      "La revisión primaria de la declaración sigue pendiente. La página nombra la pregunta de cadencia, pero no la convierte en consejo profesional ni de oferta.",
      "El límite de uso del propietario no se publica como afirmación cerrada. Pertenece a la revisión previa a oferta porque los términos del programa pueden importar tanto como la cadencia.",
      "Política interna del edificio, postura de junta, litigios, evaluaciones y reservas necesitan lectura fresca antes de tratar esto como recomendación.",
      "La economía de unidad está intencionalmente ausente. Cifras públicas sin paquete de fuentes, extracto operativo aprobado y revisión de Isaac debilitarían la confianza.",
    ],
    verifyItems: [
      "Declaración registrada y enmiendas: párrafos exactos sobre cadencia de renta, uso del propietario y participación en programa.",
      "Contrato actual del programa: quién controla precios, selección de huéspedes, fechas bloqueadas, cargos y cancelaciones.",
      "Salud de reservas del HOA: evaluaciones, presión de seguro, litigios y actas que puedan cambiar el costo de propiedad.",
      "Ventas comparables: torre, línea, vista, condición y fecha de las transacciones cerradas más cercanas.",
      "Fricción operativa: recepción, ascensores, acceso de limpieza, cerraduras y flujo de llegada del huésped.",
      "Camino de salida: si el futuro comprador probable coincide con el tipo de unidad y sus restricciones.",
    ],
    factCards: [
      {
        claimId: "delivery-year",
        label: "Entrega",
        detail:
          "El año de entrega sirve para orientación pública, aunque permanece citado a un perfil público hasta adjuntar registros primarios.",
      },
      {
        claimId: "unit-count",
        label: "Escala",
        detail:
          "El conteo enmarca el tamaño del edificio; no es una cantidad de unidades operadas por Room 305.",
      },
      {
        claimId: "condo-hotel-mix",
        label: "Estructura de uso",
        detail:
          "La mezcla hotel-condominio y residencial es una pregunta de encaje, porque el uso depende de más que el listado.",
      },
      {
        claimId: "rental-minimum",
        label: "Cadencia de renta",
        detail:
          "La cadencia se marca en verificación hasta incorporar la declaración registrada al paquete.",
      },
      {
        claimId: "rental-program-shape",
        label: "Conocimiento operativo",
        detail:
          "Beachwalk se trata como edificio activo con varios caminos operativos, no como inventario plano.",
      },
    ],
    knownClaims: [
      {
        claimId: "address",
        label: "Dónde está el edificio",
        detail:
          "La dirección ancla la revisión en Hallandale Beach, con el contexto de Intracoastal y club de playa formando expectativas.",
      },
      {
        claimId: "developer",
        label: "Contexto de desarrollador",
        detail:
          "La atribución ayuda a comparar Beachwalk con proyectos nuevos de Related Group, pero no responde el encaje por sí sola.",
      },
      {
        claimId: "condo-hotel-mix",
        label: "Estructura condo-hotel",
        detail:
          "La mezcla explica por qué el comprador debe preguntar cómo participa la unidad específica, no solo si el edificio se ve atractivo.",
      },
      {
        claimId: "comps-refresh",
        label: "Momento de oferta",
        detail:
          "El comprador debe tratar los comparables como perecederos. Este dossier da método; el paquete de oferta necesita captura actual.",
      },
    ],
  },
};

function claimsById(claims: readonly SourceClaim[]): Map<string, SourceClaim> {
  return new Map(claims.map((claim) => [claim.claimId, claim]));
}

function renderClaimStatus(
  claim: SourceClaim | undefined,
  locale: Locale,
): ReactNode {
  return claim ? <SourceStatusBadge claim={claim} locale={locale} /> : null;
}

export function BeachwalkProofDossier({
  building,
  packet,
  publicClaims,
  locale,
  memo,
}: BeachwalkProofDossierProps) {
  const t = copy[locale];
  const publicClaimMap = claimsById(publicClaims);
  const ctaHref = `${localizedPath({
    key: "buy",
    locale,
  })}?building=beachwalk-resort&intent=buy`;
  const shouldRenderMemo = shouldRenderOperatorMemo(
    env.FOUNDER_VOICE_APPROVED,
    memo,
  );

  return (
    <main
      className="beachwalk-proof-dossier"
      data-test-id="beachwalk-proof-dossier"
    >
      <header
        className="beachwalk-dossier-header"
        data-test-id="beachwalk-section-header"
      >
        <p className="eyebrow">{building.submarket}</p>
        <h1>{building.name}</h1>
        <p>{t.subtitle}</p>
        <p>{t.headerNote}</p>
        <div className="source-stat-strip" aria-label="Beachwalk source status">
          {t.factCards.slice(0, 5).map((fact) => {
            const claim = publicClaimMap.get(fact.claimId);

            return (
              <span className="source-stat" key={fact.claimId}>
                <strong>{fact.label}</strong>
                {renderClaimStatus(claim, locale)}
              </span>
            );
          })}
        </div>
      </header>

      <section
        className="beachwalk-section"
        data-test-id="beachwalk-section-at-a-glance"
      >
        <div className="section-heading">
          <p className="eyebrow">{t.atAGlanceEyebrow}</p>
          <h2>{t.atAGlanceTitle}</h2>
        </div>
        <div className="source-fact-grid">
          {t.factCards.map((fact) => {
            const claim = publicClaimMap.get(fact.claimId);

            return (
              <article className="source-fact-card" key={fact.claimId}>
                <h3>{fact.label}</h3>
                <p>{fact.detail}</p>
                {renderClaimStatus(claim, locale)}
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="beachwalk-section"
        data-test-id="beachwalk-section-known"
      >
        <div className="section-heading">
          <p className="eyebrow">{t.knownEyebrow}</p>
          <h2>{t.knownTitle}</h2>
        </div>
        <div className="claim-stack">
          {t.knownClaims.map((entry) => {
            const claim = publicClaimMap.get(entry.claimId);

            return (
              <article className="claim-row" key={entry.claimId}>
                <div>
                  <h3>{entry.label}</h3>
                  <p>{entry.detail}</p>
                  {claim ? <p>{claim.publicText}</p> : null}
                </div>
                {renderClaimStatus(claim, locale)}
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="beachwalk-section"
        data-test-id="beachwalk-section-unknown"
      >
        <div className="section-heading">
          <p className="eyebrow">{t.unknownEyebrow}</p>
          <h2>{t.unknownTitle}</h2>
        </div>
        <ul className="truth-list">
          {t.unknowns.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        className="beachwalk-section"
        data-test-id="beachwalk-section-verify-before-offer"
      >
        <div className="section-heading">
          <p className="eyebrow">{t.verifyEyebrow}</p>
          <h2>{t.verifyTitle}</h2>
        </div>
        <ol className="verify-list">
          {t.verifyItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      {shouldRenderMemo ? (
        <section
          className="beachwalk-section operator-memo-section"
          data-test-id="beachwalk-section-operator-memo"
        >
          <p className="eyebrow">{t.memoEyebrow}</p>
          <h2>{t.memoTitle}</h2>
          <blockquote className="operator-quote">{memo.trim()}</blockquote>
        </section>
      ) : null}

      <section
        className="beachwalk-section fit-review-sample"
        data-test-id="beachwalk-section-fit-review-sample"
      >
        <div className="section-heading">
          <p className="eyebrow">{t.fitReviewEyebrow}</p>
          <h2>{t.fitReviewTitle}</h2>
          <p>{t.sampleScenario}</p>
        </div>
        <div className="fit-review-grid">
          <article>
            <h3>{t.knownLabel}</h3>
            <ul>
              {t.sampleKnown.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>{t.unknownLabel}</h3>
            <ul>
              {t.sampleUnknown.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>{t.verifyLabel}</h3>
            <ul>
              {t.sampleVerify.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        <p className="fit-review-decision">{t.sampleDecision}</p>
      </section>

      <section className="beachwalk-cta-band" data-test-id="beachwalk-section-cta">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaBody}</p>
        <Link className="button-link button-link-primary" href={ctaHref}>
          {t.ctaLabel}
        </Link>
      </section>

      <footer
        className="beachwalk-source-footer"
        data-test-id="beachwalk-section-source-footer"
      >
        <div>
          <p className="eyebrow">{t.sourceFooterEyebrow}</p>
          <h2>{t.sourceFooterTitle}</h2>
        </div>
        <dl className="source-packet-meta">
          <div>
            <dt>{t.sourcePacketVersion}</dt>
            <dd>{packet.packetVersion}</dd>
          </div>
          <div>
            <dt>{t.lastReviewed}</dt>
            <dd>{packet.lastReviewedAt}</dd>
          </div>
          {packet.humanReviewer ? (
            <div>
              <dt>{t.reviewer}</dt>
              <dd>{packet.humanReviewer}</dd>
            </div>
          ) : null}
        </dl>
        <p>{t.sourceUpdateNote}</p>
        <details className="source-claim-list" open>
          <summary>{t.sourceListTitle}</summary>
          <ul>
            {publicClaims.map((claim) => (
              <li key={claim.claimId}>
                <span>{claim.publicText}</span>
                <SourceStatusBadge claim={claim} locale={locale} />
              </li>
            ))}
          </ul>
        </details>
      </footer>
    </main>
  );
}
