import {useTranslations} from "next-intl";

import {LeadMicroform} from "@/components/marketplace/lead-microform";
import {PageShell} from "@/components/site/page-shell";

export default function ContactPage() {
  const t = useTranslations("contact");

  return (
    <PageShell>
      <main className="route-page" aria-labelledby="contact-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="contact-heading">{t("title")}</h1>
        <p>{t("body")}</p>
        <LeadMicroform />
      </main>
    </PageShell>
  );
}
