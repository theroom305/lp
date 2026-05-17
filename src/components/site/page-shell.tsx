import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";
import type {Locale} from "@/i18n/routing";
import {localizedPath} from "@/lib/seo";

type PageShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function PageShell({children}: PageShellProps) {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const showSpanishToggle = false;

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand-mark" data-test-id="site-logo">
          Room 305
        </Link>
        <nav aria-label={t("label")}>
          <Link href={localizedPath({key: "buildings", locale})}>
            {t("buildings")}
          </Link>
          <Link href={localizedPath({key: "new-developments", locale})}>
            {t("newDevelopments")}
          </Link>
          <Link href={localizedPath({key: "owners", locale})}>{t("owners")}</Link>
          <Link href={localizedPath({key: "notes", locale})}>{t("notes")}</Link>
          <Link href={localizedPath({key: "about", locale})}>{t("about")}</Link>
        </nav>
        {showSpanishToggle ? (
          <Link
            href={locale === "es" ? "/en" : "/es"}
            hrefLang={locale === "es" ? "en" : "es"}
            className="language-switch"
            data-test-id="language-switch"
          >
            {locale === "es" ? "EN" : "ES"}
          </Link>
        ) : null}
      </header>
      {children}
    </div>
  );
}
