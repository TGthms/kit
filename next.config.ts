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
  // pdf.js optionally imports node-canvas. Next 16 builds with Turbopack
  // by default and refuses a webpack() hook, so alias it here instead.
  turbopack: {
    resolveAlias: {
      canvas: {
        browser: "./src/lib/empty-module.ts",
      },
    },
  },
};

export default withNextIntl(nextConfig);
