import { expect as baseExpect, test as base, type Browser, type BrowserContext, type Page } from "@playwright/test";

export { expect, type Browser, type Page, type Locator, type BrowserContext } from "@playwright/test";

/**
 * Playwright's WebKit (1.61, macOS) hangs the first navigation of the 64th page one browser
 * instance opens, whatever the URL (a data: URL too), whether or not earlier pages were closed.
 * In a long worker that was the "WebKit 390px header tests time out under load" flake: whichever
 * test happened to open page 64 waited 30s for a navigation that never started.
 *
 * So each worker's WebKit is relaunched before it reaches that page: `browser` is a stand-in whose
 * newContext() opens the context on a fresh browser once the current one has opened PAGE_BUDGET
 * pages. An old browser closes as soon as none of its contexts is open. Chromium keeps one browser.
 */
const PAGE_BUDGET = 48;

export const test = base.extend<object, { browser: Browser }>({
  browser: [
    async ({ playwright, browserName }, use) => {
      const launch = () => playwright[browserName].launch();
      let current = await launch();
      if (browserName !== "webkit") {
        await use(current);
        await current.close();
        return;
      }
      let pages = 0;
      const retired: Browser[] = [];
      const closeIdle = async () => {
        for (const old of retired.splice(0)) {
          if (old.contexts().length) retired.push(old);
          else await old.close();
        }
      };
      const newContext = async (options?: Parameters<Browser["newContext"]>[0]): Promise<BrowserContext> => {
        await closeIdle();
        if (pages >= PAGE_BUDGET) {
          retired.push(current);
          current = await launch();
          pages = 0;
        }
        const context = await current.newContext(options);
        context.on("page", () => pages++);
        return context;
      };
      const stand = new Proxy({} as Browser, {
        get(_, prop) {
          if (prop === "newContext") return newContext;
          if (prop === "newPage")
            return async (options?: Parameters<Browser["newPage"]>[0]) => {
              const context = await newContext(options);
              const page = await context.newPage();
              // Browser.newPage owns its context: closing the page closes it.
              page.on("close", () => void context.close());
              return page;
            };
          const value = Reflect.get(current, prop);
          return typeof value === "function" ? value.bind(current) : value;
        },
      });
      await use(stand);
      await Promise.all([current, ...retired].map((b) => b.close()));
    },
    { scope: "worker", timeout: 0 },
  ],
});

/**
 * Waits until `read` gives the same value on two polls in a row, `every` ms apart: a scroll, a
 * render loop or a transition has come to rest. Use it instead of a fixed sleep before reading a
 * settled state. (A test that must watch time pass, to show nothing moves, still sleeps, and says so.)
 */
export async function waitForStable<T>(read: () => Promise<T>, { every = 100, timeout = 5_000 } = {}) {
  let last: string | undefined;
  await baseExpect
    .poll(
      async () => {
        const now = JSON.stringify(await read());
        const same = now === last;
        last = now;
        return same;
      },
      { intervals: [every], timeout },
    )
    .toBe(true);
}

/**
 * Waits until a playground page has rendered: the shell is up, the page's lazy chunk has replaced
 * its "Loading …" status line (main.tsx), and the fonts are in. Measure layout or walk focus only
 * after this; the status line is visible after 300ms, so "something under the title is visible"
 * is not the same condition.
 */
export async function waitForPage(page: Page) {
  await baseExpect(page.locator(".showcase-title")).toBeVisible();
  await baseExpect(page.locator(".showcase-loading")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}
