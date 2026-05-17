import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

type PageShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function PageShell({children}: PageShellProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const altLocale = locale === "es" ? "en" : "es";
  const localePrefix = `/${locale}`;
  const altHref = `/${altLocale}`;
  const buildingsHref = locale === "es" ? `${localePrefix}/edificios` : `${localePrefix}/buildings`;
  const newDevelopmentsHref =
    locale === "es"
      ? `${localePrefix}/desarrollos-nuevos`
      : `${localePrefix}/new-developments`;
  const notesHref = locale === "es" ? `${localePrefix}/notas` : `${localePrefix}/notes`;

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand-mark" data-test-id="site-logo">
          Room 305
        </Link>
        <nav aria-label={t("label")}>
          <Link href={buildingsHref}>{t("buildings")}</Link>
          <Link href={newDevelopmentsHref}>{t("newDevelopments")}</Link>
          <Link href={`${localePrefix}/owners`}>{t("owners")}</Link>
          <Link href={notesHref}>{t("notes")}</Link>
          <Link href={`${localePrefix}/about`}>{t("about")}</Link>
        </nav>
        <Link
          href={altHref}
          hrefLang={altLocale}
          className="language-switch"
          data-test-id="language-switch"
        >
          {altLocale.toUpperCase()}
        </Link>
      </header>
      {children}
    </div>
  );
}
