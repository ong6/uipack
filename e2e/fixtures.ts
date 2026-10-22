import { test as base, type Browser, type BrowserContext } from "@playwright/test";

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
