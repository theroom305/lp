import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
