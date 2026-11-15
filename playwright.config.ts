import { defineConfig, devices } from "@playwright/test";

const PORT = 4300;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * End-to-end tests run against the real production build (Express serving the built React app,
 * with an in-memory MongoDB), so they exercise exactly what ships. Run `npm run build` first.
 * They use the system Chrome, so no separate browser download is needed.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // the tests share one server and database
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", testIgnore: /mobile.spec.ts/, use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1280, height: 800 } } },
    { name: "mobile", testMatch: /mobile\.spec\.ts/, use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: {
    command: "node dist/index.js",
    cwd: "./server",
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    // The first run may need to download the in-memory MongoDB binary.
    timeout: 600_000,
    env: {
      NODE_ENV: "development",
      PORT: String(PORT),
      PUBLIC_URL: BASE_URL,
      ADMIN_PASSWORD: "e2e-admin-password",
      ADMIN_JWT_SECRET: "e2e-secret-e2e-secret-e2e-secret-1234",
    },
  },
});
