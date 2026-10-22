import { expect, test, type Page } from "@playwright/test";

const fig = (page: Page) => page.locator("#drill-main");
const drillNode = (page: Page, id: string) => fig(page).locator(`.uipack-drill__layer[data-current] [data-drill="${id}"]:visible`).first();
const settled = async (page: Page) => {
  await expect(fig(page).locator(".uipack-drill__stage")).not.toHaveAttribute("data-flight", /.+/);
  await expect(fig(page).locator(".uipack-drill__layer")).toHaveCount(1);
};

/** Freeze every running animation at `ms`. */
const freezeAt = (page: Page, ms: number) =>
  page.evaluate((ms) => {
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = ms;
    }
  }, ms);

test.describe("drill-down figure", () => {
  let errors: string[];
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/drill");
    await drillNode(page, "checks").waitFor();
  });
  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test("click drills two levels down and Back returns, with focus on the originating node", async ({ page }) => {
    await expect(drillNode(page, "checks")).toHaveAttribute("aria-label", "Open Checks: 7 parts inside");
    await drillNode(page, "checks").click();
    await expect(fig(page).getByRole("heading", { name: /^Checks:/ })).toBeFocused();
    await settled(page);
    await expect(page).toHaveURL(/drill=harness%2Fchecks|drill=harness\/checks/);
    await drillNode(page, "policy").click();
    await expect(fig(page).getByRole("heading", { name: /^Policy:/ })).toBeFocused();
    await settled(page);
    await expect(fig(page).getByRole("navigation", { name: "Figure levels" })).toContainText("Agent harness›Checks›Policy");
    await fig(page).getByRole("button", { name: "Back to Checks" }).click();
    await settled(page);
    await expect(drillNode(page, "policy")).toBeFocused();
    await fig(page).getByRole("button", { name: "Back to Agent harness" }).click();
    await settled(page);
    await expect(drillNode(page, "checks")).toBeFocused();
    // At rest nothing the move set is left behind.
    const style = await fig(page).locator(".uipack-drill__layer").getAttribute("style");
    expect(style ?? "").not.toMatch(/transform|clip|z-index|visibility/);
  });

  test("Enter opens, Escape and Backspace go up, the live region announces", async ({ page }) => {
    await drillNode(page, "checks").focus();
    await page.keyboard.press("Enter");
    await expect(fig(page).getByRole("heading", { name: /^Checks:/ })).toBeFocused();
    await expect(fig(page).locator("[data-drill-announce]")).toHaveText("Opened Checks. Agent harness › Checks");
    await settled(page);
    await drillNode(page, "policy").focus();
    await page.keyboard.press(" ");
    await settled(page);
    await page.keyboard.press("Escape");
    await settled(page);
    await expect(drillNode(page, "policy")).toBeFocused();
    await page.keyboard.press("Backspace");
    await settled(page);
    await expect(drillNode(page, "checks")).toBeFocused();
    await expect(fig(page).locator("[data-drill-announce]")).toHaveText("Back to Agent harness. Agent harness");
  });

  test("mid-flight the child is clipped exactly inside the node box, and the label gives way", async ({ page }) => {
    const box = await drillNode(page, "checks").locator(':scope > [data-uipack="node"] > rect').boundingBox();
    await drillNode(page, "checks").click();
    await freezeAt(page, 330);
    const m = await page.evaluate(() => {
      const inner = document.querySelector<HTMLElement>('#drill-main .uipack-drill__layer[data-role="inner"]')!;
      const outerNode = document.querySelector('#drill-main .uipack-drill__layer:not([data-role]) [data-drill="checks"] > [data-uipack="node"] > rect')!;
      const r = inner.getBoundingClientRect();
      const s = r.width / inner.offsetWidth;
      const cs = getComputedStyle(inner);
      // Computed inset() uses the 1–4 value shorthand.
      const v = cs.clipPath.match(/inset\(([^)]*?)(?: round|\))/)![1].trim().split(/\s+/).map(parseFloat);
      const [t, ri, b, l] = [v[0], v[1] ?? v[0], v[2] ?? v[0], v[3] ?? v[1] ?? v[0]];
      const label = document.querySelector('#drill-main [data-drill="checks"] > [data-uipack="node"] > text')!;
      return {
        clip: { left: r.left + l * s, top: r.top + t * s, right: r.right - ri * s, bottom: r.bottom - b * s },
        node: outerNode.getBoundingClientRect().toJSON(),
        opacity: Number(cs.opacity),
        labelOpacity: Number(getComputedStyle(label).opacity),
        round: /round/.test(cs.clipPath),
      };
    });
    // The clip and the (zooming) node box agree to a pixel.
    expect(Math.abs(m.clip.left - m.node.left)).toBeLessThan(1.5);
    expect(Math.abs(m.clip.right - m.node.right)).toBeLessThan(1.5);
    expect(Math.abs(m.clip.top - m.node.top)).toBeLessThan(1.5);
    expect(Math.abs(m.clip.bottom - m.node.bottom)).toBeLessThan(1.5);
    expect(m.round).toBe(true);
    expect(m.node.width).toBeGreaterThan(box!.width * 1.05);
    expect(m.opacity).toBeGreaterThan(0);
    expect(m.labelOpacity).toBeLessThan(1);
    // Later the child has taken over the label entirely.
    await freezeAt(page, 700);
    const later = await page.evaluate(() => Number(getComputedStyle(document.querySelector('#drill-main [data-drill="checks"] > [data-uipack="node"] > text')!).opacity));
    expect(later).toBeLessThan(0.05);
    await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
    await settled(page);
  });

  test("Back mid-flight reverses the same path and settles cleanly", async ({ page }) => {
    await drillNode(page, "checks").click();
    await page.waitForTimeout(350);
    await fig(page).getByRole("button", { name: "Back to Agent harness" }).click();
    await settled(page);
    await expect(fig(page).locator(".uipack-drill__layer")).toHaveAttribute("data-level", "harness");
    await expect(drillNode(page, "checks")).toBeFocused();
    const opacity = await drillNode(page, "checks").locator(':scope > [data-uipack="node"] > text').first().evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe("1");
    await expect(fig(page).getByRole("heading", { level: 3 })).toHaveText("Checks decide what leaves the harness");
  });

  test("hover brightens the preview inside a drillable node", async ({ page }) => {
    const ghost = drillNode(page, "checks").locator(".uipack-drill-node__ghost");
    const before = Number(await ghost.evaluate((el) => getComputedStyle(el).opacity));
    await drillNode(page, "checks").hover();
    await expect.poll(() => ghost.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(before + 0.1);
  });

  test("Open canvas shows the current level and still drills", async ({ page }) => {
    await drillNode(page, "checks").click();
    await settled(page);
    await fig(page).getByRole("button", { name: "Open canvas" }).click();
    const dialog = page.locator("dialog.uipack-canvas-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.uipack-drill__layer[data-level="checks"]')).toBeVisible();
    await dialog.locator('[data-drill="policy"]:visible').click();
    await expect(dialog.locator(".uipack-drill__stage")).not.toHaveAttribute("data-flight", /.+/);
    await expect(dialog.locator('.uipack-drill__layer[data-level="policy"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(fig(page).getByRole("button", { name: "Open canvas" })).toBeFocused();
  });
});

test("reduced motion crossfades without scaling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/drill");
  await drillNode(page, "checks").click();
  const anims = await page.evaluate(() =>
    document.getAnimations().map((a) => {
      const e = a.effect as KeyframeEffect;
      return { duration: e.getTiming().duration, props: e.getKeyframes().flatMap((k) => Object.keys(k)) };
    }),
  );
  expect(anims.length).toBeGreaterThan(0);
  for (const a of anims) {
    expect(a.duration).toBe(160);
    expect(a.props).not.toContain("transform");
    expect(a.props).not.toContain("clipPath");
  }
  await settled(page);
  await expect(fig(page).getByRole("heading", { name: /^Checks:/ })).toBeFocused();
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test("at 390px the page never overflows and the narrow drawing drills by tap", async ({ page }) => {
    await page.goto("/drill");
    const node = drillNode(page, "checks");
    await node.waitFor();
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    await expect(fig(page).locator(".uipack-drill__narrow").first()).toBeVisible();
    // Labels in the narrow drawing render at a readable size.
    const size = await node.locator(':scope > [data-uipack="node"] > text').first().evaluate((el) => el.getBoundingClientRect().height);
    expect(size).toBeGreaterThan(11);
    await node.tap();
    await settled(page);
    await expect(fig(page)).toHaveAttribute("data-level", "checks");
    expect(await overflow()).toBeLessThanOrEqual(0);
    await drillNode(page, "policy").tap();
    await settled(page);
    await expect(fig(page)).toHaveAttribute("data-level", "policy");
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
});
