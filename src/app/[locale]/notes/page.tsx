import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {
  breadcrumbJsonLd,
  localizedPath,
  notesArticleJsonLd,
  pageMetadata,
} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type NotesPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: NotesPageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    title: "Working notes",
    description: "Room 305 source-gated working notes scaffold.",
    key: "notes",
    locale,
    indexable: false,
  });
}

export default function NotesPage() {
  const t = useTranslations("notes");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd data={notesArticleJsonLd(locale)} />
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
          {name: "Notes", path: localizedPath({key: "notes", locale})},
        ])}
      />
      <main className="route-page" aria-labelledby="notes-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="notes-heading">{t("title")}</h1>
        <p>{t("body")}</p>
      </main>
    </PageShell>
  );
}
