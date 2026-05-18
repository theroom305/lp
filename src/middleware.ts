import createMiddleware from "next-intl/middleware";
import {NextRequest, NextResponse} from "next/server";

import {routing} from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const englishRewriteRoots = [
  "/about",
  "/buy",
  "/buyers",
  "/buildings",
  "/calibration",
  "/contact",
  "/new-developments",
  "/notes",
  "/owners",
  "/sell",
] as const;

function shouldRewriteToEnglish(pathname: string): boolean {
  return (
    pathname === "/" ||
    englishRewriteRoots.some(
      (root) => pathname === root || pathname.startsWith(`${root}/`),
    )
  );
}

export default function middleware(request: NextRequest) {
  if (shouldRewriteToEnglish(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname =
      request.nextUrl.pathname === "/"
        ? "/en"
        : `/en${request.nextUrl.pathname}`;

    return NextResponse.rewrite(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|admin|trpc|_next|_vercel|.*\\..*).*)",
};
