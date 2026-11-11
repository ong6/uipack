// Crawls the built docs site the way a reader and an agent meet it: every route (and each deck
// sub-view) loaded directly, in light and dark, scrolled to the end so lazy previews mount. It
// fails on a console error, a Content-Security-Policy violation, a failed or non-200 request, a
// route that is not a 200 document, an internal link that does not resolve, or a crawl file
// (robots.txt, sitemap.xml, llms.txt and every file llms.txt links) that is missing.
//
//   npm run build:site && npx tsx scripts/check-site.ts            # serves playground/dist with vercel.json's headers
//   npx tsx scripts/check-site.ts https://ui.junxiong.dev          # the live site
//   ... --theme dark                                                 # one theme only (CI runs each on its own runner)
import { chromium, type Page } from "@playwright/test";
import { pageDefs } from "../playground/catalog";
import { siteRoutes, SITE_ORIGIN } from "../playground/site";
// @ts-expect-error a plain ES module without types
import { serveSite } from "./serve-site.mjs";

const DEADLINE_MS = 13 * 60_000;
const PAGE_TIMEOUT_MS = 30_000;
const started = Date.now();
const args = process.argv.slice(2);
const remote = args.find((a) => /^https?:\/\//.test(a));
const themeArg = args.includes("--theme") ? args[args.indexOf("--theme") + 1] : undefined;
const themes = themeArg ? [themeArg] : ["light", "dark"];

const server = remote ? null : await serveSite();
const base = (remote ?? server.origin).replace(/\/$/, "");
// A local build writes the deployed origin into its canonicals and llms.txt: check those against the build.
const local = (url: string) => url.replace(SITE_ORIGIN, base);

const problems: string[] = [];
const fail = (where: string, what: string) => problems.push(`${where}: ${what}`);

// Every address a reader can open: each route's file (aliases too) and the deck's sub-views.
const addresses = new Set<string>(siteRoutes().map((r) => r.path));
for (const p of pageDefs) if (p.query) addresses.add(`${p.path}?${new URLSearchParams(p.query)}`);

const REQUIRED_HEADERS = [
  "content-security-policy",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "strict-transport-security",
];

const browser = await chromium.launch({
  args:
    process.platform === "linux" && process.env.CI
      ? ["--use-gl=angle", "--use-angle=gl", "--ignore-gpu-blocklist", "--enable-webgl"]
      : [],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
// A CSP violation is reported to the page; the console message alone is not reliable for every kind.
await context.addInitScript(() =>
  document.addEventListener("securitypolicyviolation", (e) =>
    console.error(`CSP violation: ${e.violatedDirective} blocked ${e.blockedURI || "inline"} (${e.sourceFile}:${e.lineNumber})`),
  ),
);
const links = new Set<string>();
const requests = new Set<string>();

async function visit(page: Page, address: string, theme: string) {
  const sep = address.includes("?") ? "&" : "?";
  const where = `${address}${sep}theme=${theme}`;
  const onConsole = (m: { type(): string; text(): string }) => m.type() === "error" && fail(where, `console: ${m.text()}`);
  const onError = (e: Error) => fail(where, `page error: ${e.message}`);
  const onFailed = (r: { url(): string; failure(): { errorText: string } | null }) =>
    // A navigation away aborts what the last page still had in flight; that is not a failure.
    r.failure()?.errorText !== "net::ERR_ABORTED" && fail(where, `request failed: ${r.url()} ${r.failure()?.errorText}`);
  const onResponse = (r: { url(): string; status(): number }) => {
    requests.add(r.url());
    if (r.status() >= 400) fail(where, `${r.status()} ${r.url()}`);
  };
  page.on("console", onConsole);
  page.on("pageerror", onError);
  page.on("requestfailed", onFailed);
  page.on("response", onResponse);
  try {
    const res = await page.goto(`${base}${where}`, { waitUntil: "load", timeout: PAGE_TIMEOUT_MS });
    if (res?.status() !== 200) fail(where, `document status ${res?.status()}`);
    const headers = res?.headers() ?? {};
    if (!remote || base.startsWith("https://")) for (const h of REQUIRED_HEADERS) if (!headers[h]) fail(where, `no ${h} header`);
    await page.locator("main h1").first().waitFor({ timeout: PAGE_TIMEOUT_MS });
    if ((await page.getAttribute("html", "data-theme")) !== theme) fail(where, "theme not applied");
    // Scroll to the end in screen-sized steps so lazy previews and scroll-in figures mount and load.
    for (let y = 0; y < (await page.evaluate(() => document.documentElement.scrollHeight)); y += 800) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" as ScrollBehavior }), y);
      await page.waitForTimeout(120);
      if (y > 60_000) break;
    }
    await page.waitForTimeout(800);
    // SVG links too: their href is an SVGAnimatedString, so resolve the attribute.
    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((a) => new URL(a.getAttribute("href")!, location.href).href));
    for (const href of hrefs) if (href.startsWith(base)) links.add(href.split(/[?#]/)[0]);
  } catch (e) {
    fail(where, String(e).split("\n")[0]);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onError);
    page.off("requestfailed", onFailed);
    page.off("response", onResponse);
  }
}

const page = await context.newPage();
let visits = 0;
for (const theme of themes)
  for (const address of addresses) {
    if (Date.now() - started > DEADLINE_MS) {
      fail("crawl", `deadline of ${DEADLINE_MS / 60_000} min reached after ${visits} visits`);
      break;
    }
    await visit(page, address, theme);
    visits++;
  }

// Every internal link a page shows, and every crawl file and what it names.
const get = async (url: string) => {
  const res = await context.request.get(url, { maxRedirects: 0, timeout: PAGE_TIMEOUT_MS });
  return { status: res.status(), type: res.headers()["content-type"] ?? "", text: res.status() === 200 ? await res.text() : "" };
};
let linkChecks = 0;
for (const link of links) {
  const { status } = await get(link);
  linkChecks++;
  if (status !== 200) fail("link", `${status} ${link}`);
}
const robots = await get(`${base}/robots.txt`);
if (
  robots.status !== 200 ||
  !robots.type.startsWith("text/plain") ||
  !robots.text.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)
)
  fail("robots.txt", `${robots.status} ${robots.type}, no Sitemap line for ${SITE_ORIGIN}`);
const sitemap = await get(`${base}/sitemap.xml`);
const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (sitemap.status !== 200 || locs.length < 10) fail("sitemap.xml", `${sitemap.status}, ${locs.length} URLs`);
const llms = await get(`${base}/llms.txt`);
const llmsLinks = [...llms.text.matchAll(/\]\((https?:[^)\s]+)\)/g)].map((m) => m[1]);
if (llms.status !== 200 || !llms.text.startsWith("# UiPack") || llmsLinks.length < 10)
  fail("llms.txt", `${llms.status}, ${llmsLinks.length} links`);
let crawlChecks = 0;
for (const url of [...locs, ...llmsLinks]) {
  if (!url.startsWith(SITE_ORIGIN)) {
    fail("crawl files", `${url} is not on ${SITE_ORIGIN}`);
    continue;
  }
  const { status, type } = await get(local(url));
  crawlChecks++;
  if (status !== 200) fail("crawl files", `${status} ${url}`);
  if (url.endsWith(".md") && !type.startsWith("text/markdown")) fail("crawl files", `${url} is ${type}`);
}

await browser.close();
await server?.close();
const seconds = Math.round((Date.now() - started) / 1000);
console.log(
  `check-site: ${base}: ${visits} page loads (${addresses.size} addresses × ${themes.join("+")}), ${requests.size} distinct requests, ` +
    `${linkChecks} internal links, ${crawlChecks} sitemap/llms.txt URLs, ${seconds}s`,
);
if (problems.length) {
  console.error(`check-site: ${problems.length} problem(s)\n${[...new Set(problems)].join("\n")}`);
  process.exit(1);
}
console.log("check-site: no console errors, CSP violations or failed requests");
