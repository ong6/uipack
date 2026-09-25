import { defineConfig, devices } from "@playwright/test";

const linuxCI = Boolean(process.env.CI) && process.platform === "linux";

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
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx vite --port 5179 --strictPort",
    url: "http://localhost:5179",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Linux headless-shell defaults to SwiftShader Subzero. Mesa llvmpipe
        // under Xvfb meets the same paint budgets without changing scene quality.
        launchOptions: linuxCI ? {
          args: ["--use-gl=angle", "--use-angle=gl", "--ignore-gpu-blocklist", "--enable-webgl", "--disable-gpu-sandbox"],
        } : undefined,
      },
    },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
