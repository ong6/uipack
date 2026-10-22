import { expect, test } from "./fixtures";

// The committed dist/, not the source: a page that imports the built ESM entries and their CSS
// (playground/dist-smoke/) must render a preset figure and a working deck without a console error.
// It catches what unit tests on src/ cannot: a broken chunk, a missing export or stylesheet in dist.
test("the built ESM entries render a figure and a deck in the browser", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/dist-smoke/index.html");
  await expect(page.locator("#figure figure svg").first()).toBeVisible();
  const deck = page.getByRole("region", { name: "Smoke deck" });
  await expect(deck).toContainText("First slide");
  await deck.focus();
  await page.keyboard.press("ArrowRight");
  await expect(deck).toContainText("Second slide");
  expect(errors).toEqual([]);
});
