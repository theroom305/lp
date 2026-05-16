import {useTranslations} from "next-intl";

import {PageShell} from "@/components/site/page-shell";

export default function OwnersPage() {
  const t = useTranslations("owners");

  return (
    <PageShell>
      <main className="route-page" aria-labelledby="owners-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="owners-heading">{t("title")}</h1>
        <p>{t("body")}</p>
      </main>
    </PageShell>
  );
}
