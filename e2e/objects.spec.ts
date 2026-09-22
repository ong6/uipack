import { test, expect } from "@playwright/test";
const kinds = [
  "ai",
  "contact",
  "tennis",
  "trading",
  "server",
  "travel",
  "reading",
];
for (const theme of ["light", "dark"])
  for (const width of [390, 1440]) {
    test(`objects fit and render at ${width} in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const kind of kinds) {
        await page.goto(`/animations?story=${kind}&theme=${theme}`);
        const canvas = page.locator(".uipack-object canvas");
        await expect(canvas).toHaveAttribute("data-renderer", "webgl");
        await expect(canvas).toHaveAttribute("data-phase", "rest");
        await canvas.scrollIntoViewIfNeeded();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);
        await expect(page.getByRole("button", { name: /motion$/ })).toHaveCount(
          0,
        );
      }
      expect(errors).toEqual([]);
    });
  }
test("object playback pauses, finishes, replays and opens one accessible canvas", async ({
  page,
}) => {
  await page.goto("/animations?story=travel&variant=0");
  const canvas = page.locator(".uipack-object canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  await page.getByRole("button", { name: "Pause motion" }).click();
  const frames = await canvas.getAttribute("data-frames");
  await page.waitForTimeout(150);
  expect(await canvas.getAttribute("data-frames")).toBe(frames);
  await page.getByRole("button", { name: "Resume motion" }).click();
  await expect(page.getByRole("button", { name: "Replay motion" })).toBeVisible(
    { timeout: 10000 },
  );
  const resting = await canvas.getAttribute("data-frames");
  await page.waitForTimeout(150);
  expect(await canvas.getAttribute("data-frames")).toBe(resting);
  await page.getByRole("button", { name: "Replay motion" }).click();
  await expect(
    page.getByRole("button", { name: "Pause motion" }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-phase", "rest");
  await page.getByRole("button", { name: "Open canvas" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("button", { name: /Zoom in/ }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open canvas" })).toBeFocused();
});
test("renderer failure retains the labelled object fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return original.apply(this, [type, ...args] as never);
    } as typeof original;
  });
  await page.goto("/animations?story=contact");
  await expect(page.locator(".uipack-object canvas")).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await expect(
    page.getByRole("img", { name: "Contact inbox illustration" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /motion$/ })).toHaveCount(0);
});

test("switching objects and themes creates a usable renderer every time", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/animations?story=ai");
  for (const title of [
    "Tennis practice",
    "Open book",
    "Local map",
    "Trading journal",
    "Inference study",
    "Agent session",
    "Contact inbox",
  ]) {
    await page
      .getByRole("button", {
        name: title,
        exact: true,
      })
      .click();
    await expect(page.locator(".uipack-object canvas")).toHaveAttribute(
      "data-renderer",
      "webgl",
    );
    await expect(
      page.getByRole("button", { name: "Pause motion" }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);
  }
  await page.getByRole("button", { name: "dark mode", exact: true }).click();
  await expect(page.locator(".uipack-object canvas")).toHaveAttribute(
    "data-renderer",
    "webgl",
  );
  await expect(
    page.getByRole("button", { name: "Pause motion" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("curated look persists through loop, theme and expanded canvas", async ({ page }) => {
  await page.goto("/animations?story=tennis");
  const object = page.locator(".uipack-object");
  const canvas = object.locator("canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  const first = Number(await object.getAttribute("data-variant"));
  await page.getByRole("button", { name: /Paper worlds/ }).click();
  await expect(object).toHaveAttribute("data-variant", String((first + 1) % 3));
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  const next = await object.getAttribute("data-variant");
  await page.getByRole("button", { name: "dark mode", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  await expect(object).toHaveAttribute("data-variant", next!);
  await page.waitForTimeout(6500);
  await expect(page.getByRole("button", { name: "Pause motion" })).toBeVisible();
  await expect(canvas).toHaveAttribute("data-playback", "loop");
  await expect(object).toHaveAttribute("data-variant", next!);
  await page.getByRole("button", { name: "Open canvas", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  await expect(object).toHaveAttribute("data-variant", next!);
  await expect(page.locator("canvas")).toHaveCount(1);
});

test("a pinned look is reproducible and failed model loading shows the fallback", async ({ page }) => {
  await page.route("**/tennis-asset*", route => route.abort());
  await page.goto("/animations?story=tennis&variant=0");
  await expect(page.locator(".uipack-object")).toHaveAttribute("data-variant", "0");
  await expect(page.locator(".uipack-object canvas")).toHaveAttribute("data-renderer", "fallback");
  await expect(page.getByRole("img", { name: "Tennis practice illustration" })).toBeVisible();
  await expect(page.getByRole("button", { name: /motion$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Another look", exact: true })).toHaveCount(0);
});

test("modeled tennis keeps painting within the mobile frame budget", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/animations?story=tennis&variant=0");
  const canvas = page.locator(".uipack-object canvas");
  await expect(canvas).toHaveAttribute("data-source", "blender");
  await canvas.scrollIntoViewIfNeeded();
  const start = Number(await canvas.getAttribute("data-frames"));
  const started = Date.now();
  await page.waitForTimeout(1200);
  const frames = Number(await canvas.getAttribute("data-frames")) - start;
  const elapsed = Date.now() - started;
  await testInfo.attach("mobile-viewport-paint-rate", { body: JSON.stringify({ frames, elapsed, paintsPerSecond: frames * 1000 / elapsed, note: "Desktop browser at 390px, not physical mobile hardware" }), contentType: "application/json" });
  expect(frames).toBeGreaterThan(12);
  expect(frames * 1000 / elapsed).toBeLessThan(34);
});

for (const kind of ['tennis', 'trading']) test(`${kind} keeps looping, pauses and respects reduced motion`, async ({ page }) => {
  test.setTimeout(45000);
  await page.goto(`/animations?story=${kind}&variant=0`);
  const canvas = page.locator('.uipack-object canvas');
  await expect(canvas).toHaveAttribute('data-playback', 'loop');
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(kind === 'tennis' ? 18500 : 6500);
  await expect(page.getByRole('button', { name: 'Pause motion' })).toBeVisible();
  const frames = Number(await canvas.getAttribute('data-frames'));
  await page.waitForTimeout(200);
  expect(Number(await canvas.getAttribute('data-frames'))).toBeGreaterThan(frames);
  await page.getByRole('button', { name: 'Pause motion' }).click();
  const paused = await canvas.getAttribute('data-frames');
  await page.waitForTimeout(200);
  expect(await canvas.getAttribute('data-frames')).toBe(paused);
  await page.getByRole('button', { name: 'Resume motion' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toHaveAttribute('data-phase', 'rest');
  const reduced = await canvas.getAttribute('data-frames');
  await page.waitForTimeout(200);
  expect(await canvas.getAttribute('data-frames')).toBe(reduced);
  await expect(page.getByRole('button', { name: /motion$/ })).toHaveCount(0);
});

test("offscreen object playback suspends and resumes without racing forward", async ({ page }) => {
  await page.goto("/animations?story=tennis&variant=0");
  const canvas=page.locator(".uipack-object canvas");
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-renderer","webgl");
  await page.waitForTimeout(300);
  await page.evaluate(() => { const spacer=document.createElement("div");spacer.style.height="2000px";document.body.prepend(spacer);window.scrollTo(0,0); });
  await page.waitForTimeout(150);
  const frames=await canvas.getAttribute("data-frames");
  const pose=Number(await canvas.getAttribute("data-pose"));
  await page.waitForTimeout(650);
  expect(await canvas.getAttribute("data-frames")).toBe(frames);
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(async()=>Number(await canvas.getAttribute("data-frames"))).toBeGreaterThan(Number(frames));
  const next=Number(await canvas.getAttribute("data-pose"));
  expect((next-pose+1)%1).toBeLessThan(.1);
});
