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
    for (const [index, id] of [
      ["1", "problem"],
      ["2", "evidence"],
      ["3", "ghost"],
      ["4", "fix"],
    ] as const) {
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
      // And back to reading, where the head's Present starts from the slide being read.
      await page.getByRole("button", { name: "Read", exact: true }).click();
      await page.getByRole("button", { name: "Present from 03", exact: true }).click();
      await expect(deck(page)).toHaveAttribute("data-index", "2");
      expect(await canvas.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(0);
    });
  }

  test.describe("on a phone, Read and Present keep your place", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const deckTop = (page: Page) => deck(page).evaluate((el) => el.getBoundingClientRect().top);

    test("Present from here brings the stage on screen, and Read returns to that slide, focused", async ({ page }) => {
      await page.goto("/deck");
      const fromFive = page.getByRole("button", { name: /Present from slide 5/ });
      await fromFive.scrollIntoViewIfNeeded();
      await fromFive.tap();
      await expect(deck(page)).toHaveAttribute("data-index", "4");
      await expect(deck(page)).toBeFocused();
      // The deck was far above the viewport; it scrolls up so the stage and its controls show.
      await expect.poll(() => deckTop(page)).toBeGreaterThanOrEqual(-1);
      await expect.poll(() => deckTop(page)).toBeLessThan(10);
      await expect(page.locator(".uipack-deck-controls")).toBeInViewport();

      await page.getByRole("button", { name: "Read", exact: true }).tap();
      const back = page.getByRole("button", { name: /Present from slide 5/ });
      await expect(back).toBeFocused();
      await expect(back).toBeInViewport();
      const item = page.locator(".uipack-deck-read > ol > li").nth(4);
      await expect.poll(() => item.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBeLessThanOrEqual(40);
    });

    test("a shared ?slide= link opens Read at that slide, and the head's Present starts from it", async ({ page }) => {
      await page.goto("/deck?slide=fix");
      const item = page.locator(".uipack-deck-read > ol > li").nth(4);
      await expect.poll(() => item.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBeGreaterThanOrEqual(0);
      await expect.poll(() => item.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBeLessThanOrEqual(40);
      // Opening a link moves no focus.
      await expect(page.locator(".uipack-deck-read__present:focus")).toHaveCount(0);
      await page.getByRole("button", { name: "Present from 05", exact: true }).tap();
      await expect(deck(page)).toHaveAttribute("data-index", "4");
      await expect(page.locator(".uipack-deck-controls")).toBeInViewport();
    });
  });

  test("Full screen shows only where the page can go full screen (not on iPhone Safari)", async ({ page }) => {
    await page.goto("/deck?view=present");
    await expect(page.getByRole("button", { name: "Full screen" })).toBeVisible();
    // iPhone Safari: no fullscreenEnabled, no element requestFullscreen, standard or prefixed.
    await page.addInitScript(() => {
      Object.defineProperty(Document.prototype, "fullscreenEnabled", { get: () => undefined, configurable: true });
      for (const name of ["requestFullscreen", "webkitRequestFullscreen"]) {
        Object.defineProperty(Element.prototype, name, { value: undefined, configurable: true });
      }
    });
    await page.reload();
    await expect(page.getByRole("button", { name: "All slides" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Full screen" })).toHaveCount(0);
  });

  test("at 1280×900 the slide and its controls fit the first screen", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/deck");
    // The page fits the deck to the window once its controls have mounted.
    await expect
      .poll(() => page.locator(".uipack-deck-controls").evaluate((el) => el.getBoundingClientRect().bottom))
      .toBeLessThanOrEqual(900);
  });

  test("beside a laptop-sized slide sits only the intro; the reference tables run under the controls", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/deck");
    await expect(page.locator(".deck-showcase")).toHaveAttribute("data-layout", "side");
    const box = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      const tables = Array.from(document.querySelectorAll(".deck-showcase__reference > section"), (el) =>
        el.getBoundingClientRect(),
      );
      return { controls: r(".uipack-deck-controls").bottom, tables: tables.map((t) => ({ top: t.top, left: t.left })) };
    });
    // Two columns, side by side, both under the controls.
    expect(box.tables).toHaveLength(2);
    for (const t of box.tables) expect(t.top).toBeGreaterThan(box.controls);
    expect(box.tables[1].left).toBeGreaterThan(box.tables[0].left);
  });

  // Presenting on a laptop, the slide gets the window: the page scrolls past its header (which stays
  // in the page) and the stage is as tall as the window less one row of controls.
  const presented = (page: Page) =>
    page.evaluate(() => {
      const stage = document.querySelector(".uipack-deck-stage")!.getBoundingClientRect();
      const controls = document.querySelector(".uipack-deck-controls")!.getBoundingClientRect();
      return { top: Math.round(stage.top), height: Math.round(stage.height), bottom: Math.round(controls.bottom) };
    });
  test("?view=present at 1280×720 gives the slide the window, below one row of controls", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/deck?view=present&deck=consulting");
    await expect(page.getByRole("button", { name: "Full screen" })).toBeVisible();
    await expect.poll(async () => (await presented(page)).top).toBe(0);
    const { height, bottom } = await presented(page);
    expect(height).toBeGreaterThanOrEqual(720 - 80);
    expect(bottom).toBeLessThanOrEqual(720);
    await expect(page.locator(".showcase-header")).toHaveCount(1);
  });

  test("Present from the read view at 1280×720 gives the slide the window too", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/deck?view=read&deck=consulting");
    await page.locator(".uipack-deck-read__head button").click();
    await expect.poll(async () => (await presented(page)).top).toBe(0);
    const { height, bottom } = await presented(page);
    expect(height).toBeGreaterThanOrEqual(720 - 80);
    expect(bottom).toBeLessThanOrEqual(720);
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
          const tools = Array.from(document.querySelectorAll(".uipack-deck-controls button")).map((b) =>
            b.getBoundingClientRect(),
          );
          return {
            gap: Math.round(Math.abs(Math.max(...tools.map((t) => t.right)) - stage.right)),
            bottom: Math.max(...tools.map((t) => t.bottom)),
          };
        });
      await expect.poll(async () => (await read()).gap).toBeLessThanOrEqual(1);
      expect((await read()).bottom).toBeLessThanOrEqual(height);
    });
  }

  // WebKit's default Tab skips buttons, so a dialog of buttons that leaves Tab to the browser
  // loses focus to the page: Escape then does nothing and the deck keys stay off. Runs in both engines.
  test("the overview keeps Tab inside, Escape still closes it, the page behind is inert, a backdrop click closes it", async ({
    page,
  }) => {
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

  test("at 1440×900 the speaker view sets the next slide and clock under the slide and gives the notes a screen-tall column", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/deck?deck=bento&presenter=1&slide=quarter&step=1");
    await expect(page.getByRole("heading", { name: "Say at this stop" })).toBeVisible();
    const box = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      return {
        stage: r(".uipack-deck-stage"),
        under: r(".uipack-deck-presenter__under"),
        notes: r(".uipack-deck-presenter__notes"),
        controls: r(".uipack-deck-controls"),
      };
    });
    expect(box.under.top).toBeGreaterThan(box.stage.bottom);
    expect(box.under.bottom).toBeLessThanOrEqual(box.controls.top);
    expect(box.controls.bottom).toBeLessThanOrEqual(900);
    expect(box.notes.left).toBeGreaterThan(box.stage.right);
    // The notes column reaches down past the slide, into the height the band uses.
    expect(box.notes.top).toBeLessThan(box.stage.top + 1);
  });

  test("the speaker view's clocks are named in words: a timer for elapsed time, a labelled budget", async ({ page }) => {
    await page.goto("/deck?presenter=1");
    const clock = page.locator(".uipack-deck-presenter__clock");
    const timer = clock.getByRole("timer");
    await expect(timer).toHaveCount(1);
    await expect(timer).toHaveText(/^Elapsed time \d\d:\d\d$/);
    await expect(clock.locator(".uipack-deck-presenter__budget > span").first()).toHaveText(/^Time budget \/ 08:00$/);
    // No aria-label on a role-less span (axe: aria-prohibited-attr).
    await expect(clock.locator("span[aria-label]:not([role])")).toHaveCount(0);
    // The words are for assistive technology; the clock still reads 00:00 on screen.
    expect(await timer.evaluate((el) => (el as HTMLElement).innerText.trim())).toMatch(/\d\d:\d\d$/);
  });

  test("reduced motion swaps slides with a short fade and no movement", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/deck?slide=ghost&view=present");
    await expect(deck(page)).toHaveAttribute("data-motion", "none");
    await deck(page).focus();
    await page.keyboard.press("ArrowRight");
    const transforms = await page.evaluate(() =>
      document.getAnimations().flatMap((a) =>
        (a.effect as KeyframeEffect)
          .getKeyframes()
          .map((k) => k.transform)
          .filter(Boolean),
      ),
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
        .poll(
          async () => {
            const cell = await page.locator(`[data-bento-cell="${id}"]`).boundingBox();
            return cell!.width > box!.width * 0.4 && Math.abs(cell!.x + cell!.width / 2 - (box!.x + box!.width / 2)) < 4;
          },
          { timeout: 5_000 },
        )
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
const at = <T>(page: Page, ms: number, read: () => T) =>
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
      Number(
        getComputedStyle(document.querySelector('.uipack-deck-layer[data-slide="quarter"] [data-bento-cell="cost"]')!).opacity,
      ),
    );
    expect(later).toBe(0);
  });

  test("a zoom flies into the target: its box stays, with the incoming slide whole inside it, and its edge clears mid-flight", async ({
    page,
  }) => {
    await page.goto("/deck?slide=ghost&view=present");
    await deck(page).focus();
    await settled(page);
    await page.keyboard.press("ArrowRight");
    const early = await at(page, 0.1 * 1150, () => {
      const outer = document.querySelector<HTMLElement>('.uipack-deck-layer[data-slide="ghost"]')!;
      return new DOMMatrix(getComputedStyle(outer).transform).a;
    });
    expect(early).toBeGreaterThan(1.04);
    // At 20% the card is still a card, and the slide it opens into sits whole inside it.
    const at20 = await at(page, 0.2 * 1150, () => {
      const box = document.querySelector<HTMLElement>('.uipack-deck-layer[data-slide="ghost"] [data-morph="flagged"]')!;
      const inner = document.querySelector<HTMLElement>('.uipack-deck-layer[data-slide="fix"]')!;
      const b = box.getBoundingClientRect();
      const i = inner.getBoundingClientRect();
      const cs = getComputedStyle(box);
      return {
        bg: cs.backgroundColor,
        border: cs.borderTopColor,
        inside: i.left >= b.left && i.right <= b.right && i.top >= b.top && i.bottom <= b.bottom,
        aspect: i.width / i.height,
        opacity: Number(getComputedStyle(inner).opacity),
      };
    });
    expect(at20.bg).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(at20.border).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(at20.inside).toBe(true);
    expect(at20.aspect).toBeCloseTo(16 / 9, 1);
    expect(at20.opacity).toBeGreaterThan(0.9);
    // Its edge (border, ring) is gone by three quarters, so no thick scaled-up bars sweep the screen.
    const late = await at(page, 0.75 * 1150, () => {
      const cs = getComputedStyle(
        document.querySelector<HTMLElement>('.uipack-deck-layer[data-slide="ghost"] [data-morph="flagged"]')!,
      );
      return { border: cs.borderTopColor, shadow: cs.boxShadow };
    });
    expect(late.border).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(late.shadow).toBe("none");
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
        const eyebrow = (id: string) =>
          Number(
            getComputedStyle(document.querySelector(`.uipack-deck-layer[data-slide="${id}"] .uipack-deck-eyebrow`)!).opacity,
          );
        return { out: eyebrow("problem"), in: eyebrow("evidence") };
      });
      expect(Math.min(o.out, o.in), `both eyebrows showing at ${f}`).toBeLessThan(0.15);
    }
  });

  test("bento camera: no words cut by the edge mid-move, details hand over line by line, faces back early on the pull-back", async ({
    page,
  }) => {
    const shipped = () =>
      Number(getComputedStyle(document.querySelector('[data-bento-cell="shipped"] .uipack-deck-bento__detail')!).opacity);
    const shippedFace = () =>
      Number(getComputedStyle(document.querySelector('[data-bento-cell="shipped"] .uipack-deck-bento__face')!).opacity);
    // Every visible line of words (a face's children, a detail's lines and list rows): how many show,
    // and how many of those the bento's edge cuts. Opacity multiplies down the tree.
    const words = () => {
      const bento = document.querySelector(".uipack-deck-layer:not([aria-hidden]) .uipack-deck-bento")!;
      const box = bento.getBoundingClientRect();
      const seen = (el: Element) => {
        let o = 1;
        for (let n: Element | null = el; n && n !== bento; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      };
      const lines = Array.from(
        bento.querySelectorAll(
          ".uipack-deck-bento__face > *, .uipack-deck-bento__detail > :not(ul), .uipack-deck-bento__detail > ul > li",
        ),
      ).filter((el) => seen(el) > 0.05);
      const cut = lines.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < box.left - 1 || r.top < box.top - 1 || r.right > box.right + 1 || r.bottom > box.bottom + 1;
      });
      return { shown: lines.length, cut: cut.length };
    };
    // Cell to cell, latency → shipped.
    await page.goto("/deck?deck=bento&slide=quarter&step=1&view=present");
    await deck(page).focus();
    await settled(page);
    await page.keyboard.press("ArrowRight");
    for (const f of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
      const { cut, shown } = await at(page, f * 860, words);
      expect(cut, `words cut off by the bento's edge at ${f}`).toBe(0);
      expect(shown, `words on screen at ${f}`).toBeGreaterThan(0);
    }
    expect(await at(page, 0.95 * 860, shipped)).toBeGreaterThan(0.9);
    // The pull-back: the cell being left has its face back by 45%, and nothing is cut at any point.
    await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
    await page.keyboard.press("ArrowRight");
    for (const f of [0.1, 0.2, 0.3, 0.45, 0.6, 0.8]) {
      const { cut } = await at(page, f * 860, words);
      expect(cut, `words cut off by the bento's edge at ${f}`).toBe(0);
      if (f === 0.45) expect(await at(page, f * 860, shippedFace), "the face back mid pull-back").toBeGreaterThan(0.5);
    }
  });

  test("bento tour stops show no cell cut off by the bento's edge, live or in a printed still", async ({ page }) => {
    const slivers = () => {
      const bento = document.querySelector(".uipack-deck-layer:not([aria-hidden]) .uipack-deck-bento")!;
      const box = bento.getBoundingClientRect();
      return Array.from(bento.querySelectorAll<HTMLElement>("[data-bento-cell]")).filter((cell) => {
        const r = cell.getBoundingClientRect();
        const out = r.left < box.left - 1 || r.top < box.top - 1 || r.right > box.right + 1 || r.bottom > box.bottom + 1;
        return out && Number(getComputedStyle(cell).opacity) > 0.01 && r.right > box.left && r.left < box.right;
      }).length;
    };
    for (const step of [1, 2]) {
      await page.goto(`/deck?deck=bento&slide=quarter&step=${step}&view=present`);
      await settled(page);
      await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
      expect(await page.evaluate(slivers), `cells cut off at stop ${step}`).toBe(0);
    }
    // The printed detail page for the first stop.
    await page.goto("/deck?deck=bento&view=print");
    const still = page.locator('.uipack-deck-print [data-focus="latency"]').first();
    await expect(still).toBeAttached();
    const cut = await still.evaluate((bento) => {
      const box = bento.getBoundingClientRect();
      return Array.from(bento.querySelectorAll<HTMLElement>("[data-bento-cell]")).filter((cell) => {
        const r = cell.getBoundingClientRect();
        const out = r.left < box.left - 1 || r.top < box.top - 1 || r.right > box.right + 1 || r.bottom > box.bottom + 1;
        return out && Number(getComputedStyle(cell).opacity) > 0.01 && r.right > box.left && r.left < box.right;
      }).length;
    });
    expect(cut).toBe(0);
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
    for (const [id, count] of [
      ["moves", 7],
      ["bento", 7],
      ["consulting", 8],
    ] as const) {
      await page.goto(`/deck?deck=${id}&view=print`);
      await expect(page.locator(".uipack-deck-print__page")).toHaveCount(count);
      if (id === "bento") {
        await expect(page.locator(".uipack-deck-print__page[data-detail]")).toHaveCount(2);
        await expect(page.locator(".uipack-deck-print__page[data-detail]").first()).toHaveAttribute(
          "aria-label",
          /detail: Where the 214 ms went/,
        );
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
