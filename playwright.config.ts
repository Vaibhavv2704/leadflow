import { defineConfig, devices } from "@playwright/test";
const database =
  process.env.TEST_DATABASE_URL ||
  "postgresql://leadflow:leadflow@127.0.0.1:5432/leadflow_test";
if (!new URL(database).pathname.endsWith("_test"))
  throw new Error("E2E requires a dedicated database ending in _test.");
process.env.DATABASE_URL = database;
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    timezoneId: "Asia/Kolkata",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command:
      "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 60000,
    env: { DATABASE_URL: database },
  },
});
