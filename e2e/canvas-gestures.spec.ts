import { expect, test } from "@playwright/test";

test("trackpad pinch zooms around the pointer, clamps, resets, and stays inside the canvas", async ({
  page,
}) => {
  await page.goto("/?theme=light");
  const inline = page.locator("figure").first();
  const outsidePrevented = await inline
    .locator(".uipack__canvas")
    .evaluate((el) => {
      const e = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        deltaY: -20,
      });
      el.dispatchEvent(e);
      return e.defaultPrevented;
    });
  expect(outsidePrevented).toBe(false);
  await inline
    .getByRole("button", { name: "Open canvas", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const surface = dialog.locator(".uipack__canvas");
  const before = await surface.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const svg = el.querySelector("svg")!.getBoundingClientRect();
    return {
      x: rect.left + 260,
      y: rect.top + 140,
      u: (rect.left + 260 - svg.left) / svg.width,
      v: (rect.top + 140 - svg.top) / svg.height,
    };
  });
  const prevented = await surface.evaluate((el, point) => {
    const e = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: -50,
      clientX: point.x,
      clientY: point.y,
    });
    el.dispatchEvent(e);
    return e.defaultPrevented;
  }, before);
  expect(prevented).toBe(true);
  await expect(dialog.getByLabel("Zoom level")).toHaveText("149%");
  const after = await surface.evaluate((el, point) => {
    const svg = el.querySelector("svg")!.getBoundingClientRect();
    return {
      u: (point.x - svg.left) / svg.width,
      v: (point.y - svg.top) / svg.height,
    };
  }, before);
  expect(Math.abs(after.u - before.u)).toBeLessThan(0.003);
  expect(Math.abs(after.v - before.v)).toBeLessThan(0.003);
  const ordinaryWheel = await surface.evaluate((el) => {
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaX: 80,
    });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(ordinaryWheel).toBe(false);
  await page.keyboard.press("+");
  await expect(dialog.getByLabel("Zoom level")).toHaveText("186%");
  for (let i = 0; i < 3; i++)
    await surface.dispatchEvent("wheel", { ctrlKey: true, deltaY: -100 });
  await expect(dialog.getByLabel("Zoom level")).toHaveText("300%");
  await expect(
    dialog.getByRole("button", { name: "Zoom in", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("0");
  await expect(dialog.getByLabel("Zoom level")).toHaveText("100%");
  expect(await surface.evaluate((el) => el.scrollLeft + el.scrollTop)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("Safari gesture events and touch pinch share bounded zoom without double applying", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?theme=dark");
  await page
    .locator("figure")
    .first()
    .getByRole("button", { name: "Open canvas", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const surface = dialog.locator(".uipack__canvas");
  await surface.evaluate((el) => {
    const send = (name: string, scale: number) => {
      const event = new Event(name, { bubbles: true, cancelable: true });
      Object.assign(event, { scale, clientX: 180, clientY: 350 });
      el.dispatchEvent(event);
    };
    send("gesturestart", 1);
    send("gesturechange", 1.5);
    el.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        deltaY: -50,
      }),
    );
    send("gestureend", 1.5);
  });
  await expect(dialog.getByLabel("Zoom level")).toHaveText("150%");
  await dialog.getByRole("button", { name: "Fit", exact: true }).click();
  await surface.evaluate((el) => {
    const send = (
      name: string,
      touches: { clientX: number; clientY: number }[],
    ) => {
      const event = new Event(name, { bubbles: true, cancelable: true });
      Object.assign(event, { touches });
      el.dispatchEvent(event);
    };
    send("touchstart", [
      { clientX: 120, clientY: 350 },
      { clientX: 220, clientY: 350 },
    ]);
    send("touchmove", [
      { clientX: 95, clientY: 350 },
      { clientX: 245, clientY: 350 },
    ]);
    send("touchend", []);
  });
  await expect(dialog.getByLabel("Zoom level")).toHaveText("150%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: testInfo.outputPath("mobile-pinch.png") });
  await dialog.getByRole("button", { name: "Fit", exact: true }).click();
  await expect(dialog.getByLabel("Zoom level")).toHaveText("100%");
});

test("3D pinch changes camera zoom without rebuilding the renderer or changing the story stop", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/animations?story=harness-dive&stop=inside");
  await page.getByRole("button", { name: "Open canvas", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const scene = dialog.locator(".uipack-slide-scene");
  await expect(scene).toHaveAttribute("data-renderer", "ready");
  await scene
    .locator("canvas")
    .evaluate((el) => el.setAttribute("data-gesture-original", "true"));
  const labels = scene.locator(".uipack-slide-label");
  const beforePositions = await labels.evaluateAll((els) =>
    els.map((el) => (el as HTMLElement).style.transform).join("|"),
  );
  await scene.dispatchEvent("wheel", { ctrlKey: true, deltaY: -50 });
  await expect(dialog.getByLabel("Zoom level")).toHaveText("149%");
  await expect(scene.locator("canvas[data-gesture-original]")).toHaveCount(1);
  await expect
    .poll(() =>
      labels.evaluateAll((els) =>
        els.map((el) => (el as HTMLElement).style.transform).join("|"),
      ),
    )
    .not.toBe(beforePositions);
  await expect(scene).toHaveAttribute("data-stop", "inside");
  await scene.dispatchEvent("wheel", { ctrlKey: true, deltaY: -100 });
  await expect(dialog.getByLabel("Zoom level")).toHaveText("200%");
  await dialog.getByRole("button", { name: "Fit", exact: true }).click();
  await expect(dialog.getByLabel("Zoom level")).toHaveText("100%");
});
