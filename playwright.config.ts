import { defineConfig, devices } from "@playwright/test";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    actionTimeout: 15000,
    baseURL: `http://127.0.0.1:4173${base}/`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    serviceWorkers: "allow",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 16 Pro Max"], defaultBrowserType: "webkit" },
    },
  ],
  webServer: {
    command: "node scripts/serve-export.mjs",
    env: { KIT_E2E_SERVER: "1" },
    url: `http://127.0.0.1:4173${base}/en/`,
    reuseExistingServer: !process.env.CI,
  },
});
