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
    // Advance, morph (the 19 days into its row), advance, zoom (into the flagged slide).
    for (const [index, id] of [["1", "problem"], ["2", "evidence"], ["3", "ghost"], ["4", "fix"]] as const) {
      await page.keyboard.press("ArrowRight");
      await expect(deck(page)).toHaveAttribute("data-index", index);
      await settled(page);
      await expect(page.locator(".uipack-deck-layer")).toHaveCount(1);
      await expect(page).toHaveURL(new RegExp(`slide=${id}`));
    }
    // Two builds on the zoomed-into slide before the next slide.
    for (const s of ["1", "2"]) {
      await page.keyboard.press("ArrowRight");
      await expect(deck(page)).toHaveAttribute("data-step", s);
    }
    await page.keyboard.press("ArrowRight");
    await expect(deck(page)).toHaveAttribute("data-index", "5");
    await settled(page);
    expect(errors).toEqual([]);
  });

  test("zoom flies into the target: mid-flight the new slide is small and clipped inside it", async ({ page }) => {
    await page.goto("/deck?slide=ghost&view=present");
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
      const inner = layers.find((l) => l.dataset.slide === "fix")!;
      const target = layers.find((l) => l.dataset.slide === "ghost")!.querySelector('[data-morph="flagged"]')!;
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
    // The camera lands on a finding, not an empty table: the first row is there before any build.
    await expect(deck(page)).toHaveAttribute("data-step", "0");
    const rows = page.locator(".uipack-deck-layer .deck-demo-fix__table li");
    await expect(rows.first()).toBeVisible();
    await expect(rows.first()).toHaveCSS("opacity", "1");
    // Back reverses the zoom.
    await page.keyboard.press("ArrowLeft");
    await expect(deck(page)).toHaveAttribute("data-index", "3");
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
    await dialog.getByRole("button", { name: /06 Three pilots/ }).click();
    await expect(deck(page)).toHaveAttribute("data-index", "5");
    // Picking a slide hands focus to the deck, so Space moves on rather than reopening the overview.
    await expect(deck(page)).toBeFocused();
    await settled(page);
    await page.keyboard.press("Space");
    await expect(dialog).toBeHidden();
    await expect(deck(page)).toHaveAttribute("data-index", "6");
  });

  for (const [width, height] of [
    [390, 844],
    [1280, 900],
  ] as const) {
    test(`Read then Present shows a scaled slide at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/deck?view=read");
      await page.getByRole("button", { name: /Present from slide 3/ }).click();
      await expect(deck(page)).toHaveAttribute("data-index", "2");
      const canvas = page.locator(".uipack-deck-stage .uipack-deck-canvas");
      await expect(canvas).toBeVisible();
      const scale = await canvas.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
      expect(scale).toBeGreaterThan(0);
      await expect(page.locator(".uipack-deck-stage .uipack-deck-slide").first()).toBeVisible();
      // And back to reading, then Present from the top.
      await page.getByRole("button", { name: "Read", exact: true }).click();
      await page.getByRole("button", { name: "Present", exact: true }).click();
      await expect(deck(page)).toHaveAttribute("data-index", "0");
      expect(await canvas.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(0);
    });
  }

  test("at 1280×900 the slide and its controls fit the first screen", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/deck?view=present");
    // The page fits the deck to the window once its controls have mounted.
    await expect.poll(() => page.locator(".uipack-deck-controls").evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(900);
  });

  for (const [width, height] of [
    [1440, 900],
    [1440, 1000],
    [1920, 1080],
  ] as const) {
    test(`at ${width}×${height} the controls end where the slide ends, and stay on screen`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/deck?view=present");
      await expect(page.getByRole("button", { name: "Full screen" })).toBeVisible();
      const read = () =>
        page.evaluate(() => {
          const stage = document.querySelector(".uipack-deck-stage")!.getBoundingClientRect();
          const tools = Array.from(document.querySelectorAll(".uipack-deck-controls button")).map((b) => b.getBoundingClientRect());
          return { gap: Math.round(Math.abs(Math.max(...tools.map((t) => t.right)) - stage.right)), bottom: Math.max(...tools.map((t) => t.bottom)) };
        });
      await expect.poll(async () => (await read()).gap).toBeLessThanOrEqual(1);
      expect((await read()).bottom).toBeLessThanOrEqual(height);
    });
  }

  // WebKit's default Tab skips buttons, so a dialog of buttons that leaves Tab to the browser
  // loses focus to the page: Escape then does nothing and the deck keys stay off. Runs in both engines.
  test("the overview keeps Tab inside, Escape still closes it, the page behind is inert, a backdrop click closes it", async ({ page }) => {
    await page.goto("/deck?view=present");
    await deck(page).focus();
    await page.keyboard.press("g");
    const dialog = page.getByRole("dialog", { name: "All slides" });
    await expect(dialog).toBeVisible();
    const items = await dialog.locator("button").evaluateAll((els) => els.filter((el) => !el.closest("[inert]")).length);
    for (let i = 0; i < items + 2; i++) {
      await page.keyboard.press(i % 3 === 2 ? "Shift+Tab" : "Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement)), `after Tab ${i + 1}`).toBe(true);
    }
    // Everything outside the dialog is inert while it is open.
    await expect(page.locator(".showcase-header")).toHaveAttribute("inert", "");
    await expect(page.locator(".uipack-deck-controls")).toHaveAttribute("inert", "");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "All slides" })).toBeFocused();
    await expect(page.locator("[inert]:not(.uipack-deck-layer)")).toHaveCount(0);
    // The deck keys work again.
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(deck(page)).toHaveAttribute("data-index", "1");
    // Escape still closes it when focus has left the dialog for the page body.
    await page.keyboard.press("g");
    await expect(dialog).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // A click on the backdrop, outside the header and tiles, closes it.
    await deck(page).focus();
    await page.keyboard.press("g");
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dialog).toBeHidden();
  });

  test("a speaker window stays in step with the audience window", async ({ page, context }) => {
    await page.goto("/deck?view=present");
    const speaker = await context.newPage();
    await speaker.goto("/deck?presenter=1");
    const speakerDeck = speaker.getByRole("region", { name: "Deck player example, speaker view" });
    await expect(speaker.getByRole("heading", { name: "Say", exact: true })).toBeVisible();
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(speakerDeck).toHaveAttribute("data-index", "1");
    // Opening the speaker window did not move the audience.
    await expect(deck(page)).toHaveAttribute("data-index", "1");
    await speaker.keyboard.press("ArrowRight");
    await expect(deck(page)).toHaveAttribute("data-index", "2");
    await speaker.close();
  });

  test("reduced motion swaps slides with a short fade and no movement", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/deck?slide=ghost&view=present");
    await expect(deck(page)).toHaveAttribute("data-motion", "none");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    const transforms = await page.evaluate(() =>
      document.getAnimations().flatMap((a) => (a.effect as KeyframeEffect).getKeyframes().map((k) => k.transform).filter(Boolean)),
    );
    expect(transforms).toEqual([]);
    await settled(page);
    await expect(deck(page)).toHaveAttribute("data-index", "4");
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
    await page.goto("/deck?slide=plan&theme=dark&view=present");
    await expect(deck(page)).toHaveAttribute("data-theme", "dark");
    const bg = await page.locator(".uipack-deck-layer__bg").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(232, 236, 233)");
  });
});

test.describe("/deck bento", () => {
  const bento = (page: Page) => page.locator(".uipack-deck-bento");

  test("the camera tours two cells inside the bento box, then zooms from the risk cell into the risk slide", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/deck?deck=bento&slide=quarter&view=present");
    await deck(page).focus();
    const box = await bento(page).boundingBox();
    for (const id of ["latency", "shipped"]) {
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
    await expect(page).toHaveURL(/slide=risk/);
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
      return new Function(`return (${fn as string})()`)();
    },
    [ms, read.toString()] as const,
  ) as Promise<T>;

test.describe("/deck motion: no mid-flight glitches", () => {
  test("a morphing number shows one copy, travels as it shrinks, and the slide around it holds", async ({ page }) => {
    await page.goto("/deck?slide=problem&view=present");
    await deck(page).focus();
    await settled(page);
    await page.keyboard.press("ArrowRight");
    const mid = await at(page, 0.4 * 760, () => {
      const layers = Array.from(document.querySelectorAll<HTMLElement>(".uipack-deck-layer"));
      const days = (id: string) => layers.find((l) => l.dataset.slide === id)!.querySelector<HTMLElement>('[data-morph="days"]')!;
      const r = days("evidence").getBoundingClientRect();
      const scale = layers[0].getBoundingClientRect().width / 1920;
      const end = days("evidence").offsetWidth * scale;
      const start = days("problem").offsetWidth * scale;
      return {
        out: getComputedStyle(days("problem")).opacity,
        in: getComputedStyle(days("evidence")).opacity,
        shrinking: r.width > end * 1.05 && r.width < start * 0.99,
      };
    });
    expect(mid).toEqual({ out: "0", in: "1", shrinking: true });
    // At 25% the outgoing heading is still on screen: the frame never empties to a lone number.
    const heading = await at(page, 0.25 * 760, () =>
      Number(getComputedStyle(document.querySelector('.uipack-deck-layer[data-slide="problem"] .uipack-deck-heading')!).opacity),
    );
    expect(heading).toBeGreaterThan(0.9);
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

  test("a zoom out of a bento cell keeps the outgoing slide's paper, and clears its neighbours", async ({ page }) => {
    await page.goto("/deck?deck=bento&slide=quarter&step=3&view=present");
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

  test("a zoom moves the camera from the first 10%, and the target's box fades instead of scaling into bars", async ({ page }) => {
    await page.goto("/deck?slide=ghost&view=present");
    await deck(page).focus();
    await settled(page);
    await page.keyboard.press("ArrowRight");
    const early = await at(page, 0.1 * 1150, () => {
      const outer = document.querySelector<HTMLElement>('.uipack-deck-layer[data-slide="ghost"]')!;
      return new DOMMatrix(getComputedStyle(outer).transform).a;
    });
    expect(early).toBeGreaterThan(1.04);
    const mid = await at(page, 0.5 * 1150, () => {
      const box = document.querySelector<HTMLElement>('.uipack-deck-layer[data-slide="ghost"] [data-morph="flagged"]')!;
      const cs = getComputedStyle(box);
      return { border: cs.borderTopColor, bg: cs.backgroundColor, shadow: cs.boxShadow };
    });
    expect(mid.border).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(mid.bg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(mid.shadow).toBe("none");
  });

  test("a morph keeps the outgoing panels until the incoming ones arrive", async ({ page }) => {
    await page.goto("/deck?deck=consulting&view=present");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    const opacityOf = () =>
      Number(getComputedStyle(document.querySelector('.uipack-deck-layer[data-slide="summary"] .uipack-cx-sowhat')!).opacity);
    expect(await at(page, 0.3 * 760, opacityOf)).toBeGreaterThan(0.9);
    expect(await at(page, 0.62 * 760, opacityOf)).toBe(0);
  });

  test("a morph hands words over rather than printing two lines on top of each other", async ({ page }) => {
    await page.goto("/deck?slide=problem&view=present");
    await deck(page).focus();
    await settled(page);
    await page.keyboard.press("ArrowRight");
    for (const f of [0.3, 0.4, 0.45, 0.5, 0.6]) {
      const o = await at(page, f * 760, () => {
        const eyebrow = (id: string) => Number(getComputedStyle(document.querySelector(`.uipack-deck-layer[data-slide="${id}"] .uipack-deck-eyebrow`)!).opacity);
        return { out: eyebrow("problem"), in: eyebrow("evidence") };
      });
      expect(Math.min(o.out, o.in), `both eyebrows showing at ${f}`).toBeLessThan(0.15);
    }
  });

  test("bento camera: the cell being left keeps its detail, the next one waits, and no face rides the pull-back", async ({ page }) => {
    // `at` serialises its reader, so each one names its cell inline.
    const latency = () => Number(getComputedStyle(document.querySelector('[data-bento-cell="latency"] .uipack-deck-bento__detail')!).opacity);
    const shipped = () => Number(getComputedStyle(document.querySelector('[data-bento-cell="shipped"] .uipack-deck-bento__detail')!).opacity);
    // Cell to cell: latency → shipped.
    await page.goto("/deck?deck=bento&slide=quarter&step=1&view=present");
    await deck(page).focus();
    await settled(page);
    await page.keyboard.press("ArrowRight");
    expect(await at(page, 0.3 * 860, latency)).toBeGreaterThan(0.9);
    expect(await at(page, 0.5 * 860, shipped)).toBe(0);
    expect(await at(page, 0.95 * 860, shipped)).toBeGreaterThan(0.5);
    // The pull-back: the grid is partly outside the box mid-move, so every face waits.
    await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
    await page.keyboard.press("ArrowRight");
    const faces = await at(page, 0.5 * 860, () =>
      Math.max(
        ...Array.from(document.querySelectorAll(".uipack-deck-layer:not([aria-hidden]) .uipack-deck-bento__face"), (f) => Number(getComputedStyle(f).opacity)),
      ),
    );
    expect(faces).toBe(0);
    expect(await at(page, 0.4 * 860, shipped)).toBeGreaterThan(0.5);
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
      // Within a pixel: WebKit rounds a centred slide's layout differently.
      const ys = [...tops.values()];
      expect(Math.max(...ys) - Math.min(...ys), JSON.stringify(Object.fromEntries(tops))).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("/deck print and PDF", () => {
  test("?view=print saves a PDF with one 16:9 page per slide", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "page.pdf() is Chromium-only");
    // The bento deck's two tour details print as pages of their own after the quarter slide.
    for (const [id, count] of [["moves", 7], ["bento", 7], ["consulting", 8]] as const) {
      await page.goto(`/deck?deck=${id}&view=print`);
      await expect(page.locator(".uipack-deck-print__page")).toHaveCount(count);
      if (id === "bento") {
        await expect(page.locator(".uipack-deck-print__page[data-detail]")).toHaveCount(2);
        await expect(page.locator(".uipack-deck-print__page[data-detail]").first()).toHaveAttribute("aria-label", /detail: Where the 214 ms went/);
      }
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
