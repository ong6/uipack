import { defineConfig, devices } from "@playwright/test";

const linuxCI = Boolean(process.env.CI) && process.platform === "linux";
// A second checkout (a git worktree) needs its own server: reuseExistingServer
// would otherwise run these tests against the other checkout's code.
const port = Number(process.env.E2E_PORT ?? 5179);

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
  // The retry keeps a pull request moving past a one-off flake, but a test that passes only on
  // its retry is reported as flaky, and on main any flaky test fails the run so it gets fixed.
  failOnFlakyTests: Boolean(process.env.CI) && process.env.GITHUB_REF === "refs/heads/main",
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
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
        launchOptions: linuxCI
          ? {
              args: ["--use-gl=angle", "--use-angle=gl", "--ignore-gpu-blocklist", "--enable-webgl", "--disable-gpu-sandbox"],
            }
          : undefined,
      },
    },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
