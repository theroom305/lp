"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {type FormEvent, useState} from "react";

import {corridorBuildings} from "@/content/building-registry";
import type {Locale} from "@/i18n/routing";
import {trackEvent} from "@/lib/analytics";

type PathKey = "buying" | "own" | "selling";

type HomeFunnelHeroProps = Readonly<{
  locale: Locale;
  title: string;
  subcopy: string;
  buyingLabel: string;
  ownLabel: string;
  sellingLabel: string;
  buildingPlaceholder: string;
  pathSelectorLabel: string;
  trustLine: string;
  atlasHref: string;
  atlasLabel: string;
  buyHref: string;
  ownHref: string;
  sellHref: string;
  visualEyebrow: string;
  visualBuilding: string;
  visualKnown: string;
  visualUnknown: string;
  visualVerify: string;
  visualSource: string;
  visualReply: string;
}>;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasAtlasMatch(value: string): boolean {
  const normalized = normalize(value);

  if (normalized.length === 0) {
    return false;
  }

  return corridorBuildings.some((building) => {
    const candidates = [
      building.slug,
      building.name,
      building.city,
      building.submarket,
    ].map(normalize);

    return candidates.some(
      (candidate) => normalized.includes(candidate) || candidate.includes(normalized),
    );
  });
}

export function HomeFunnelHero({
  locale,
  title,
  subcopy,
  buyingLabel,
  ownLabel,
  sellingLabel,
  buildingPlaceholder,
  pathSelectorLabel,
  trustLine,
  atlasHref,
  atlasLabel,
  buyHref,
  ownHref,
  sellHref,
  visualEyebrow,
  visualBuilding,
  visualKnown,
  visualUnknown,
  visualVerify,
  visualSource,
  visualReply,
}: HomeFunnelHeroProps) {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<PathKey>("buying");
  const pathHref: Record<PathKey, string> = {
    buying: buyHref,
    own: ownHref,
    selling: sellHref,
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const submittedPath =
      submitter instanceof HTMLButtonElement
        ? (submitter.value as PathKey)
        : selectedPath;
    const building = String(form.get("buildingOrArea") ?? "").trim();
    const href = pathHref[submittedPath];
    const url = new URL(href, window.location.origin);

    if (building.length > 0) {
      url.searchParams.set("buildingName", building);
      trackEvent("building_entered", {
        has_atlas_match: hasAtlasMatch(building),
        locale,
      });
    }

    trackEvent("path_selected", {path: submittedPath, locale});
    router.push(`${url.pathname}${url.search}`);
  }

  return (
    <section className="home-funnel-hero" aria-labelledby="home-heading">
      <div className="hero-bitmap-media" data-test-id="hero-bitmap">
        <div className="hero-proof-visual">
          <div className="hero-proof-panel">
            <p>{visualEyebrow}</p>
            <p className="proof-building-name">{visualBuilding}</p>
            <ul>
              <li>{visualKnown}</li>
              <li>{visualUnknown}</li>
              <li>{visualVerify}</li>
            </ul>
          </div>
          <div className="hero-proof-footer">
            <span>{visualSource}</span>
            <strong>{visualReply}</strong>
          </div>
        </div>
      </div>
      <div className="home-funnel-copy">
        <h1 id="home-heading">{title}</h1>
        <p>{subcopy}</p>
        <form className="path-selector" onSubmit={onSubmit}>
          <label htmlFor="home-building-input" className="sr-only">
            {buildingPlaceholder}
          </label>
          <input
            id="home-building-input"
            name="buildingOrArea"
            placeholder={buildingPlaceholder}
            data-test-id="home-building-input"
          />
          <div className="path-selector-actions" aria-label={pathSelectorLabel}>
            <button
              className="button-link button-link-primary"
              type="submit"
              value="buying"
              onClick={() => setSelectedPath("buying")}
              data-test-id="hero-buy"
            >
              {buyingLabel}
            </button>
            <button
              className="button-link"
              type="submit"
              value="own"
              onClick={() => setSelectedPath("own")}
              data-test-id="hero-own"
            >
              {ownLabel}
            </button>
            <button
              className="button-link"
              type="submit"
              value="selling"
              onClick={() => setSelectedPath("selling")}
              data-test-id="hero-sell"
            >
              {sellingLabel}
            </button>
          </div>
        </form>
        <p className="home-trust-line">{trustLine}</p>
        <Link
          className="text-link atlas-home-link"
          href={atlasHref}
          onClick={() => trackEvent("atlas_link_clicked", {locale})}
        >
          {atlasLabel}
        </Link>
      </div>
    </section>
  );
}
