import { expect, test, waitForPage, type Page } from "./fixtures";
import {
  ALL,
  checkAlignment,
  checkCompactHeader,
  checkControlFaces,
  checkFocusRingsNotClipped,
  checkHeadingOutline,
  checkHeadingScale,
  checkNoOverflow,
  tabOf,
} from "./page-audit";

// Every playground page, from the catalog, loaded once per width with every page-level check run on
// that load: the heading outline and tab title, the heading scale, control faces, card and control
// alignment, the compact phone header, focus rings, and no page overflow in both themes.
test.describe.configure({ mode: "parallel" });

// Mobile routes the owner asked to keep clean: no page-wide overflow at 390 and 768, in both themes.
const MOBILE_ROUTES = ["/", "/charts", "/assets", "/styles", "/presentations", "/animations", "/docs", "/article"];
// Pages and widths whose focus rings sit in scrolling or clipping rows.
const FOCUS_RING_PAGES: Record<number, string[]> = {
  1440: ["/mechanism", "/docs", "/presentations"],
  390: ["/animations", "/assets", "/mechanism", "/web", "/"],
};
// WebKit runs the audit on a few pages: the diagrams page, the /web sample page, and the docs layout.
const CROSS_BROWSER = ["/", "/web", "/docs"];

async function open(page: Page, path: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path);
  // The lazy page chunk and the fonts settle the layout being measured.
  await waitForPage(page);
}

async function toDark(page: Page) {
  await page.locator("button.theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
}

for (const { label, path } of ALL) {
  const tag = CROSS_BROWSER.includes(path) ? ["@cross-browser"] : [];
  test(
    `${label} (${path}): outline, heading scale, control faces, alignment, phone header, focus rings, overflow`,
    { tag },
    async ({ page }) => {
      test.setTimeout(90_000);

      await test.step("1440", async () => {
        await open(page, path, 1440);
        await expect(page).toHaveTitle(tabOf(label));
        await checkHeadingOutline(page, label, path);
        await checkHeadingScale(page, 24);
        await checkAlignment(page);
        if (path === "/") {
          // Sections on the diagrams page are one shell gap apart.
          const gaps = await page.evaluate(() => {
            const sections = [...document.querySelectorAll("[data-section]")];
            return sections
              .slice(1)
              .map((s, i) => Math.round(s.getBoundingClientRect().top - sections[i].getBoundingClientRect().bottom));
          });
          expect(new Set(gaps)).toEqual(new Set([32]));
        }
        if (FOCUS_RING_PAGES[1440].includes(path)) await checkFocusRingsNotClipped(page);
        await checkControlFaces(page);
      });

      await test.step("390", async () => {
        await open(page, path, 390);
        await checkCompactHeader(page, label);
        await checkHeadingScale(page, 22);
        await checkAlignment(page);
        const mobile = MOBILE_ROUTES.includes(path);
        if (mobile) await checkNoOverflow(page, 390, "390 light");
        if (FOCUS_RING_PAGES[390].includes(path)) await checkFocusRingsNotClipped(page);
        if (path === "/assets") {
          // A half-visible item in a scrolling row comes fully into view when it takes keyboard focus.
          const cats = page.locator(".uipack-browser__cat");
          for (let i = 0; i < (await cats.count()); i++) {
            await cats.nth(i).focus(); // WebKit's Tab skips buttons unless the OS setting is on
            const fits = await page.evaluate(() => {
              const el = document.activeElement!;
              const r = el.getBoundingClientRect();
              const c = el.closest("ul")!.getBoundingClientRect();
              return r.left >= c.left - 0.5 && r.right <= c.right + 0.5;
            });
            expect(fits, `category ${i}`).toBe(true);
          }
        }
        await checkControlFaces(page);
        if (mobile) {
          await toDark(page);
          await checkNoOverflow(page, 390, "390 dark");
        }
      });

      if (MOBILE_ROUTES.includes(path))
        await test.step("768", async () => {
          await open(page, `${path}?theme=light`, 768);
          await checkNoOverflow(page, 768, "768 light");
          await toDark(page);
          await checkNoOverflow(page, 768, "768 dark");
        });
    },
  );
}
