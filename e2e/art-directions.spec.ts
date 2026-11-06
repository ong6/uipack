import { test, expect } from "./fixtures";
import { objectDirections, objectLooks } from "../src/objects/variants";
import { objectScenes } from "../src/objects/scene-list";
import { playAnimationTime } from "./helpers";
test.describe.configure({ mode: "parallel" });
// Canvas snapshots and video recording perturb the timings being measured.
// These tests still retain failure screenshots and their measured JSON samples.
const timingTest = test.extend({ trace: "off", video: "off" });
const kinds = ["ai", "tennis", "trading", "server", "travel", "reading"] as const;
// The render budget every look keeps at rest, at both widths: the mobile paint test below holds the
// same numbers while the scene plays.
const MAX_DRAW_CALLS = 220;
const MAX_TRIANGLES = 100_000;

// One test per object and each direction it offers (objectLooks: 17 pairs) steps through both
// themes and both widths in one page. WebKit runs each object's default look, enough to show each
// object's scene builds in its WebGL.
for (const kind of kinds)
  for (const variant of objectLooks[kind]) {
    const direction = objectDirections[variant];
    const tag = variant === objectLooks[kind][0] ? ["@cross-browser"] : [];
    test(`art direction ${kind}/${direction.id}: light and dark, 390 and 1440`, { tag }, async ({ page }, info) => {
      // Four theme/width builds of one scene: software WebGL on a loaded runner can pass 30 s.
      test.setTimeout(90_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const costs: { theme: string; width: number; calls: number; triangles: number }[] = [];
      for (const theme of ["light", "dark"])
        for (const width of [390, 1440]) {
          const where = `${theme} ${width}`;
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`/animations?story=${kind}&variant=${variant}&theme=${theme}`);
          const canvas = page.locator(".uipack-object canvas");
          // The first load in a fresh worker can wait on the dev server's first compile of the scene.
          await expect(canvas, where).toHaveAttribute("data-renderer", "webgl", { timeout: 15_000 });
          await expect(canvas, where).toHaveAttribute("data-phase", "rest", { timeout: 15_000 });
          await expect(canvas, where).toHaveCSS("opacity", "1", { timeout: 15_000 });
          await expect(canvas, where).toHaveAttribute("data-art-direction", direction.id);
          await canvas.scrollIntoViewIfNeeded();
          expect(await page.evaluate(() => document.documentElement.scrollWidth), where).toBeLessThanOrEqual(width);
          await page.locator(".uipack-object").screenshot({ path: info.outputPath(`${kind}-${variant}-${theme}-${width}.png`) });
          costs.push({
            theme,
            width,
            calls: Number(await canvas.getAttribute("data-draw-calls")),
            triangles: Number(await canvas.getAttribute("data-triangles")),
          });
        }
      // Attach before asserting so a failing budget retains the measured evidence.
      await info.attach("render-cost", { body: JSON.stringify({ kind, variant, costs }), contentType: "application/json" });
      for (const c of costs) {
        expect(c.calls, `draw calls at ${c.theme} ${c.width}`).toBeLessThan(MAX_DRAW_CALLS);
        expect(c.triangles, `triangles at ${c.theme} ${c.width}`).toBeLessThan(MAX_TRIANGLES);
      }
      expect(errors).toEqual([]);
    });
  }

// Playback for every direction but Studio (whose loop the objects spec covers), one fresh page
// each, on a subject that offers it: travel for Paper and Kinetic (which also switch to each
// other there), the matrix's own picks otherwise. In one shared page the fake clock,
// reduced-motion emulation and the lost context carried from one direction into the next and the
// later directions hung.
const playbackStory: Record<number, (typeof kinds)[number]> = { 1: "travel", 2: "travel", 3: "tennis", 4: "reading", 5: "ai" };
for (const variant of [1, 2, 3, 4, 5]) {
  timingTest(
    `${objectDirections[variant].id} loops, pauses, holds under reduced motion, opens a canvas and survives context loss`,
    async ({ page }) => {
      // Five scene builds (the page, a switched look for Paper and Kinetic, Open canvas and back)
      // and 12.5 s of stepped playback: CI's software WebGL ran Paper past 60 s.
      test.setTimeout(process.env.CI ? 120_000 : 60_000);
      await page.clock.install();
      const id = objectDirections[variant].id;
      const story = playbackStory[variant];
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto(`/animations?story=${story}&variant=${variant}`);
      const canvas = page.locator(".uipack-object canvas");
      // The first scene in a fresh CI shard compiles its shaders on software WebGL, which can take
      // longer than the default 5s; later scenes reuse the warm chunk.
      await expect(canvas, id).toHaveAttribute("data-renderer", "webgl", { timeout: 20_000 });
      await expect(canvas, id).toHaveAttribute("data-playback", "loop");
      await canvas.scrollIntoViewIfNeeded();
      // The loop keeps playing past the end of its first 12s cycle.
      if (variant <= 2) await playAnimationTime(page, 12500);
      await page.getByRole("button", { name: "Pause motion", exact: true }).click();
      await expect(page.getByRole("button", { name: "Resume motion", exact: true })).toBeVisible();
      const paused = await canvas.getAttribute("data-pose");
      // Wall clock on purpose: paused holds the pose as time passes (and reduced motion below paints nothing).
      await page.waitForTimeout(200);
      expect(await canvas.getAttribute("data-pose"), `${id} holds its pose while paused`).toBe(paused);
      await page.getByRole("button", { name: "Resume motion", exact: true }).click();
      await expect.poll(() => canvas.getAttribute("data-pose"), { message: `${id} resumes` }).not.toBe(paused);
      // The direction buttons change the look from the keyboard.
      let shown: string = id;
      if (variant <= 2) {
        // Named by its content: the direction's name, then its one-line description.
        await page.getByRole("button", { name: variant === 1 ? /^Kinetic sculptures\b/ : /^Paper worlds\b/ }).focus();
        await page.keyboard.press("Enter");
        shown = variant === 1 ? "kinetic" : "paper-theatre";
      }
      await expect(canvas).toHaveAttribute("data-art-direction", shown);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(canvas, id).toHaveAttribute("data-phase", "rest");
      const frames = await canvas.getAttribute("data-frames");
      await page.waitForTimeout(200);
      expect(await canvas.getAttribute("data-frames"), `${id} paints nothing under reduced motion`).toBe(frames);
      await page.getByRole("button", { name: "Open canvas", exact: true }).click();
      await expect(page.locator("canvas")).toHaveCount(1);
      await expect(canvas).toHaveAttribute("data-art-direction", shown);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open canvas", exact: true })).toBeFocused();
      await canvas.dispatchEvent("webglcontextlost");
      await expect(canvas, id).toHaveAttribute("data-renderer", "fallback");
      const title = objectScenes.find((scene) => scene.id === story)!.title;
      await expect(page.getByRole("img", { name: `${title} illustration` })).toBeVisible();
    },
  );
}

// The paint budget at phone width, one test per direction on its heaviest object (the most draw
// calls at rest in the render test above, whose numbers do not change with width or theme). Chromium only: the thresholds are
// calibrated to its WebGL, locally and on CI's Mesa.
// Measured 2026-11-06 over the subjects each direction keeps (most calls at rest, either theme or
// width): paper reading 17, kinetic AI 31, cartoon tennis 109 (and the most triangles, 26k),
// realistic server 69, abstract AI 20.
const heaviest: Record<number, (typeof kinds)[number]> = { 1: "reading", 2: "ai", 3: "tennis", 4: "server", 5: "ai" };
for (const variant of [1, 2, 3, 4, 5]) {
  const kind = heaviest[variant];
  timingTest(`mobile geometry and paint budget: ${kind}/${objectDirections[variant].id}`, async ({ page, browserName }, info) => {
    test.skip(browserName !== "chromium", "paint budgets are calibrated to Chromium's WebGL");
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/animations?story=${kind}&variant=${variant}`);
    const canvas = page.locator(".uipack-object canvas");
    await expect(canvas).toHaveAttribute("data-renderer", "webgl");
    await canvas.scrollIntoViewIfNeeded();
    // Wait for playback to start, then sample frames and elapsed time together in
    // the browser so protocol round trips do not distort the measured paint rate.
    await expect.poll(async () => Number(await canvas.getAttribute("data-frames"))).toBeGreaterThan(3);
    const sample = await canvas.evaluate(async (element) => {
      const canvas = element as HTMLCanvasElement;
      const gl = canvas.getContext("webgl2");
      const debug = gl?.getExtension("WEBGL_debug_renderer_info");
      const renderer = gl?.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
      const first = Number(canvas.dataset.frames),
        started = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const elapsed = performance.now() - started;
      const frames = Number(canvas.dataset.frames) - first;
      return {
        renderer,
        frames,
        elapsed,
        fps: (frames * 1000) / elapsed,
        calls: Number(canvas.dataset.drawCalls),
        triangles: Number(canvas.dataset.triangles),
      };
    });
    const metrics = { kind, variant, ...sample };
    // Attach before asserting so a failing budget retains the measured evidence.
    await info.attach("mobile-viewport-performance", {
      body: JSON.stringify({ samples: [metrics], note: "Desktop engine at phone width; not a physical phone benchmark" }),
      contentType: "application/json",
    });
    const fs = await import("node:fs/promises");
    await fs.writeFile(info.outputPath("performance.json"), JSON.stringify(metrics, null, 2));
    expect(sample.calls).toBeLessThan(MAX_DRAW_CALLS);
    expect(sample.triangles).toBeLessThan(MAX_TRIANGLES);
    // 15 a second (half the 30 cap) locally; CI's software WebGL lands right on it, so it gets 13.
    expect(sample.fps).toBeGreaterThan(process.env.CI ? 13 : 15);
    expect(sample.fps).toBeLessThan(34);
  });
}
