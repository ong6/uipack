import { test, expect, waitForStable } from "./fixtures";
import { playAnimationTime } from "./helpers";
// The player: playback, fallbacks, theme changes and suspension. The renders themselves (every
// subject in both themes at both widths, the budgets) are in ink.spec.ts.
const built = ["ai", "contact", "tennis", "trading", "server", "travel", "reading"];

test("object playback pauses, finishes, replays and opens one accessible canvas", async ({ page }) => {
  // Contact is the one scene that plays once and offers Replay (every other subject loops).
  await page.goto("/animations?story=contact");
  const canvas = page.locator(".uipack-object canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  await page.getByRole("button", { name: "Pause motion" }).click();
  await expect(page.getByRole("button", { name: "Resume motion" })).toBeVisible();
  const frames = await canvas.getAttribute("data-frames");
  // Wall clock on purpose (here and below): a paused or finished scene paints nothing as time passes.
  await page.waitForTimeout(150);
  expect(await canvas.getAttribute("data-frames")).toBe(frames);
  await page.getByRole("button", { name: "Resume motion" }).click();
  await expect(page.getByRole("button", { name: "Replay motion" })).toBeVisible({ timeout: 10000 });
  const resting = await canvas.getAttribute("data-frames");
  await page.waitForTimeout(150);
  expect(await canvas.getAttribute("data-frames")).toBe(resting);
  await page.getByRole("button", { name: "Replay motion" }).click();
  await expect(page.getByRole("button", { name: "Pause motion" })).toBeVisible();
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

test("renderer failure retains the labelled object fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.includes("webgl")) return null;
      return original.apply(this, [type, ...args] as never);
    } as typeof original;
  });
  await page.goto("/animations?story=contact");
  await expect(page.locator(".uipack-object canvas")).toHaveAttribute("data-renderer", "fallback");
  await expect(page.getByRole("img", { name: "Contact inbox illustration" })).toBeVisible();
  // Only a scene that cannot be drawn shows its drawing (placeholder="none" hides it otherwise).
  await expect(page.locator(".uipack-object__fallback")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("button", { name: /motion$/ })).toHaveCount(0);
});

test("switching objects creates a usable renderer every time", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/animations?story=travel");
  for (const title of ["Tennis practice", "Local map", "Trading journal", "Inference study", "Contact inbox"]) {
    await page.getByRole("button", { name: title, exact: true }).click();
    await expect(page.locator(".uipack-object canvas")).toHaveAttribute("data-renderer", "webgl");
    await expect(page.getByRole("button", { name: "Pause motion" })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test("a theme change recolours the running scene in place, from the page's roles", async ({ page }) => {
  await page.goto("/animations?story=server&theme=light");
  const canvas = page.locator(".uipack-object canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  const light = await canvas.getAttribute("data-colors");
  await canvas.evaluate((element) => ((element as HTMLCanvasElement & { kept?: boolean }).kept = true));
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await expect(page.locator(".uipack-object")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => canvas.getAttribute("data-colors")).not.toBe(light);
  // The same canvas and renderer: recoloured, not rebuilt.
  expect(await canvas.evaluate((element) => (element as HTMLCanvasElement & { kept?: boolean }).kept)).toBe(true);
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  await expect(page.getByRole("button", { name: "Pause motion" })).toBeVisible();
  // A site's roles reach the scene with no prop: set the stage's colours and the scene follows.
  await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(".uipack-object")!;
    stage.style.setProperty("--object-accent", "rgb(200, 30, 90)");
  });
  await expect.poll(() => canvas.getAttribute("data-colors")).toMatch(/#c81e5a$/);
});

test("phone-width painting stays within its 30 fps cap", async ({ page }, testInfo) => {
  // A paint rate means something on a real GPU; CI renders WebGL on the CPU (Mesa llvmpipe).
  test.skip(
    Boolean(process.env.CI) && process.platform === "linux",
    "paint rate is checked on real GPUs, not CI's software WebGL",
  );
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/animations?story=tennis");
  const canvas = page.locator(".uipack-object canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(async () => Number(await canvas.getAttribute("data-frames"))).toBeGreaterThan(0);
  const start = Number(await canvas.getAttribute("data-frames"));
  const started = Date.now();
  // Wall clock on purpose: this measures paints per second.
  await page.waitForTimeout(1200);
  const frames = Number(await canvas.getAttribute("data-frames")) - start;
  const elapsed = Date.now() - started;
  await testInfo.attach("mobile-viewport-paint-rate", {
    body: JSON.stringify({ frames, elapsed, paintsPerSecond: (frames * 1000) / elapsed, note: "Desktop browser at 390px" }),
    contentType: "application/json",
  });
  expect(frames).toBeGreaterThan(12);
  expect((frames * 1000) / elapsed).toBeLessThan(34);
});

for (const kind of ["tennis", "trading"])
  test(`${kind} keeps looping, pauses and respects reduced motion`, async ({ page }) => {
    test.slow();
    await page.clock.install();
    await page.goto(`/animations?story=${kind}`);
    const canvas = page.locator(".uipack-object canvas");
    await expect(canvas).toHaveAttribute("data-playback", "loop");
    await canvas.scrollIntoViewIfNeeded();
    // Past the end of the 6s tennis loop, and past the 5.4s rest point of a once-only scene, it still plays.
    await playAnimationTime(page, 6500);
    await expect(page.getByRole("button", { name: "Pause motion" })).toBeVisible();
    const frames = Number(await canvas.getAttribute("data-frames"));
    await expect.poll(async () => Number(await canvas.getAttribute("data-frames"))).toBeGreaterThan(frames);
    await page.getByRole("button", { name: "Pause motion" }).click();
    await expect(page.getByRole("button", { name: "Resume motion" })).toBeVisible();
    const paused = await canvas.getAttribute("data-frames");
    // Wall clock on purpose (here and below): paused, or reduced, paints nothing as time passes.
    await page.waitForTimeout(200);
    expect(await canvas.getAttribute("data-frames")).toBe(paused);
    await page.getByRole("button", { name: "Resume motion" }).click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(canvas).toHaveAttribute("data-phase", "rest");
    const reduced = await canvas.getAttribute("data-frames");
    await page.waitForTimeout(200);
    expect(await canvas.getAttribute("data-frames")).toBe(reduced);
    await expect(page.getByRole("button", { name: /motion$/ })).toHaveCount(0);
  });

test("a preloaded scene is built and painted but does not play or show Pause", async ({ page }) => {
  await page.goto("/animations?story=travel&play=held");
  const canvas = page.locator(".uipack-object canvas");
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect(page.locator('.uipack-object[data-active="false"]')).toHaveCount(1);
  // The loop never starts: no frame is counted, however long it waits.
  await page.waitForTimeout(650);
  expect(await canvas.getAttribute("data-frames")).toBeNull();
  await expect(page.getByRole("button", { name: /motion$/ })).toHaveCount(0);
});

test("offscreen object playback suspends and resumes without racing forward", async ({ page }) => {
  await page.goto("/animations?story=tennis");
  const canvas = page.locator(".uipack-object canvas");
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  await expect.poll(async () => Number(await canvas.getAttribute("data-frames"))).toBeGreaterThan(0);
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.style.height = "2000px";
    document.body.prepend(spacer);
    window.scrollTo(0, 0);
  });
  // Off screen, painting stops. Sample slower than one frame takes under CI's software WebGL, or a
  // frame still in flight when the canvas left the screen lands after "stable".
  await waitForStable(() => canvas.getAttribute("data-frames"), { every: 400 });
  const frames = await canvas.getAttribute("data-frames");
  const pose = Number(await canvas.getAttribute("data-pose"));
  // Wall clock on purpose: while off screen, nothing paints however long it waits.
  await page.waitForTimeout(650);
  expect(await canvas.getAttribute("data-frames")).toBe(frames);
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(async () => Number(await canvas.getAttribute("data-frames"))).toBeGreaterThan(Number(frames));
  const next = Number(await canvas.getAttribute("data-pose"));
  expect((next - pose + 1) % 1).toBeLessThan(0.1);
});

for (const theme of ["light", "dark"])
  for (const width of [390, 1440]) {
    test(`page surface blends at ${width} in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/animations?story=travel&surface=page&theme=${theme}`);
      const object = page.locator(".uipack-object");
      await expect(object.locator("canvas")).toHaveAttribute("data-renderer", "webgl");
      await expect(object).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(object).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
      await page.goto(`/animations?story=travel&theme=${theme}`);
      await expect(object).toHaveAttribute("data-surface", "styled");
      await expect(object).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    });
  }

test("every subject builds without errors", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const kind of built) {
    await page.goto(`/animations?story=${kind}`);
    await expect(page.locator(".uipack-object canvas")).toHaveAttribute("data-phase", "rest");
  }
  expect(errors).toEqual([]);
});
