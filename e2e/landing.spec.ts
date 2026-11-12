import { readFileSync } from "node:fs";
import { pageDefs } from "../playground/catalog";
import { GALLERY_PATH } from "../playground/gallery-index";
import { expect, test, type Page } from "./fixtures";

// The landing page (/, playground/LandingShowcase.tsx): it renders whole at a desktop and a phone
// width in both themes without a console error or page-wide overflow, its install line copies the
// current release's command, every link it draws opens a page the site has, and its 3D tile mounts
// only on screen and falls back to a still image without WebGL. Tier 1 runs on it in tier1.spec.ts;
// the built site's CSP is checked by `npm run check:site`, which loads every route in both themes.

/** The install line the docs print (README.md's generated block). */
const installLine = /<!-- generated:install -->\s*```sh\n(.+)\n```/.exec(readFileSync("README.md", "utf8"))![1];
const paths = new Set([...pageDefs.map((p) => p.path), GALLERY_PATH]);

/** Errors the page logs: console errors, uncaught exceptions, CSP reports. */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

/** Scrolls down the page in steps so every lazy section mounts, then back to the top. */
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => scrollTo(0, top), y);
    await page.waitForTimeout(60); // lets the IntersectionObservers fire at each stop
  }
  await page.evaluate(() => scrollTo(0, 0));
}

/** Brings each lazy part into view and waits for it: the layer stack and the parts' previews. */
async function mountLazyParts(page: Page) {
  const wait = { timeout: 15_000 };
  await page.locator("#built").scrollIntoViewIfNeeded();
  await expect(page.locator("#built .uipack-stack a")).toHaveCount(6, wait);
  for (const [tile, part] of [
    ["diagrams", ".uipack svg"],
    ["deck", ".uipack-deck"],
    ["charts", ".uipack-span"],
    ["article", ".landing-article"],
  ]) {
    const box = page.locator(`.landing-tile--${tile}`);
    await box.scrollIntoViewIfNeeded();
    await expect(box.locator(part).first()).toBeAttached(wait);
  }
  await page.evaluate(() => scrollTo(0, 0));
}

/** Turns WebGL off in the page, as a browser without it would report. */
const withoutWebGL = (page: Page) =>
  page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return (original as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof original;
  });

for (const width of [1440, 390])
  for (const theme of ["light", "dark"] as const)
    test(`renders whole at ${width} in ${theme}, without errors or overflow`, async ({ page }) => {
      test.setTimeout(60_000);
      const errors = collectErrors(page);
      // The 3D tile's live scene is covered by objects.spec.ts; here it takes its still, so this
      // spec needs no GPU.
      await withoutWebGL(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/?theme=${theme}`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("The design manager for every site that installs it.");
      await expect(page).toHaveTitle(/^UiPack, the design manager/);
      // The hero's figure is a live uipack figure, with the drawing authored for the width.
      const figure = page.locator(".landing-hero__figure .uipack");
      await expect(figure).toBeVisible();
      await expect(figure.locator(width < 720 ? "svg.uipack--narrow" : "svg.uipack--wide")).toBeVisible();
      await scrollThrough(page);
      // Every section rendered, with its live parts mounted.
      for (const id of ["jobs", "built", "parts", "agents", "site-map"]) await expect(page.locator(`#${id}`)).toBeVisible();
      await mountLazyParts(page);
      // Exactly one filled primary action in the hero; the gallery is the secondary.
      await expect(page.locator(".landing-hero .landing-btn--primary")).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      // The hero figure text stays at the 11px floor at every width (the phone drawing included).
      const smallest = await figure.evaluate((el) => {
        const svg = [...el.querySelectorAll<SVGSVGElement>(".uipack__canvas > svg")].find(
          (s) => s.getBoundingClientRect().width > 0,
        )!;
        return Math.min(
          ...[...svg.querySelectorAll("text")].filter((t) => t.textContent?.trim()).map((t) => t.getBoundingClientRect().height),
        );
      });
      expect(smallest).toBeGreaterThanOrEqual(11);
      expect(errors).toEqual([]);
    });

test("the copy button copies the current release's install command", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium's");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?theme=light");
  await expect(page.locator(".landing-install__cmd")).toHaveText(installLine);
  const copy = page.locator(".landing-install__copy");
  await expect(copy).toHaveAccessibleName("Copy the install command");
  await copy.click();
  await expect(copy).toHaveAttribute("data-state", "copied");
  await expect(copy).toHaveAccessibleName("Copied the install command");
  await expect(page.getByRole("status").filter({ hasText: "Install command copied" })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(installLine);
});

test("every link on the page opens a page the site has", async ({ page }) => {
  test.setTimeout(90_000);
  await withoutWebGL(page);
  await page.goto("/?theme=dark");
  await mountLazyParts(page);
  const hrefs = await page
    .locator(".uipack-landing a[href]")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")!).filter((h) => h.startsWith("/")));
  const internal = [...new Set(hrefs)];
  // The job cards, the layer bands, the tiles, the buttons and the site map, all to known routes
  // (or files the site serves), each carrying the theme.
  for (const href of internal) {
    const url = new URL(href, "http://x");
    if (/\.(md|txt)$/.test(url.pathname)) continue;
    expect(paths, href).toContain(url.pathname);
    expect(url.searchParams.get("theme"), href).toBe("dark");
  }
  expect(internal.length).toBeGreaterThan(40);
  // The served files: llms.txt and the Markdown the band names.
  for (const file of ["/llms.txt", "/docs/agents/README.md"]) expect((await page.request.get(file)).ok(), file).toBe(true);
  // Each job card opens its page.
  const cards = page.locator(".landing-job");
  await expect(cards).toHaveCount(6);
  const first = await cards.first().getAttribute("href");
  await cards.first().click();
  await expect(page).toHaveURL(new RegExp(`${first!.replace(/[?]/g, "\\?")}$`));
  await expect(page.locator("main h1")).toBeVisible();
});

test("the old home page keeps its own address, linked from the landing page and first in the docs", async ({ page }) => {
  await page.goto("/?theme=light");
  const docs = page.locator(".landing-hero").getByRole("link", { name: /Read the docs/ });
  await expect(docs).toHaveAttribute("href", "/what-uipack-is?theme=light");
  await expect(page.locator(".showcase-tabs").getByRole("link", { name: "Docs" })).toHaveAttribute(
    "href",
    "/what-uipack-is?theme=light",
  );
  await docs.click();
  await expect(page.locator("main h1")).toHaveAccessibleName("What UiPack is");
  await expect(page.getByRole("link", { name: "View as Markdown" })).toHaveAttribute("href", "/docs/README.md");
});

test("the 3D tile mounts only once it is on screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  const scene = page.locator(".landing-scene");
  await expect(scene).toHaveAttribute("data-scene", /waiting|still/);
  // Below the fold, nothing of the scene has loaded: no player, no canvas.
  await expect(scene.locator(".uipack-object-scene, canvas")).toHaveCount(0);
});

test("without WebGL, the 3D tile shows a still of the scene", async ({ page }) => {
  await withoutWebGL(page);
  await page.goto("/?theme=dark");
  const scene = page.locator(".landing-scene");
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-scene", "still");
  const still = scene.locator("img");
  await expect(still).toHaveAttribute("src", /studio-dark/);
  await expect.poll(() => still.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
  await expect(scene.locator("canvas")).toHaveCount(0);
});

test("under reduced motion, the 3D tile shows its still and the hero figure holds still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?theme=light");
  await expect(page.locator(".landing-hero__figure svg.uipack--wide animate")).toHaveCount(0);
  await expect(page.locator(".landing-hero__figure svg.uipack--wide animateMotion")).toHaveCount(0);
  const scene = page.locator(".landing-scene");
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-scene", "still");
});

test("the docs search opens from ⌘K / Ctrl-K and from the landing page's header", async ({ page }) => {
  await page.goto("/?theme=light");
  const dialog = page.locator("dialog.uipack-docs-search");
  // The landing page's own chunk has rendered (the header is up before it).
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await page.keyboard.type("spec template");
  await expect(dialog.getByRole("option").first()).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.locator(".showcase-header .uipack-docs-search__button").click();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
});

test("the site map is the docs' five sections, Start first with What UiPack is at its top", async ({ page }) => {
  await page.goto("/?theme=light");
  const map = page.locator("#site-map");
  await expect(map.locator(".landing-map__section > h3")).toHaveText(["Start", "Rules", "Build", "Check", "Reference"]);
  await expect(map.locator('.landing-map__section[data-section="start"] a').first()).toHaveText("What UiPack is");
});

test("a docs page opened from the landing page docks its sidebar marker in place", async ({ page }) => {
  // A docs page remembers itself for the next page's marker to fly from; the landing page, with no
  // sidebar, clears that, so the page opened from it starts without a trip from an older page.
  await page.goto("/agents?theme=light");
  await page.locator("main h1").waitFor();
  await page.goto("/?theme=light");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("uipack-docs-nav"))).toBeNull();
  await page.locator(".landing-job").first().click();
  await expect(page.locator(".uipack-docs__sidebar a[aria-current='page']")).toBeVisible();
});
