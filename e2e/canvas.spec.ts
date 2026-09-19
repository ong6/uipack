import { expect, test } from "@playwright/test";

test.use({ hasTouch: true });

test("mobile presets remain readable and selection works without hover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?theme=light");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  for (const figure of await page.locator("figure.uipack--has-narrow").all()) {
    await expect(figure.locator("svg.uipack--narrow")).toBeVisible();
    await expect(figure.locator("svg.uipack--wide")).toBeHidden();
    const sizes = await figure
      .locator("svg.uipack--narrow text")
      .evaluateAll((els) =>
        els.map((el) => {
          const svg = (el as SVGTextElement).ownerSVGElement!;
          return (
            (parseFloat(getComputedStyle(el).fontSize) *
              svg.getBoundingClientRect().width) /
            svg.viewBox.baseVal.width
          );
        }),
      );
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(10.9);
  }
  const figure = page.locator("figure").first();
  const node = figure.getByRole("button", { name: "ChatGPT", exact: true });
  await node.tap();
  await expect(node).toHaveAttribute("aria-pressed", "true");
  await expect(figure.getByRole("status")).toContainText("ChatGPT");
  await node.press("Space");
  await expect(node).toHaveAttribute("aria-pressed", "false");
  await figure
    .getByRole("button", { name: "Open canvas", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("svg.uipack--wide")).toBeVisible();
  await expect
    .poll(async () =>
      dialog.locator("svg.uipack--wide text").evaluateAll((els) =>
        Math.min(
          ...els.map((el) => {
            const svg = (el as SVGTextElement).ownerSVGElement!;
            return (
              (parseFloat(getComputedStyle(el).fontSize) *
                svg.getBoundingClientRect().width) /
              svg.viewBox.baseVal.width
            );
          }),
        ),
      ),
    )
    .toBeGreaterThanOrEqual(10.9);
  const initialWidth = await dialog
    .locator("svg.uipack--wide")
    .evaluate((el) => el.getBoundingClientRect().width);
  await dialog.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect
    .poll(() =>
      dialog
        .locator("svg.uipack--wide")
        .evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeGreaterThan(initialWidth);
  await expect(dialog.getByLabel("Zoom level")).toHaveText("125%");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page
      .locator("figure")
      .first()
      .getByRole("button", { name: "Open canvas", exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
});

test("animation canvas retains the stop and allows component inspection", async ({
  page,
}) => {
  await page.goto("/animations?story=harness-dive&stop=inside&theme=dark");
  await page.getByRole("button", { name: "Open canvas", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".uipack-slide-player")).toHaveAttribute(
    "data-stop",
    "inside",
  );
  await dialog
    .getByRole("combobox", { name: "Inspect component" })
    .selectOption("model");
  await expect(dialog.getByRole("status")).toContainText("Model");
  await dialog.getByRole("button", { name: "Zoom in", exact: true }).click();
  await dialog.getByRole("button", { name: "Fit", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Close canvas", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open canvas", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".uipack-slide-player")).toHaveAttribute(
    "data-stop",
    "inside",
  );
});

test("catalog filters, style grouping, and presentation composition work on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/animations");
  await page
    .getByRole("combobox", { name: "Technique", exact: true })
    .selectOption("Layers");
  await expect(
    page
      .getByRole("navigation", { name: "Example stories" })
      .getByRole("button"),
  ).toHaveCount(2);
  await page
    .getByRole("searchbox", { name: "Search animations" })
    .fill("retrieval");
  await expect(
    page
      .getByRole("navigation", { name: "Example stories" })
      .getByRole("button"),
  ).toHaveCount(1);
  await page.getByRole("link", { name: "Styles", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Technical", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Library pages" })
    .getByRole("link", { name: "Presentations", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A model is only the beginning." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next chapter" }).click();
  await expect(
    page.getByRole("heading", { name: "Every action needs a boundary." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "04 Comparison" }).click();
  await expect(
    page.getByRole("heading", { name: "Where the check belongs" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open canvas", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "05 Closing" }).click();
  await expect(
    page.getByRole("heading", {
      name: "One goal. One bounded workflow. One inspectable result.",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
