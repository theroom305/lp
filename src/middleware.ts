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
  "/own",
  "/owners",
  "/sell",
] as const;

const vercelLiveOrigin = "https://vercel.live";

function shouldRewriteToEnglish(pathname: string): boolean {
  return (
    pathname === "/" ||
    englishRewriteRoots.some(
      (root) => pathname === root || pathname.startsWith(`${root}/`),
    )
  );
}

function isPublicPageOptionsRequest(request: NextRequest): boolean {
  return request.method === "OPTIONS";
}

function createPublicPageOptionsResponse(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const requestedHeaders =
    request.headers.get("access-control-request-headers") ?? "";

  const response = new NextResponse(null, {status: 204});
  response.headers.set("access-control-allow-methods", "GET, HEAD, OPTIONS");
  response.headers.set("access-control-max-age", "86400");

  if (origin === vercelLiveOrigin) {
    response.headers.set("access-control-allow-origin", vercelLiveOrigin);
  }

  if (requestedHeaders.length > 0) {
    response.headers.set("access-control-allow-headers", requestedHeaders);
  }

  return response;
}

export default function middleware(request: NextRequest) {
  if (isPublicPageOptionsRequest(request)) {
    return createPublicPageOptionsResponse(request);
  }

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
