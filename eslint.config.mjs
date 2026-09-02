import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, unmodified third-party build output (see
    // scripts/sync-vendor.mjs) — not our code, and it's minified so
    // linting it is both meaningless and extremely slow.
    "public/vendor/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
