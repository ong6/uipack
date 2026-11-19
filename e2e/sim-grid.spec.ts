import { expect, test, type Page } from "./fixtures";
import { playAnimationTime } from "./helpers";

// SimGrid on its docs page (/components/sim-grid): the demo's 1,000 writers under three designs.
// Playback runs on Playwright's fake clock, stepped one 50ms frame at a time, so simulated time is
// exact however loaded the machine is.

const fig = (page: Page) => page.locator(".uipack-sim").first();
const counter = (page: Page, n: number) => fig(page).locator(".uipack-sim__readout dd > span:first-child").nth(n);
const cells = (page: Page, state: string) =>
  fig(page)
    .locator(`.uipack-sim__cells[data-sim="${state}"]`)
    .evaluate((p) => (p.getAttribute("d")?.match(/M/g) ?? []).length);

async function open(page: Page) {
  await page.clock.install();
  await page.goto("/components/sim-grid");
  await fig(page).waitFor();
  await fig(page).scrollIntoViewIfNeeded();
  // It rewinds as it comes into view and plays once its on-screen observer has reported in.
  await expect(fig(page)).toHaveAttribute("data-sim-state", "playing");
  await running(page);
}

/** Steps the clock until the simulated time moves: the loop runs only once it knows it is on screen. */
async function running(page: Page) {
  const from = await counter(page, 0).textContent();
  await expect
    .poll(async () => {
      await playAnimationTime(page, 50);
      return counter(page, 0).textContent();
    })
    .not.toBe(from);
}

test.describe("simulation grid", () => {
  let errors: string[];
  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
  });
  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test("plays once on view, pauses, resets to every writer waiting and plays to the end", async ({ page }) => {
    await open(page);
    await playAnimationTime(page, 2000);
    await fig(page).getByRole("button", { name: "Pause" }).click();
    await expect(fig(page)).toHaveAttribute("data-sim-state", "paused");
    const done = Number((await counter(page, 2).textContent())!.replace(/,/g, ""));
    expect(done).toBeGreaterThan(0);
    expect(done).toBeLessThan(1000);
    expect((await cells(page, "running")) + (await cells(page, "done")) + (await cells(page, "waiting"))).toBe(1000);
    // Paused, time holds.
    const held = await counter(page, 0).textContent();
    await playAnimationTime(page, 1000);
    await expect(counter(page, 0)).toHaveText(held!);
    await expect(fig(page).getByRole("status")).toContainText("Paused.");

    await fig(page).getByRole("button", { name: "Reset" }).click();
    await expect(fig(page)).toHaveAttribute("data-sim-state", "idle");
    await expect(counter(page, 2)).toHaveText("0");
    expect(await cells(page, "waiting")).toBe(1000);

    await fig(page).getByRole("button", { name: "Play" }).click();
    await playAnimationTime(page, 9000);
    await expect(fig(page)).toHaveAttribute("data-sim-state", "finished");
    await expect(counter(page, 2)).toHaveText("1,000");
    expect(await cells(page, "done")).toBe(1000);
    await expect(fig(page).getByRole("status")).toContainText("Finished. 1,000 of 1,000 writers done");
    await expect(fig(page).getByRole("button", { name: "Play" })).toBeVisible();
  });

  test("pauses off screen and picks up where it was", async ({ page }) => {
    await open(page);
    await playAnimationTime(page, 1000);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(fig(page)).not.toBeInViewport();
    // Once its observer reports it off screen the clock stops: two reads 200ms of animation apart agree.
    let before = "";
    await expect
      .poll(async () => {
        const a = await counter(page, 0).textContent();
        await playAnimationTime(page, 200);
        before = (await counter(page, 0).textContent()) ?? "";
        return a === before;
      })
      .toBe(true);
    await playAnimationTime(page, 2000);
    await expect(counter(page, 0)).toHaveText(before);
    await expect(fig(page)).toHaveAttribute("data-sim-state", "playing");
    await fig(page).scrollIntoViewIfNeeded();
    await running(page);
  });

  test("keyboard: arrow keys pick a design at the same moment, Space toggles an option, Enter plays", async ({ page }) => {
    await open(page);
    await playAnimationTime(page, 1500);
    await fig(page).getByRole("button", { name: "Pause" }).press("Enter");
    await expect(fig(page)).toHaveAttribute("data-sim-state", "paused");
    await expect(counter(page, 2)).not.toHaveText("0");
    const time = await counter(page, 0).textContent();
    const lockDone = await counter(page, 2).textContent();

    const lock = fig(page).getByRole("radio", { name: "One lock" });
    await lock.focus();
    await page.keyboard.press("ArrowRight");
    await expect(fig(page).getByRole("radio", { name: "Eight shards" })).toBeChecked();
    await expect(fig(page).getByRole("radio", { name: "Eight shards" })).toBeFocused();
    // Same simulated moment, more writers done under the faster design.
    await expect(counter(page, 0)).toHaveText(time!);
    await expect(counter(page, 2)).not.toHaveText(lockDone!);
    await expect(fig(page).getByRole("status")).toContainText("Eight shards.");
    // The focused segment shows the figure's focus ring.
    const ring = await fig(page)
      .locator(".uipack-sim__segment input:focus-visible + span")
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(ring).toBe("solid");

    const slow = fig(page).getByRole("checkbox", { name: "Slow disk" });
    await slow.focus();
    await page.keyboard.press("Space");
    await expect(slow).toBeChecked();

    await fig(page).getByRole("button", { name: "Play" }).press("Enter");
    await expect(fig(page)).toHaveAttribute("data-sim-state", "playing");
  });

  test("every control is a real control with a 44px target, and nothing overflows at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await open(page);
    const controls = fig(page).locator("button, .uipack-sim__segment span, .uipack-sim__option");
    const count = await controls.count();
    expect(count).toBe(8);
    for (let i = 0; i < count; i++) {
      const box = (await controls.nth(i).boundingBox())!;
      expect(box.height, `control ${i}`).toBeGreaterThanOrEqual(44);
    }
    const widths = await page.evaluate(() => {
      const f = document.querySelector(".uipack-sim")!.getBoundingClientRect();
      const svg = document.querySelector(".uipack-sim svg[role=img]")!.getBoundingClientRect();
      return { page: document.documentElement.scrollWidth, viewport: innerWidth, fig: f.right, svg: svg.right };
    });
    expect(widths.page).toBeLessThanOrEqual(widths.viewport);
    expect(widths.svg).toBeLessThanOrEqual(widths.fig);
    // The narrow grid: 25 columns for 1,000 cells.
    await expect(fig(page).locator("svg[role=img]")).toHaveAttribute("data-columns", "25");
  });

  test("Open canvas shows the same moment in a dialog, wide, and Escape returns focus", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await open(page);
    await playAnimationTime(page, 1000);
    await fig(page).getByRole("button", { name: "Pause" }).click();
    const time = await counter(page, 0).textContent();
    await fig(page).getByRole("button", { name: "Open canvas" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const inDialog = dialog.locator(".uipack-sim");
    await expect(inDialog.locator(".uipack-sim__readout dd > span:first-child").first()).toHaveText(time!);
    // Wide in the canvas, even on a phone: 50 columns for 1,000 cells, at least 800px across.
    await expect(inDialog.locator("svg[role=img]")).toHaveAttribute("data-columns", "50");
    expect((await inDialog.locator("svg[role=img]").boundingBox())!.width).toBeGreaterThanOrEqual(800);
    await inDialog.getByRole("button", { name: "Play" }).click();
    await playAnimationTime(page, 500);
    await expect(inDialog.locator(".uipack-sim__readout dd > span:first-child").first()).not.toHaveText(time!);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(fig(page).getByRole("button", { name: "Open canvas" })).toBeFocused();
  });

  test("reduced motion shows the finished run with no Play or Reset; designs still switch", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/components/sim-grid");
    await fig(page).waitFor();
    await expect(fig(page)).toHaveAttribute("data-sim-state", "finished");
    await expect(fig(page).getByRole("button", { name: /Play|Pause|Reset/ })).toHaveCount(0);
    await expect(counter(page, 2)).toHaveText("1,000");
    const lockTime = await counter(page, 0).textContent();
    await fig(page).getByRole("radio", { name: "Batched" }).check();
    await expect(counter(page, 0)).not.toHaveText(lockTime!);
    await expect(counter(page, 2)).toHaveText("1,000");
  });

  test("the diagrams page shows it as a pattern", async ({ page }) => {
    await page.goto("/components/diagrams#sim-grid");
    await expect(page.locator("#sim-grid .uipack-sim")).toBeVisible();
  });
});
