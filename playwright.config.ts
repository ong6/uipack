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
  retries: process.env.CI ? 2 : 0,
  // A retry keeps a one-off flake from failing the run; a test that passes only on a retry is
  // reported as flaky (the github reporter annotates it, the HTML report lists it), a real failure
  // fails all three attempts and still fails the run.
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
    // WebKit runs a smoke subset: the tests tagged @cross-browser, where the engines differ
    // (keyboard focus and Tab, gestures, smooth scroll, SMIL, WebGL setup, fonts, the built package).
    // Chromium runs everything.
    { name: "webkit", grep: /@cross-browser/, use: { ...devices["Desktop Safari"] } },
  ],
});
