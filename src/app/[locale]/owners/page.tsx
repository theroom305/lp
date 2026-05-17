import type {Metadata} from "next";
import {useLocale, useTranslations} from "next-intl";

import {JsonLd} from "@/components/seo/json-ld";
import type {Locale} from "@/i18n/routing";
import {breadcrumbJsonLd, localizedPath, pageMetadata} from "@/lib/seo";
import {PageShell} from "@/components/site/page-shell";

type OwnersPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export async function generateMetadata({
  params,
}: OwnersPageProps): Promise<Metadata> {
  const {locale} = await params;

  return pageMetadata({
    title: "Owners",
    description: "Room 305 owner-path scaffold.",
    key: "owners",
    locale,
  });
}

export default function OwnersPage() {
  const t = useTranslations("owners");
  const locale = useLocale() as Locale;

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          {name: "Room 305", path: localizedPath({key: "home", locale})},
          {name: "Owners", path: localizedPath({key: "owners", locale})},
        ])}
      />
      <main className="route-page" aria-labelledby="owners-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="owners-heading">{t("title")}</h1>
        <p>{t("body")}</p>
      </main>
    </PageShell>
  );
}
