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
    await expect(page.getByText("Reading · 7 slides")).toBeVisible();
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

/** Pause every animation at `ms` of clock time and read something from the page. */
const at = <T,>(page: Page, ms: number, read: () => T) =>
  page.evaluate(
    async ([t, fn]) => {
      await new Promise(requestAnimationFrame);
      document.getAnimations().forEach((a) => {
        a.pause();
        a.currentTime = t as number;
      });
      // eslint-disable-next-line no-new-func
      return new Function(`return (${fn as string})()`)();
    },
    [ms, read.toString()] as const,
  ) as Promise<T>;

test.describe("/deck motion: no mid-flight glitches", () => {
  test("a text morph shows one copy after the first 10%, never both", async ({ page }) => {
    await page.goto("/deck?view=present");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    const mid = await at(page, 0.1 * 760, () => {
      const layers = Array.from(document.querySelectorAll<HTMLElement>(".uipack-deck-layer"));
      const copy = (id: string) => getComputedStyle(layers.find((l) => l.dataset.slide === id)!.querySelector('[data-morph="title"]')!).opacity;
      return { out: copy("cover"), in: copy("moves") };
    });
    expect(mid).toEqual({ out: "0", in: "1" });
  });

  test("a number morphs alone: its tile loses its box and the words beside it wait", async ({ page }) => {
    await page.goto("/deck?deck=consulting&view=present");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    const mid = await at(page, 0.3 * 760, () => {
      const layers = Array.from(document.querySelectorAll<HTMLElement>(".uipack-deck-layer"));
      const summary = layers.find((l) => l.dataset.slide === "summary")!;
      const situation = layers.find((l) => l.dataset.slide === "situation")!;
      const panel = summary.querySelector('[data-morph="cost-per-order"]')!.closest(".uipack-cx-panel")!;
      const words = situation.querySelector(".uipack-cx-title > span:not([data-morph])")!;
      return { panelBg: getComputedStyle(panel).backgroundColor, words: Number(getComputedStyle(words).opacity) };
    });
    expect(mid.panelBg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(mid.words).toBe(0);
  });

  test("a zoom into an ink slide keeps the outgoing paper slide paper, and clears its neighbours", async ({ page }) => {
    await page.goto("/deck?deck=bento&slide=quarter&step=4&view=present");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    const first = await at(page, 10, () => {
      const outer = document.querySelector<HTMLElement>('.uipack-deck-layer[data-slide="quarter"]')!;
      return getComputedStyle(outer.querySelector(".uipack-deck-layer__bg")!).backgroundColor;
    });
    expect(first).toBe("rgb(246, 245, 241)");
    const later = await at(page, 0.35 * 1150, () =>
      Number(getComputedStyle(document.querySelector('.uipack-deck-layer[data-slide="quarter"] [data-bento-cell="cost"]')!).opacity),
    );
    expect(later).toBe(0);
  });

  test("a bento cell never shows its face and its detail at once", async ({ page }) => {
    await page.goto("/deck?deck=bento&slide=quarter&step=1&view=present");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    for (const ms of [100, 250, 400, 550]) {
      const both = await at(page, ms, () =>
        Array.from(document.querySelectorAll(".uipack-deck-bento__cell")).some((cell) => {
          const face = Number(getComputedStyle(cell.querySelector(".uipack-deck-bento__face")!).opacity);
          const detail = cell.querySelector(".uipack-deck-bento__detail");
          return detail ? face > 0.05 && Number(getComputedStyle(detail).opacity) > 0.05 : false;
        }),
      );
      expect(both, `face and detail both visible at ${ms} ms`).toBe(false);
    }
  });
});

test.describe("/deck layout", () => {
  for (const id of ["moves", "bento"]) {
    test(`${id}: every slide's footer sits at the same height`, async ({ page }) => {
      await page.goto(`/deck?deck=${id}&view=present&motion=none`);
      await deck(page).focus();
      const tops = new Map<string, number>();
      for (let guard = 0; guard < 40; guard++) {
        await settled(page);
        const { slide, top } = await page.evaluate(() => {
          const layer = document.querySelector<HTMLElement>(".uipack-deck-layer:not([aria-hidden])")!;
          const s = layer.getBoundingClientRect().width / 1920;
          const foot = layer.querySelector(".uipack-deck-footer")!.getBoundingClientRect();
          return { slide: layer.dataset.slide!, top: Math.round((foot.top - layer.getBoundingClientRect().top) / s) };
        });
        tops.set(slide, top);
        if (await page.getByRole("button", { name: "Next" }).isDisabled()) break;
        await page.keyboard.press("ArrowRight");
      }
      expect(tops.size).toBeGreaterThanOrEqual(5);
      expect(new Set(tops.values()).size, JSON.stringify(Object.fromEntries(tops))).toBe(1);
    });
  }
});

test.describe("/deck print and PDF", () => {
  test("?view=print saves a PDF with one 16:9 page per slide", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "page.pdf() is Chromium-only");
    for (const [id, count] of [["moves", 7], ["bento", 5], ["consulting", 8]] as const) {
      await page.goto(`/deck?deck=${id}&view=print`);
      await expect(page.locator(".uipack-deck-print__page")).toHaveCount(count);
      await page.evaluate(() => document.fonts.ready);
      const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString("latin1");
      expect(pdf.match(/\/Type\s*\/Page[^s]/g), `${id} pages`).toHaveLength(count);
      // 1280×720 CSS px is 960×540 pt: 16:9.
      expect(pdf).toMatch(/\/MediaBox\s*\[0 0 960 540\]/);
    }
  });

  test("the PDF / Print button prints every slide from a copy, then hands focus back", async ({ page }) => {
    await page.goto("/deck?view=present");
    await page.evaluate(() => {
      const w = window as unknown as { printed: number };
      w.printed = -1;
      window.print = () => {
        w.printed = document.querySelectorAll(".uipack-deck-print-root .uipack-deck-print__page").length;
        window.dispatchEvent(new Event("afterprint"));
      };
    });
    await page.getByRole("button", { name: "PDF / Print" }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(7);
    await expect(page.locator(".uipack-deck-print-root")).toHaveCount(0);
    await expect(deck(page)).toBeFocused();
  });
});
