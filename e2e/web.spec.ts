import { expect, test, type Page } from "@playwright/test";

const demo = (page: Page) => page.locator(".uipack-web-demo");
/** Pixels between the sticky nav's bottom edge and the first line (eyebrow) of a section. */
const gapBelowNav = (page: Page, section: string) =>
  page.evaluate((sel) => {
    const nav = document.querySelector(".uipack-web-nav")!.getBoundingClientRect().bottom;
    const first = document.querySelector(`${sel} .uipack-web-eyebrow`)!.getBoundingClientRect().top;
    return Math.round(first - nav);
  }, section);
const stepOf = async (page: Page) => Number(await demo(page).getAttribute("data-step"));

test.describe("/web Landing collection", () => {
  test("DemoPlayer advances in view, holds after Pause, and Replay restarts", async ({ page }) => {
    await page.goto("/web");
    await demo(page).scrollIntoViewIfNeeded();
    await expect(demo(page)).toHaveAttribute("data-state", "playing");
    await expect.poll(() => stepOf(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
    await expect.poll(() => page.getByTestId("demo-metric").textContent(), { timeout: 10_000 }).not.toBe("40");
    await demo(page).getByRole("button", { name: "Pause" }).click();
    await expect(demo(page)).toHaveAttribute("data-state", "paused");
    const held = await page.getByTestId("demo-metric").textContent();
    const heldStep = await stepOf(page);
    await page.waitForTimeout(1500);
    expect(await page.getByTestId("demo-metric").textContent()).toBe(held);
    expect(await stepOf(page)).toBe(heldStep);
    await demo(page).getByRole("button", { name: "Replay" }).click();
    expect(await stepOf(page)).toBe(0);
    await expect(page.getByTestId("demo-metric")).toHaveText("40");
    await expect(demo(page)).toHaveAttribute("data-state", "playing");
  });

  test("DemoPlayer settles on the result and step tabs work from the keyboard", async ({ page }) => {
    await page.goto("/web");
    const tab = demo(page).getByRole("button", { name: /03 Review/ });
    await tab.focus();
    await page.keyboard.press("Enter");
    await expect(tab).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("demo-metric")).toHaveText("3", { timeout: 5_000 });
    await expect(demo(page).getByText("Q3 budget sign-off")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(demo(page).getByRole("button", { name: /02 Act/ })).toBeFocused();
    expect(await stepOf(page)).toBe(1);
  });

  test("reduced motion shows the final state with every step listed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/web");
    await expect(demo(page)).toHaveAttribute("data-state", "static");
    await expect(page.getByTestId("demo-metric")).toHaveText("3");
    await expect(demo(page).getByRole("list", { name: "Demo steps" }).locator(":scope > li")).toHaveCount(3);
    await expect(demo(page).getByRole("button", { name: /Pause|Replay/ })).toHaveCount(0);
    await expect(demo(page).getByRole("link", { name: "Try it yourself" })).toBeVisible();
    // Reveal text is readable without scrolling it into view.
    const quote = page.locator(".web-quote__text");
    await expect(quote).toHaveAttribute("data-state", "static");
    expect(await quote.locator(".uipack-web-reveal__unit").first().evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });

  test("spotlight follows the mouse and keyboard focus shows it too", async ({ page, browserName }) => {
    // Safari moves Tab focus through links only with Option held.
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
    await page.goto("/web");
    const card = page.locator("#web-how .uipack-web-spotlight").first();
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + 30);
    await expect.poll(() => card.evaluate((el) => el.style.getPropertyValue("--spot-x"))).toBe("40px");
    const on = () => card.evaluate((el) => getComputedStyle(el).getPropertyValue("--spot-on").trim());
    expect(await on()).toBe("1");
    await page.mouse.move(0, 0);
    // A spotlight whose link has keyboard focus lights without the pointer.
    const flashy = page.locator(".web-panel .uipack-web-spotlight").first();
    await flashy.getByRole("link").focus();
    await page.keyboard.press(`Shift+${tab}`);
    await page.keyboard.press(tab);
    await expect(flashy.getByRole("link")).toBeFocused();
    expect(await flashy.evaluate((el) => getComputedStyle(el).getPropertyValue("--spot-on").trim())).toBe("1");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`${theme}: no console errors and no page overflow at 390px`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/web?theme=${theme}`);
      await expect(page.locator(".uipack-web").first()).toHaveAttribute("data-theme", theme);
      await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Web · Web UI");
      await expect(page.locator(".showcase-context a")).toHaveText("Landing style");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      // Menu folds on narrow widths and opens from the keyboard.
      const menu = page.getByRole("button", { name: "Menu" });
      await menu.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Pricing" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
      for (const b of await page.locator(".uipack-web-demo button, .uipack-web-cta, .uipack-web-nav__toggle").all()) {
        if (!(await b.isVisible())) continue;
        const box = (await b.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/web?theme=${theme}`);
      await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
      expect(errors).toEqual([]);
    });
  }

  test("Styles index lists Landing and links to Web UI", async ({ page }) => {
    await page.goto("/styles");
    const card = page.locator(".style-card", { hasText: "Landing" });
    await card.getByRole("link", { name: "Web UI building blocks" }).click();
    await expect(page).toHaveURL(/\/web\?theme=light/);
  });

  test("motion: ticker counts in view, reveal shows, marquee moves and pauses", async ({ page }) => {
    await page.goto("/web");
    const ticker = page.locator("#web-proof .uipack-web-ticker").first();
    await expect(ticker.getByTestId("ticker-live")).toHaveText("0");
    await ticker.scrollIntoViewIfNeeded();
    await expect(ticker.getByTestId("ticker-live")).toHaveText("37", { timeout: 5_000 });
    const reveal = page.locator(".web-reveal-list");
    await reveal.scrollIntoViewIfNeeded();
    await expect(reveal).toHaveAttribute("data-state", "shown");
    await expect.poll(() => reveal.locator("> *").last().evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    const marquee = page.locator(".uipack-web-marquee");
    await marquee.scrollIntoViewIfNeeded();
    const track = marquee.locator(".uipack-web-marquee__track");
    const x = () => track.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    const a = await x();
    await page.waitForTimeout(400);
    expect(await x()).not.toBe(a);
    await marquee.getByRole("button", { name: "Pause" }).click();
    await page.waitForTimeout(100);
    const held = await x();
    await page.waitForTimeout(400);
    expect(await x()).toBe(held);
    await marquee.getByRole("button", { name: "Play" }).click();
    // Move focus off the toggle (focus-within also pauses) without scrolling: clicking the body
    // at (1, 1) scrolled the page to the top, so the marquee paused off screen by a race.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(1, 1);
    await page.waitForTimeout(300);
    expect(await x()).not.toBe(held);
    // Hover the still viewport: the moving track itself never counts as "stable" for hover().
    await marquee.locator(".uipack-web-marquee__viewport").hover();
    await page.waitForTimeout(100);
    const hovered = await x();
    await page.waitForTimeout(400);
    expect(await x()).toBe(hovered);
  });

  test("backgrounds: moving layers pause off screen and run in view", async ({ page }) => {
    await page.goto("/web");
    const aurora = page.locator(".uipack-web-aurora");
    await expect(aurora).toHaveAttribute("data-paused", "true");
    await aurora.scrollIntoViewIfNeeded();
    await expect(aurora).not.toHaveAttribute("data-paused", "true");
    const beam = page.locator(".uipack-web-beams i").first();
    const pos = () => beam.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    const a = await pos();
    await page.waitForTimeout(300);
    expect(await pos()).not.toBe(a);
    // The dot grid lights under the mouse.
    const tile = page.locator(".web-bg-tile").nth(1);
    const box = (await tile.boundingBox())!;
    await page.mouse.move(box.x + 60, box.y + 60);
    await expect(tile.locator(".uipack-web-gridbg")).toHaveAttribute("data-lit", "true");
  });

  test("motion and backgrounds hold still under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/web");
    await expect(page.locator(".uipack-web-marquee")).toHaveAttribute("data-static", "true");
    await expect(page.locator(".uipack-web-marquee__list")).toHaveCount(1);
    await expect(page.locator(".uipack-web-marquee").getByRole("button")).toHaveCount(0);
    await expect(page.locator("#web-proof").getByTestId("ticker-live").first()).toHaveText("37");
    await expect(page.locator(".uipack-web-scramble .uipack-web-scramble__live").first()).toHaveText("Forty in. Three left.");
    expect(await page.locator(".uipack-web-beams i").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    expect(await page.locator(".uipack-web-aurora i").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    await expect(page.locator(".web-reveal-list")).toHaveAttribute("data-state", "static");
    expect(await page.locator(".uipack-web-gutters__drift").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    // The paint transition swaps the theme instantly and leaves no stylesheet behind.
    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");
    await page.getByRole("button", { name: /^Pour (dark|light) theme$/ }).click();
    await expect(html).not.toHaveAttribute("data-theme", before ?? "light");
    await expect(page.locator("style[data-uipack-paint]")).toHaveCount(0);
  });

  test("type: three self-hosted faces, display headings, no external requests or console errors", async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const external: string[] = [];
    const fonts: string[] = [];
    const errors: string[] = [];
    page.on("request", (r) => {
      if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== origin) external.push(r.url());
      if (r.resourceType() === "font") fonts.push(r.url());
    });
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/web");
    await page.evaluate(() => document.fonts.ready);
    const loaded = () =>
      page.evaluate(() => {
        const out: string[] = [];
        document.fonts.forEach((f) => f.status === "loaded" && out.push(`${f.family.replace(/"/g, "")} ${f.weight} ${f.style}`));
        return out;
      });
    await expect
      .poll(loaded)
      .toEqual(
        expect.arrayContaining(["Instrument Serif 400 normal", "Instrument Serif 400 italic", "IBM Plex Sans 400 normal", "IBM Plex Sans 600 normal", "IBM Plex Mono 600 normal"]),
      );
    // Every font comes from the package's own fonts folder, as woff2.
    expect(fonts.length).toBeGreaterThanOrEqual(5);
    // (The specimen toggle's alternates come from @fontsource in the playground only.)
    for (const url of fonts.filter((u) => !u.includes("/@fontsource/"))) expect(url).toMatch(/\/web\/fonts\/[a-z0-9-]+\.woff2$/);
    expect(external).toEqual([]);
    const family = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).fontFamily.split(",")[0].replace(/"/g, "").trim());
    const weight = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).fontWeight);
    expect(await family(".uipack-web-hero h1")).toBe("Instrument Serif");
    expect(await weight(".uipack-web-hero h1")).toBe("400");
    expect(await family("#web-how h2")).toBe("Instrument Serif");
    expect(await family("#web-proof .uipack-web-ticker")).toBe("Instrument Serif");
    expect(await family("[data-testid=demo-metric]")).toBe("Instrument Serif");
    expect(await family("#web-how h3")).toBe("IBM Plex Sans");
    expect(await weight("#web-how h3")).toBe("600");
    expect(await family(".uipack-web-hero .uipack-web-subhead")).toBe("IBM Plex Sans");
    expect(await family(".uipack-web-hero .uipack-web-cta")).toBe("IBM Plex Sans");
    expect(await family(".uipack-web-nav__links a")).toBe("IBM Plex Sans");
    expect(await family(".uipack-web-hero .uipack-web-eyebrow")).toBe("IBM Plex Mono");
    expect(await family(".uipack-web-demo__address")).toBe("IBM Plex Mono");
    // The specimen's toggle previews another display face on every Landing surface, then returns.
    await page.getByRole("radio", { name: "Space Grotesk" }).check();
    await expect.poll(() => family(".uipack-web-hero h1")).toBe("Space Grotesk");
    expect(await weight(".uipack-web-hero h1")).toBe("500");
    await page.getByRole("radio", { name: "Instrument Serif" }).check();
    await expect.poll(() => family(".uipack-web-hero h1")).toBe("Instrument Serif");
    expect(errors).toEqual([]);
  });

  test("SmoothScroll eases a wheel over many frames and lands on its target", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/web");
    await expect(page.locator("html")).toHaveAttribute("data-uipack-smooth-scroll", "");
    await page.mouse.move(640, 200);
    const start = await page.evaluate(() => window.scrollY);
    const samples = page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const seen: number[] = [];
          const t0 = performance.now();
          const frame = () => {
            seen.push(window.scrollY);
            if (performance.now() - t0 < 2200) requestAnimationFrame(frame);
            else resolve(seen);
          };
          requestAnimationFrame(frame);
        }),
    );
    await page.mouse.wheel(0, 500);
    const ys = await samples;
    const moving = [...new Set(ys)].filter((y) => y > start && y < start + 499);
    // At least a handful of in-between frames (fewer when the machine is loaded), never one jump.
    expect(moving.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1]);
    expect(Math.abs(ys[ys.length - 1] - (start + 500))).toBeLessThanOrEqual(1);
    // Zoom gestures (Ctrl + wheel) are never taken over.
    const prevented = await page.evaluate(() => {
      const e = new WheelEvent("wheel", { deltaY: 100, ctrlKey: true, bubbles: true, cancelable: true });
      document.body.dispatchEvent(e);
      return e.defaultPrevented;
    });
    expect(prevented).toBe(false);
  });

  test("anchor links ease to their section and land below the sticky nav", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/web");
    const nav = page.locator(".uipack-web-nav");
    const before = await page.evaluate(() => window.scrollY);
    // Record the scroll position every frame from before the click until it settles.
    await page.evaluate(() => {
      const w = window as unknown as { __ys: number[] };
      w.__ys = [];
      const t0 = performance.now();
      const frame = () => {
        w.__ys.push(window.scrollY);
        if (performance.now() - t0 < 2500) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await nav.getByRole("link", { name: "Proof" }).click();
    await expect(page).toHaveURL(/#web-proof$/);
    await expect.poll(() => gapBelowNav(page, "#web-proof"), { timeout: 4_000 }).toBeLessThan(80);
    await page.waitForTimeout(400);
    const final = await page.evaluate(() => window.scrollY);
    // Gradual: many distinct positions on the way, never past the target.
    const ys = await page.evaluate(() => (window as unknown as { __ys: number[] }).__ys);
    expect(new Set(ys.filter((y) => y > before + 1 && y < final - 1)).size).toBeGreaterThanOrEqual(4);
    expect(Math.max(...ys)).toBeLessThanOrEqual(final + 1);
    // The section's first line sits just below the nav: its top padding tucks under the glass.
    const gap = await gapBelowNav(page, "#web-proof");
    expect(gap).toBeGreaterThanOrEqual(16);
    expect(gap).toBeLessThanOrEqual(56);
    await expect(page.locator("#web-proof")).toBeFocused();
    // The page index works the same way.
    await page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Type" }).click();
    // Its scroll-margin-top is 24px; allow a pixel of device rounding.
    await expect
      .poll(() => page.locator("#web-type").evaluate((el) => Math.abs(el.getBoundingClientRect().top - 24)), { timeout: 4_000 })
      .toBeLessThanOrEqual(1.5);
  });

  test("reduced motion keeps native scrolling", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/web");
    await expect(page.locator(".uipack-web").first()).toBeVisible();
    expect(await page.locator("html").getAttribute("data-uipack-smooth-scroll")).toBeNull();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    const prevented = await page.evaluate(() => {
      const e = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true });
      document.body.dispatchEvent(e);
      return e.defaultPrevented;
    });
    expect(prevented).toBe(false);
    // Anchors jump at once (no easing frames), still clear the nav, update the hash and move focus.
    await page.locator(".uipack-web-nav").getByRole("link", { name: "Pricing" }).click();
    const gap = await gapBelowNav(page, "#web-pricing");
    expect(gap).toBeGreaterThanOrEqual(16);
    expect(gap).toBeLessThanOrEqual(56);
    await expect(page).toHaveURL(/#web-pricing$/);
    await expect(page.locator("#web-pricing")).toBeFocused();
  });

  test("nav Pricing glides to the pricing section, below the nav, with focus and hash", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/web");
    const nav = page.locator(".uipack-web-nav");
    // Every nav link is a real in-page anchor with a real target.
    for (const link of await nav.locator(".uipack-web-nav__links a").all()) {
      const href = (await link.getAttribute("href"))!;
      expect(href).toMatch(/^#web-/);
      await expect(page.locator(href)).toHaveCount(1);
    }
    await page.evaluate(() => {
      const w = window as unknown as { __ys: number[] };
      w.__ys = [];
      const t0 = performance.now();
      const frame = () => {
        w.__ys.push(window.scrollY);
        if (performance.now() - t0 < 2500) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    const before = await page.evaluate(() => window.scrollY);
    await nav.getByRole("link", { name: "Pricing" }).click();
    await expect(page).toHaveURL(/#web-pricing$/);
    const heading = page.locator("#web-pricing-title");
    await expect.poll(() => gapBelowNav(page, "#web-pricing"), { timeout: 4_000 }).toBeLessThan(80);
    await page.waitForTimeout(1500);
    const final = await page.evaluate(() => window.scrollY);
    const ys = await page.evaluate(() => (window as unknown as { __ys: number[] }).__ys);
    // Not one jump: the position rises through many frames and never overshoots.
    expect(new Set(ys.filter((y) => y > before + 1 && y < final - 1)).size).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1]);
    expect(Math.max(...ys)).toBeLessThanOrEqual(final + 1);
    // The Pricing eyebrow and heading end up just below the 65px sticky nav, fully visible.
    const gap = await gapBelowNav(page, "#web-pricing");
    expect(gap).toBeGreaterThanOrEqual(16);
    expect(gap).toBeLessThanOrEqual(56);
    const navBottom = await nav.evaluate((el) => el.getBoundingClientRect().bottom);
    const headingBox = (await heading.boundingBox())!;
    expect(headingBox.y).toBeGreaterThan(navBottom);
    expect(headingBox.y - navBottom).toBeLessThan(120);
    expect(headingBox.y + headingBox.height).toBeLessThan(800);
    await expect(page.locator("#web-pricing")).toBeFocused();
  });

  test.describe("touch", () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
    test("touch devices keep native scrolling with CSS smooth anchors", async ({ page }) => {
      await page.goto("/web");
      await expect(page.locator(".uipack-web").first()).toBeVisible();
      const fine = await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches);
      test.skip(fine, "this browser still reports a fine pointer with touch emulation");
      expect(await page.locator("html").getAttribute("data-uipack-smooth-scroll")).toBeNull();
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("smooth");
      const prevented = await page.evaluate(() => {
        const e = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true });
        document.body.dispatchEvent(e);
        return e.defaultPrevented;
      });
      expect(prevented).toBe(false);
    });
  });

  test("drifting gutters flank the column and drift; paint transition pours and cleans up", async ({ page, browserName }) => {
    await page.goto("/web");
    const stage = page.locator('[data-bg-tile="gutters"]');
    await stage.scrollIntoViewIfNeeded();
    const gutters = stage.locator(".uipack-web-gutters");
    await expect(gutters).toHaveAttribute("aria-hidden", "true");
    // The wrapper has no box of its own (its sides are fixed); check its display and the sides.
    expect(await gutters.evaluate((el) => getComputedStyle(el).display)).toBe("block");
    await expect(stage.locator('[data-side="left"]')).toBeVisible();
    const stageBox = (await stage.boundingBox())!;
    const left = (await stage.locator('[data-side="left"]').boundingBox())!;
    const right = (await stage.locator('[data-side="right"]').boundingBox())!;
    expect(Math.abs(left.x - stageBox.x)).toBeLessThan(2);
    expect(Math.abs(right.x + right.width - (stageBox.x + stageBox.width))).toBeLessThan(2);
    expect(left.width).toBeGreaterThan(stageBox.width * 0.2);
    expect(await gutters.evaluate((el) => getComputedStyle(el.firstElementChild!.nextElementSibling!).pointerEvents)).toBe("none");
    const drift = stage.locator(".uipack-web-gutters__drift").first();
    const y = () => drift.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
    const a = await y();
    await page.waitForTimeout(400);
    expect(await y()).toBeLessThan(a);

    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");
    const button = page.getByRole("button", { name: /^Pour (dark|light) theme$/ });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(html).not.toHaveAttribute("data-theme", before ?? "light");
    const supported = await page.evaluate(() => "startViewTransition" in document);
    test.skip(!supported, `${browserName} has no View Transitions; the instant fallback is covered above`);
    await expect(page.locator("style[data-uipack-paint]")).toHaveCount(1);
    await expect(html).toHaveClass(/theme-switching/);
    await expect(page.locator("style[data-uipack-paint]")).toHaveCount(0, { timeout: 5_000 });
    await expect(html).not.toHaveClass(/theme-switching/);
  });
});

test.describe("/web discoverability", () => {
  test("one h1, canonical and Open Graph tags, valid JSON-LD for the product and FAQ, visible FAQ text, no console errors", async ({ page, baseURL }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    const origin = new URL(baseURL!).origin;
    await page.goto("/web?theme=dark");
    await expect(page.locator(".uipack-web-hero h1")).toBeVisible();
    expect(await page.locator("h1").count()).toBe(1);
    // The canonical drops the theme parameter: one URL per page, whatever the view state.
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute("href", `${origin}/web`);
    await expect(page).toHaveTitle("Tidy: forty emails in, three that need you");
    // The playground is an illustrative demo: its index.html keeps it out of search indexes.
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", "noindex");
    const meta = (sel: string) => page.locator(`head meta[${sel}]`).getAttribute("content");
    expect(await meta('name="description"')).toMatch(/^Tidy, an illustrative inbox agent/);
    expect(await meta('property="og:title"')).toBe("Tidy: forty emails in, three that need you");
    expect(await meta('property="og:url"')).toBe(`${origin}/web`);
    expect(await meta('property="og:type"')).toBe("website");
    expect(await meta('name="twitter:card"')).toBe("summary");

    const blocks = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((el) => el.textContent ?? ""));
    const docs = blocks.map((b) => JSON.parse(b));
    const nodes = docs.flatMap((d) => (d["@graph"] ? d["@graph"] : [d]));
    expect(nodes.map((n) => n["@type"])).toEqual(expect.arrayContaining(["Organization", "WebSite", "WebApplication", "FAQPage"]));
    const app = nodes.find((n) => n["@type"] === "WebApplication");
    expect(app.offers).toMatchObject({ "@type": "Offer", price: "8.00", priceCurrency: "USD" });
    expect(app.url).toBe(`${origin}/web`);
    // The offer says what the Pricing section shows.
    await expect(page.locator("#web-pricing h2")).toContainText("$8 a month");

    // Every FAQ question in the markup is a visible h3 on the page, with its answer as visible text.
    const faq = nodes.find((n) => n["@type"] === "FAQPage");
    expect(faq.mainEntity).toHaveLength(4);
    const section = page.locator("#web-faq");
    await section.scrollIntoViewIfNeeded();
    for (const q of faq.mainEntity) {
      await expect(section.getByRole("heading", { level: 3, name: q.name })).toBeVisible();
      await expect(section.getByText(q.acceptedAnswer.text)).toBeVisible();
    }

    // The generated crawl files are on the page.
    await page.getByText("View generated robots.txt / sitemap.xml / llms.txt").click();
    const robots = page.locator('pre[aria-label="robots.txt"]');
    await expect(robots).toContainText("User-agent: GPTBot");
    await expect(robots).toContainText("User-agent: OAI-SearchBot");
    await expect(robots).toContainText(`Sitemap: ${origin}/sitemap.xml`);
    await expect(page.locator('pre[aria-label="sitemap.xml"]')).toContainText(`<loc>${origin}/web</loc>`);
    await expect(page.locator('pre[aria-label="llms.txt"]')).toContainText("# Tidy (UIPACK Landing demo)");
    expect(errors).toEqual([]);
  });

  test("animated text is real text: demo transcript, final ticker values and the quote are in the DOM", async ({ page }) => {
    await page.goto("/web");
    const transcript = page.locator(".uipack-web-demo").getByRole("list", { name: "Demo transcript" });
    await expect(transcript.locator(":scope > li")).toHaveCount(3);
    await expect(transcript).toContainText("Drafted replies for review");
    await expect(page.locator(".uipack-web-demo")).toContainText("Result: 3 in your inbox.");
    // Off-screen tickers wait at 0, but the final value is the accessible text.
    await expect(page.locator("#web-proof .uipack-web-ticker .uipack-web-scramble__ghost").first()).toHaveText("37");
    await expect(page.locator(".web-quote__text")).toHaveText("I stopped opening my inbox before coffee. It leaves me three things, and they are the right three.");
  });

  test("390px: FAQ and the generated-file disclosures fit without page overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/web");
    await page.getByText("View generated robots.txt / sitemap.xml / llms.txt").click();
    await page.getByText("View generated head tags and JSON-LD").click();
    await page.locator("#web-faq").scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const box = (await page.locator('pre[aria-label="robots.txt"]').boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});
