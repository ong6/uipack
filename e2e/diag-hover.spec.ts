import { expect, test } from "./fixtures";

// Diagnostic only (branch diag/hover-cold-start, never merged).
test("diag: first hover on a cold server", async ({ page }) => {
  const t0 = Date.now();
  const log = (...a: unknown[]) => console.log(`[diag +${Date.now() - t0}ms]`, ...a);
  page.on("framenavigated", (f) => f === page.mainFrame() && log("navigated", f.url()));
  page.on("console", (m) => log("console", m.type(), m.text().slice(0, 200)));
  await page.addInitScript(() => {
    (window as unknown as { __loadId: string }).__loadId = Math.random().toString(36).slice(2, 8);
  });
  const probe = () =>
    page.evaluate(() => {
      const b = document.querySelector("#e2e-node-beta");
      return {
        load: (window as unknown as { __loadId: string }).__loadId,
        hoverMQ: matchMedia("(hover: hover)").matches,
        anyHover: matchMedia("(any-hover: hover)").matches,
        pointer: matchMedia("(pointer: fine)").matches,
        state: b?.getAttribute("data-state") ?? null,
        opacity: b ? getComputedStyle(b).opacity : null,
        transition: b ? getComputedStyle(b).transitionDuration : null,
        anims: b ? b.getAnimations().map((a) => `${a.constructor.name}:${a.playState}:${a.currentTime}`) : [],
        vis: document.visibilityState,
        now: Math.round(performance.now()),
      };
    });
  await page.goto("/components/diagrams");
  await page.locator("#e2e-node-alpha").waitFor();
  log("ready", JSON.stringify(await probe()));
  await page.locator("#e2e-node-alpha").hover();
  for (let i = 0; i < 30; i++) {
    log("probe", JSON.stringify(await probe()));
    await page.waitForTimeout(100);
  }
  await expect.poll(() => page.locator("#e2e-node-beta").evaluate((el) => Number(getComputedStyle(el).opacity))).toBeCloseTo(0.35, 1);
});
