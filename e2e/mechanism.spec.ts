import { expect, test, type Page } from "@playwright/test";
// @ts-expect-error a plain ESM module vendored from Anatomy, with no type declarations
import { LINE_ENDS } from "./anatomy-line-ends.mjs";

// uipack/mechanism on /mechanism: the verification gate in its card, driven by
// the pose buttons the way a deck drives it per slide, plus four still thumbnails.

const machine = ".mechanism-stage .um-machine";
const readout = ".mechanism-stage [data-readout]";

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

/** Screen position of the lit token (the proposal being checked). */
async function litToken(page: Page) {
  return page.evaluate((selector) => {
    const token = document.querySelector(`${selector} .um-token[data-lit]:not([display="none"])`);
    if (!token) return null;
    const box = token.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }, machine);
}

for (const theme of ["light", "dark"] as const) {
  test(`renders in ${theme} with no console errors`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`/mechanism?theme=${theme}`);
    await expect(page.locator(machine)).toBeVisible();
    await expect(page.locator(".mechanism-stage .uipack-mechanism")).toHaveAttribute("data-theme", theme);
    await expect(page.locator(readout)).toHaveText(/^checked \d+ · passed \d+ · returned \d+$/);
    await expect(page.locator(".mechanism-thumbs svg.iso-svg")).toHaveCount(4);
    // The card's paper follows the theme.
    const paper = await page.locator(".mechanism-stage .um-plate").evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(paper).toBe(theme === "light" ? "rgb(255, 255, 255)" : "rgb(14, 21, 18)");
    await page.waitForTimeout(1200);
    expect(errors).toEqual([]);
  });
}

test("changing the pose moves the token and reaches the verdict", async ({ page }) => {
  await page.goto("/mechanism?theme=light");
  await expect(page.locator(machine)).toBeVisible();
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await expect(page.locator(readout)).toHaveText("checking proposal 3");
  await expect.poll(() => litToken(page)).not.toBeNull();
  const first = (await litToken(page))!;
  await page.waitForTimeout(900);
  const later = (await litToken(page))!;
  expect(Math.hypot(later.x - first.x, later.y - first.y)).toBeGreaterThan(20);
  await expect(page.locator(readout)).toHaveText("reads 6.6 > 6.0 · returned", { timeout: 6000 });
  // The arm swings across the belt for a return.
  await page.getByRole("button", { name: "Pass", exact: true }).click();
  await expect(page.locator(readout)).toHaveText("reads 4.2 ≤ 6.0 · passed", { timeout: 6000 });
  await page.getByRole("button", { name: "Apart", exact: true }).click();
  await expect(page.locator(readout)).toHaveText("apart · 6 assemblies", { timeout: 4000 });
  const lifted = await page.locator(`${machine} [data-assembly="hopper"]`).first().getAttribute("transform");
  expect(lifted).toMatch(/translate/);
});

test("reduced motion holds one still, readable frame per pose", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  for (const [pose, text] of [
    ["idle", /^checked \d+ · passed \d+ · returned \d+$/],
    ["return", "reads 6.6 > 6.0 · returned"],
    ["apart", "apart · 6 assemblies"],
  ] as const) {
    await page.goto(`/mechanism?pose=${pose}`);
    await expect(page.locator(readout)).toHaveText(text);
    const before = await page.locator(`${machine} svg`).innerHTML();
    await page.waitForTimeout(800);
    expect(await page.locator(`${machine} svg`).innerHTML()).toBe(before);
  }
  // A pose change jumps straight to the new still frame.
  await page.getByRole("button", { name: "Pass", exact: true }).click();
  await expect(page.locator(readout)).toHaveText("reads 4.2 ≤ 6.0 · passed");
  await context.close();
});

test("the machine is reachable and operable from the keyboard", async ({ page }) => {
  await page.goto("/mechanism?pose=idle");
  await expect(page.locator(machine)).toBeVisible();
  let reached = false;
  for (let step = 0; step < 30 && !reached; step++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate((selector) => document.activeElement === document.querySelector(selector), machine);
  }
  expect(reached).toBe(true);
  await expect(page.locator(machine)).toHaveAttribute("aria-label", /Space/);
  const outline = await page.locator(machine).evaluate((node) => getComputedStyle(node).outlineStyle);
  expect(outline).not.toBe("none");
  await page.keyboard.press("Space");
  await expect(page.locator(readout)).toHaveText(/· paused$/);
  await page.keyboard.press("Enter");
  await expect(page.locator(readout)).not.toHaveText(/paused/);
  // The pose buttons are reachable too, and a tap on the machine works like Space.
  await page.getByRole("button", { name: "Return", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("every drawn line ends on something, in every pose (Anatomy's line-end check)", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 1500 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  for (const pose of ["idle", "pass", "return", "apart"]) {
    await page.goto(`/mechanism?pose=${pose}`);
    await expect(page.locator(`${machine} svg`)).toBeVisible();
    const result = (await page.evaluate(`(${LINE_ENDS})({ select: ${JSON.stringify(machine)} })`)) as { ends: number; problems: unknown[] };
    expect(result.ends, pose).toBeGreaterThan(300);
    expect(result.problems, pose).toEqual([]);
  }
  await context.close();
});

test("fits a 390px phone with readable labels and thumbnails that never move", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto("/mechanism?theme=dark&pose=pass");
  await expect(page.locator(machine)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  for (const size of await page.locator(".mechanism-stage .um-corner").evaluateAll((nodes) => nodes.map((node) => parseFloat(getComputedStyle(node).fontSize)))) {
    expect(size).toBeGreaterThanOrEqual(11);
  }
  // Corners do not overlap each other.
  const boxes = await page.locator(".mechanism-stage .um-corner").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
  for (let a = 0; a < boxes.length; a++)
    for (let b = a + 1; b < boxes.length; b++) {
      const [p, q] = [boxes[a], boxes[b]];
      const overlap = p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom;
      expect(overlap).toBe(false);
    }
  // A tap on the machine replays the single run.
  await page.locator(machine).tap();
  await expect(page.locator(readout)).toHaveText("checking proposal 1");
  // Thumbnails are still: no tab stop and no change over time.
  const thumbs = page.locator(".mechanism-thumbs .um-machine");
  await expect(thumbs).toHaveCount(4);
  expect(await page.locator(".mechanism-thumbs .um-machine[tabindex]").count()).toBe(0);
  const before = await thumbs.first().innerHTML();
  await page.waitForTimeout(700);
  expect(await thumbs.first().innerHTML()).toBe(before);
  expect(errors).toEqual([]);
  await context.close();
});
