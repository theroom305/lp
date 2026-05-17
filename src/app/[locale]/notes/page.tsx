import {useTranslations} from "next-intl";

import {PageShell} from "@/components/site/page-shell";

export default function NotesPage() {
  const t = useTranslations("notes");

  return (
    <PageShell>
      <main className="route-page" aria-labelledby="notes-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="notes-heading">{t("title")}</h1>
        <p>{t("body")}</p>
      </main>
    </PageShell>
  );
}
