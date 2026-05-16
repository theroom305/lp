import {useTranslations} from "next-intl";

import {PageShell} from "@/components/site/page-shell";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <PageShell>
      <main className="route-page" aria-labelledby="about-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="about-heading">{t("title")}</h1>
        <p>{t("body")}</p>
      </main>
    </PageShell>
  );
}
