import {useTranslations} from "next-intl";

import {BuildingShowroom} from "@/components/marketplace/building-showroom";
import {LeadMicroform} from "@/components/marketplace/lead-microform";
import {PageShell} from "@/components/site/page-shell";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <PageShell>
      <section className="hero-surface" aria-labelledby="home-heading">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 id="home-heading">{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
      </section>

      <BuildingShowroom />

      <section className="split-band" aria-labelledby="profile-heading">
        <div>
          <p className="eyebrow">{t("profileEyebrow")}</p>
          <h2 id="profile-heading">{t("profileTitle")}</h2>
          <p>{t("profileBody")}</p>
        </div>
        <LeadMicroform />
      </section>
    </PageShell>
  );
}
