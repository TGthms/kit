import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  outputFileTracingRoot: __dirname,
  // Avoid turbopack issues with static export + workers in CI
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
