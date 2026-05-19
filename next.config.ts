import createBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDevelopment = process.env.NODE_ENV === "development";
const allowsVercelLive = process.env.VERCEL_ENV === "preview";
const vercelLiveSource = allowsVercelLive ? " https://vercel.live" : "";

const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://plausible.io${vercelLiveSource}${isDevelopment ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:${vercelLiveSource};
  font-src 'self';
  connect-src 'self' https: https://plausible.io${vercelLiveSource};
  frame-src 'self'${vercelLiveSource};
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [40, 70],
  },
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/es/edificios/:slug",
          destination: "/es/buildings/:slug",
        },
        {
          source: "/es/edificios",
          destination: "/es/buildings",
        },
        {
          source: "/es/desarrollos-nuevos",
          destination: "/es/new-developments",
        },
        {
          source: "/es/propietarios",
          destination: "/es/owners",
        },
        {
          source: "/es/ya-tengo-propiedad",
          destination: "/es/own",
        },
        {
          source: "/es/notas",
          destination: "/es/notes",
        },
        {
          source: "/es/metodo",
          destination: "/es/about",
        },
        {
          source: "/es/contacto",
          destination: "/es/contact",
        },
        {
          source: "/es/comprar",
          destination: "/es/buy",
        },
        {
          source: "/es/vender",
          destination: "/es/sell",
        },
        {
          source: "/es/calibracion",
          destination: "/es/calibration",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

export default withBundleAnalyzer(withNextIntl(nextConfig));
