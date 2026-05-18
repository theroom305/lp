import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {
  breadcrumbJsonLd,
  founderPersonJsonLd,
  localizedPath,
  pageMetadata,
} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type AboutPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    title: "Method",
    description: "Room 305 method scaffold and founder context.",
    key: "about",
    locale,
    indexable: false,
  });
}

export default function AboutPage() {
  const t = useTranslations("about");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd data={founderPersonJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
          {name: "Method", path: localizedPath({key: "about", locale})},
        ])}
      />
      <main className="route-page" aria-labelledby="about-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="about-heading">{t("title")}</h1>
        <p>{t("body")}</p>
      </main>
    </PageShell>
  );
}
