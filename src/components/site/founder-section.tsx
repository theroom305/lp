import {existsSync} from "node:fs";
import {join} from "node:path";

import Image from "next/image";
import {useTranslations} from "next-intl";

import {corridorBuildings} from "@/content/building-registry";
import {env} from "@/server/env";

function founderAssetPath(fileName: string): string {
  return join(process.cwd(), "public", "founder", fileName);
}

function assertFounderAssetsReady(): void {
  const missing = ["isaac.avif", "isaac.webp"].filter(
    (fileName) => !existsSync(founderAssetPath(fileName)),
  );

  if (missing.length > 0) {
    throw new Error(
      `FOUNDER_SECTION_LIVE=true but founder photo file(s) missing: ${missing
        .map((fileName) => `/public/founder/${fileName}`)
        .join(", ")}`,
    );
  }

  if (!env.FOUNDER_YEARS_OPERATING) {
    throw new Error(
      "FOUNDER_SECTION_LIVE=true but FOUNDER_YEARS_OPERATING is not set.",
    );
  }
}

if (env.FOUNDER_SECTION_LIVE) {
  assertFounderAssetsReady();
}

export function FounderSection() {
  const t = useTranslations("home.founder");

  if (!env.FOUNDER_SECTION_LIVE) {
    return null;
  }

  const memo = t("memo").trim();

  if (memo.length === 0) {
    throw new Error("FOUNDER_SECTION_LIVE=true but founder memo is empty.");
  }

  return (
    <section
      className="founder-profile-band"
      aria-labelledby="founder-profile-heading"
      data-test-id="founder-section"
    >
      <div className="founder-photo-frame">
        <picture>
          <source srcSet="/founder/isaac.webp" type="image/webp" />
          <Image
            alt={t("name")}
            height={140}
            priority
            src="/founder/isaac.avif"
            width={140}
          />
        </picture>
      </div>
      <div className="founder-profile-copy">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 id="founder-profile-heading">{t("name")}</h2>
        <p className="founder-role">{t("role")}</p>
        <ul className="founder-stat-row" aria-label="Founder context">
          <li>
            {env.FOUNDER_YEARS_OPERATING} {t("statLabelYears")}
          </li>
          <li>{corridorBuildings.length} {t("statLabelBuildings")}</li>
          <li>{t("statLabelLanguages")}</li>
        </ul>
        <p className="founder-memo">{memo}</p>
      </div>
    </section>
  );
}
