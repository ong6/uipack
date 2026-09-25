import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  testIgnore: process.env.SHOTS ? [] : ["**/screenshots.spec.ts"],
  timeout: 30_000,
  fullyParallel: false,
  // WebGL uses CPU rendering on headless CI. Scale with isolated CI shards,
  // rather than competing renderer processes on the same runner.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5179",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx vite --port 5179 --strictPort",
    url: "http://localhost:5179",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
