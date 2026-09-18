import { expect, test } from "@playwright/test";

const player = ".uipack-slide-player";
const scene = ".uipack-slide-scene";

test("live 3D keeps one canvas while jumping, reversing, and interrupting camera moves", async ({
  page,
}, info) => {
  const response = await page.goto("/slides");
  expect(response?.headers()["content-type"]).toContain("text/html");
  await expect(page.locator(scene)).not.toHaveAttribute(
    "data-renderer",
    "loading",
  );
  // WebKit on CI may have no WebGL; fallback behavior has its own unconditional tests.
  test.skip(
    (await page.locator(scene).getAttribute("data-renderer")) !== "ready",
    "WebGL is unavailable on this runner",
  );
  await expect(page.locator("canvas[data-slide-canvas]")).toHaveCount(1);
  const canvas = await page
    .locator("canvas[data-slide-canvas]")
    .elementHandle();
  await page.getByRole("button", { name: "Next stop", exact: true }).click();
  await expect(page.locator(scene)).toHaveAttribute(
    "data-settled-stop",
    "inside",
  );
  await page
    .getByRole("button", {
      name: "Go to Evidence decides what leaves.",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Go to Give the model the right context.",
      exact: true,
    })
    .click();
  await expect(page.locator(scene)).toHaveAttribute(
    "data-settled-stop",
    "context",
  );
  expect(await canvas!.evaluate((el) => el.isConnected)).toBe(true);
  await page
    .getByRole("button", {
      name: "Go to The model lives inside a system.",
      exact: true,
    })
    .click();
  await expect(page.locator(scene)).toHaveAttribute(
    "data-settled-stop",
    "outside",
  );
  await page.getByRole("button", { name: "Present", exact: true }).click();
  await expect(page.locator(player)).toHaveClass(/--present/);
  await page.keyboard.press("End");
  await expect(page.locator(scene)).toHaveAttribute(
    "data-settled-stop",
    "result",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(player)).not.toHaveClass(/--present/);
  expect(
    await page.locator("body").evaluate((el) => getComputedStyle(el).overflow),
  ).not.toBe("hidden");
  await page.getByRole("button", { name: /Retrieval layers/ }).click();
  await expect(page.locator(player)).toHaveAttribute(
    "data-story",
    "retrieval-layers",
  );
  await expect(page.locator(scene)).toHaveAttribute("data-renderer", "ready");
  await expect(page.locator("canvas[data-slide-canvas]")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Go to Separate storage from selection.",
      exact: true,
    })
    .click();
  await expect(page.locator(scene)).toHaveAttribute(
    "data-settled-stop",
    "explode",
  );
  await page.screenshot({
    path: info.outputPath("retrieval.png"),
    fullPage: true,
  });
});

test("reduced motion lands immediately and light mode rebuilds exactly one renderer", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/slides?theme=light");
  await expect(page.locator(scene)).toHaveAttribute("data-motion", "reduced");
  await expect(
    page.getByRole("button", { name: "Pause flow", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Go to Open the harness.", exact: true })
    .click();
  await expect(page.locator(scene)).toHaveAttribute(
    "data-settled-stop",
    "inside",
  );
  await expect(page.locator(scene)).toHaveAttribute(
    "data-transitioning",
    "false",
  );
  await page.getByRole("button", { name: "dark mode", exact: true }).click();
  await expect(page.locator(player)).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(scene)).not.toHaveAttribute(
    "data-renderer",
    "loading",
  );
  expect(
    await page.locator("canvas[data-slide-canvas]").count(),
  ).toBeLessThanOrEqual(1);
});

test("diagram mode works with blocked WebGL and keyboard navigation stays local", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return (get as Function).call(this, type, ...args);
    } as typeof get;
  });
  await page.goto("/slides?story=parallel-agents");
  await expect(page.locator(scene)).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await expect(page.getByTestId("slide-diagram")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(player)).toHaveAttribute("data-stop", "goal");
  await page.locator(player).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(player)).toHaveAttribute("data-stop", "fanout");
  await expect(
    page.getByTestId("slide-diagram").getByText("Research", { exact: true }),
  ).toBeVisible();
});

test("mobile layout fits the viewport and diagram/3D switching leaves no duplicate canvas", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/slides?story=parallel-agents");
  await page.getByRole("button", { name: "Next stop", exact: true }).click();
  await expect(page.locator(player)).toHaveAttribute("data-stop", "fanout");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Diagram view", exact: true }).click();
  await expect(page.locator("canvas[data-slide-canvas]")).toHaveCount(0);
  await expect(page.getByTestId("slide-diagram")).toBeVisible();
  await page.getByRole("button", { name: "3D view", exact: true }).click();
  await expect(page.locator(scene)).not.toHaveAttribute(
    "data-renderer",
    "loading",
  );
  expect(
    await page.locator("canvas[data-slide-canvas]").count(),
  ).toBeLessThanOrEqual(1);
});

test("new motion stories settle after forward, reverse, and interrupted navigation", async ({
  page,
}) => {
  await page.goto("/slides?story=quarter-turn");
  const viewport = page.locator(scene);
  await expect(viewport).toHaveAttribute("data-renderer", "ready");
  await page.getByRole("button", { name: "Next stop", exact: true }).click();
  await expect(viewport).toHaveAttribute("data-transitioning", "true");
  await expect(viewport).toHaveAttribute("data-settled-stop", "right");
  await expect(
    page.locator('.uipack-slide-label[data-node="tools"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next stop", exact: true }).click();
  await page
    .getByRole("button", { name: "Previous stop", exact: true })
    .click();
  await expect(viewport).toHaveAttribute("data-settled-stop", "right");
  await expect(viewport).toHaveAttribute("data-transitioning", "false");
  await page.getByRole("button", { name: /Staged assembly/ }).click();
  await page.getByRole("button", { name: "Next stop", exact: true }).click();
  await expect(viewport).toHaveAttribute("data-settled-stop", "assemble");
  await page.getByRole("button", { name: /Before \/ after/ }).click();
  await page.getByRole("button", { name: "Next stop", exact: true }).click();
  await expect(viewport).toHaveAttribute("data-settled-stop", "after");
  await expect(page.locator("canvas[data-slide-canvas]")).toHaveCount(1);
});
