import { expect, test } from "@playwright/test";

// Cards in one row must line their action rows up, whatever the length of each description.
test("style cards in a row align their links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/styles");
  const rows = await page.evaluate(() => {
    const byRow: Record<number, number[]> = {};
    document.querySelectorAll(".style-card").forEach((card) => {
      const top = Math.round(card.getBoundingClientRect().top);
      const link = card.querySelector(":scope > :last-child a")!.getBoundingClientRect();
      (byRow[top] ??= []).push(Math.round(link.top));
    });
    return Object.values(byRow);
  });
  expect(rows.length).toBeGreaterThan(1);
  for (const tops of rows) expect(new Set(tops).size).toBe(1);
});
