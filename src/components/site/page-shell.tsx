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

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand-mark" data-test-id="site-logo">
          Room 305
        </Link>
        <nav aria-label={t("label")}>
          <Link href={`${localePrefix}/buyers`}>{t("buyers")}</Link>
          <Link href={`${localePrefix}/owners`}>{t("owners")}</Link>
          <Link href={`${localePrefix}/about`}>{t("about")}</Link>
          <Link href={`${localePrefix}/contact`}>{t("contact")}</Link>
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
