import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  outputFileTracingRoot: __dirname,
  // pdf.js optionally imports node-canvas when it detects a Node runtime. The
  // browser bundle has no such module, so the import resolves to an empty one.
  turbopack: {
    resolveAlias: {
      canvas: {
        browser: "./src/lib/empty-module.ts",
      },
    },
  },
};

export default withNextIntl(nextConfig);
