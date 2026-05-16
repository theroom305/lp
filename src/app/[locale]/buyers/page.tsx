import {useTranslations} from "next-intl";

import {LeadMicroform} from "@/components/marketplace/lead-microform";
import {PageShell} from "@/components/site/page-shell";

export default function BuyersPage() {
  const t = useTranslations("buyers");

  return (
    <PageShell>
      <main className="route-page" aria-labelledby="buyers-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="buyers-heading">{t("title")}</h1>
        <p>{t("body")}</p>
        <LeadMicroform />
      </main>
    </PageShell>
  );
}
