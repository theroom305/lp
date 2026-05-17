import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {BuildingShowroom} from "@/components/marketplace/building-showroom";
import {LeadMicroform} from "@/components/marketplace/lead-microform";
import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {breadcrumbJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type HomePageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    description:
      "Room 305 scaffold for South Florida building intelligence and founder-led follow-up.",
    key: "home",
    locale,
  });
}

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
        ])}
      />
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
