"use client";

import {useTranslations} from "next-intl";
import {useEffect, useState} from "react";

import {
  submarketFilterIds,
  type SubmarketFilterId,
} from "@/lib/submarket-mapping";

const GRID_SELECTOR = '[data-test-id="buildings-index"]';

export function SubmarketFilter() {
  const t = useTranslations("buildings");
  const [activeFilter, setActiveFilter] = useState<SubmarketFilterId>("all");

  useEffect(() => {
    const grid = document.querySelector(GRID_SELECTOR);
    if (grid) {
      grid.setAttribute("data-active-submarket", activeFilter);
    }
  }, [activeFilter]);

  return (
    <section className="submarket-filter" aria-label={t("filters.label")}>
      <div className="submarket-chip-row" role="list">
        {submarketFilterIds.map((id) => (
          <button
            aria-pressed={activeFilter === id}
            className="submarket-chip"
            data-test-id={`submarket-chip-${id}`}
            key={id}
            onClick={() => setActiveFilter(id)}
            type="button"
          >
            {t(`filters.${id}`)}
          </button>
        ))}
      </div>
    </section>
  );
}
