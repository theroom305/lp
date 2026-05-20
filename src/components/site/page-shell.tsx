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

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand-mark" data-test-id="site-logo">
          {/* Tiny static header mark; next/image inflates shared route JS here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Room 305"
            className="brand-logo"
            height={63}
            src="/brand/room305-logo.png"
            width={81}
          />
        </Link>
        <nav aria-label={t("label")}>
          <Link href={localizedPath({key: "buy", locale})}>{t("buy")}</Link>
          <Link href={localizedPath({key: "own", locale})}>{t("own")}</Link>
          <Link href={localizedPath({key: "sell", locale})}>{t("sell")}</Link>
          <Link href={localizedPath({key: "contact", locale})}>
            {t("contact")}
          </Link>
        </nav>
        <Link
          href={locale === "es" ? "/en" : "/es"}
          hrefLang={locale === "es" ? "en" : "es"}
          className="language-switch"
          data-test-id="language-switch"
        >
          {locale === "es" ? "EN" : "ES"}
        </Link>
      </header>
      {children}
    </div>
  );
}
