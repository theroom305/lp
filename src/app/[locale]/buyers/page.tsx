import {redirect} from "next/navigation";

import type {Locale} from "@/i18n/routing";

type BuyersPageProps = Readonly<{
  params: Promise<{locale: Locale}>;
}>;

export default async function BuyersPage({params}: BuyersPageProps) {
  const {locale} = await params;

  redirect(locale === "es" ? "/es/comprar" : "/buy");
}
