import { expect, test, type Page } from "./fixtures";

const deck = (page: Page) => page.getByRole("region", { name: "Deck player example" });
const settled = async (page: Page) => {
  await expect(deck(page)).not.toHaveAttribute("data-transitioning", "");
};

test.describe("/deck player", () => {
  test("advances, builds, morphs and zooms, then settles with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && !m.text().includes("favicon") && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/deck?view=present");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(deck(page)).toHaveAttribute("data-index", "1");
    await settled(page);
    await expect(page.locator(".uipack-deck-layer")).toHaveCount(1);
    // Three builds on the moves slide before the next slide.
    for (const s of ["1", "2", "3"]) {
      await page.keyboard.press("ArrowRight");
      await expect(deck(page)).toHaveAttribute("data-step", s);
    }
    await page.keyboard.press("ArrowRight");
    await expect(deck(page)).toHaveAttribute("data-index", "2");
    await settled(page);
    await page.keyboard.press("ArrowRight");
    await expect(deck(page)).toHaveAttribute("data-index", "3");
    await settled(page);
    await expect(page).toHaveURL(/slide=checks/);
    expect(errors).toEqual([]);
  });

  test("zoom flies into the target: mid-flight the new slide is small and clipped inside it", async ({ page }) => {
    await page.goto("/deck?slide=system&view=present");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    const mid = await page.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      const anims = document.getAnimations();
      anims.forEach((a) => {
        a.pause();
        a.currentTime = 200;
      });
      const layers = Array.from(document.querySelectorAll<HTMLElement>(".uipack-deck-layer"));
      const inner = layers.find((l) => l.dataset.slide === "checks")!;
      const target = layers.find((l) => l.dataset.slide === "system")!.querySelector('[data-morph="checks"]')!;
      const a = inner.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      return { layers: layers.length, innerW: a.width, targetW: t.width, clip: getComputedStyle(inner).clipPath };
    });
    expect(mid.layers).toBe(2);
    expect(mid.innerW).toBeLessThan(mid.targetW * 2);
    expect(mid.clip).toContain("inset");
    await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
    await settled(page);
    await expect(page.locator(".uipack-deck-layer")).toHaveCount(1);
    // Back reverses the zoom.
    await page.keyboard.press("ArrowLeft");
    await expect(deck(page)).toHaveAttribute("data-index", "2");
    await settled(page);
  });

  test("overview jumps and Escape returns focus to its button", async ({ page }) => {
    await page.goto("/deck?view=present");
    await deck(page).focus();
    await page.keyboard.press("g");
    const dialog = page.getByRole("dialog", { name: "All slides" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[aria-current="true"]')).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "All slides" })).toBeFocused();
    await page.getByRole("button", { name: "All slides" }).click();
    await dialog.getByRole("button", { name: /06 One clock/ }).click();
    await expect(deck(page)).toHaveAttribute("data-index", "5");
  });

  test("a speaker window stays in step with the audience window", async ({ page, context }) => {
    await page.goto("/deck?view=present");
    const speaker = await context.newPage();
    await speaker.goto("/deck?presenter=1");
    const speakerDeck = speaker.getByRole("region", { name: "Deck player example, speaker view" });
    await expect(speaker.getByText("Say")).toBeVisible();
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(speakerDeck).toHaveAttribute("data-index", "1");
    // Opening the speaker window did not move the audience.
    await expect(deck(page)).toHaveAttribute("data-index", "1");
    await speaker.keyboard.press("ArrowRight");
    await expect(deck(page)).toHaveAttribute("data-step", "1");
    await speaker.close();
  });

  test("reduced motion swaps slides with a short fade and no movement", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/deck?slide=system&view=present");
    await expect(deck(page)).toHaveAttribute("data-motion", "none");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    const transforms = await page.evaluate(() =>
      document.getAnimations().flatMap((a) => (a.effect as KeyframeEffect).getKeyframes().map((k) => k.transform).filter(Boolean)),
    );
    expect(transforms).toEqual([]);
    await settled(page);
    await expect(deck(page)).toHaveAttribute("data-index", "3");
  });

  test("phones open the deck as a readable document without page overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/deck");
    await expect(page.getByText("Reading · 8 slides")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: /Present from slide 3/ }).click();
    await expect(deck(page)).toHaveAttribute("data-index", "2");
    const controlsOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(controlsOverflow).toBeLessThanOrEqual(0);
  });

  test("dark theme renders tones and the inverse slide", async ({ page }) => {
    await page.goto("/deck?slide=clock&theme=dark&view=present");
    await expect(deck(page)).toHaveAttribute("data-theme", "dark");
    const bg = await page.locator(".uipack-deck-layer__bg").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(232, 236, 233)");
  });
});

test.describe("/deck bento", () => {
  const bento = (page: Page) => page.locator(".uipack-deck-bento");

  test("the camera tours three cells inside the bento box, then zooms from a cell into the next slide", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/deck?deck=bento&slide=quarter&view=present");
    await deck(page).focus();
    const box = await bento(page).boundingBox();
    for (const id of ["latency", "shipped", "risk"]) {
      await page.keyboard.press("ArrowRight");
      await expect(bento(page)).toHaveAttribute("data-focus", id);
      // The camera settles with the cell larger than at rest and centred in the bento's own box.
      await expect
        .poll(async () => {
          const cell = await page.locator(`[data-bento-cell="${id}"]`).boundingBox();
          return cell!.width > box!.width * 0.4 && Math.abs(cell!.x + cell!.width / 2 - (box!.x + box!.width / 2)) < 4;
        }, { timeout: 5_000 })
        .toBe(true);
    }
    await page.keyboard.press("ArrowRight");
    await expect(bento(page)).not.toHaveAttribute("data-focus");
    await page.keyboard.press("ArrowRight");
    await expect(deck(page)).toHaveAttribute("data-index", "2");
    await settled(page);
    expect(errors).toEqual([]);
  });
});
