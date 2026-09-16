import { expect, test } from "@playwright/test";

// Hover highlighting is CSS on data-state; check the computed opacity, not the attribute alone.
test.describe("hover", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#e2e-node-alpha").waitFor();
  });

  test("hovering a node highlights its flow and dims unrelated elements", async ({ page }) => {
    const alpha = page.locator("#e2e-node-alpha");
    const beta = page.locator("#e2e-node-beta");
    const conn = page.locator("#e2e-conn");
    await alpha.hover();
    await expect(page.locator("figure", { hasText: "Every part" })).toHaveAttribute("data-hover-flow", "alpha");
    await expect(beta).toHaveAttribute("data-state", "dim");
    await expect(conn).toHaveAttribute("data-state", "hit");
    // 160ms transition; poll rather than sleep, CI WebKit is slow to settle
    await expect.poll(() => beta.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 2000 }).toBeCloseTo(0.35, 1);
    await expect.poll(() => conn.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 2000 }).toBe(1);
    const accent = await page.locator("figure.uipack").first().evaluate((el) => getComputedStyle(el).getPropertyValue("--uipack-accent").trim());
    const stroke = await conn.evaluate((el) => getComputedStyle(el).stroke);
    expect(stroke).toBe(await page.evaluate((c) => { const d = document.createElement("div"); d.style.color = c; document.body.append(d); const v = getComputedStyle(d).color; d.remove(); return v; }, accent));
    await page.mouse.move(0, 0);
    await expect(beta).not.toHaveAttribute("data-state", /.+/);
    await expect.poll(() => beta.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 2000 }).toBe(1);
  });

  test("hovering a legend item filters by kind", async ({ page }) => {
    const figure = page.locator("figure", { hasText: "Every part" });
    await figure.locator(".uipack__legend li", { hasText: "Change" }).hover();
    await expect(figure).toHaveAttribute("data-hover-kind", "change");
    await expect(page.locator("#e2e-conn-change")).toHaveAttribute("data-state", "hit");
    await expect(page.locator("#e2e-conn")).toHaveAttribute("data-state", "dim");
    await expect(page.locator("#e2e-packet-change")).toHaveAttribute("data-state", "hit");
    await page.waitForTimeout(250);
    expect(Number(await page.locator("#e2e-conn").evaluate((el) => getComputedStyle(el).opacity))).toBeCloseTo(0.35, 1);
    expect(Number(await page.locator("#e2e-node-alpha").evaluate((el) => getComputedStyle(el).opacity))).toBe(1); // nodes have no kind
  });

  test("a node with href is a focusable link", async ({ page }) => {
    const link = page.locator("a.uipack__link");
    await expect(link).toHaveAttribute("href", "#link");
    await link.focus();
    await expect(link).toBeFocused();
    const width = await link.locator("rect").first().evaluate((el) => getComputedStyle(el).strokeWidth);
    expect(parseFloat(width)).toBeGreaterThanOrEqual(2);
  });
});
