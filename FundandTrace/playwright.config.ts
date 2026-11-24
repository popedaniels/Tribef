import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against a production build and the mock API
// (e2e/mock-api.js). CI: .github/workflows/e2e.yml. Locally:
//   npm run build && npx playwright test
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Local runs can point at an installed Chrome instead of `playwright install`.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH, args: ["--no-sandbox"] } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    { command: "node e2e/mock-api.js", port: 5000, reuseExistingServer: !process.env.CI },
    { command: "npx next start -p 3000", port: 3000, reuseExistingServer: !process.env.CI, timeout: 60_000 },
  ],
});
