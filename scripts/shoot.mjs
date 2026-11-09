#!/usr/bin/env node
// Bounded full-page screenshots of a running preview. See docs/testing.md.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    base: { type: "string" },
    out: { type: "string" },
    paths: { type: "string" },
    widths: { type: "string" },
    themes: { type: "string", default: "light,dark" },
    "deadline-s": { type: "string", default: "300" },
  },
});
if (!values.base || !values.out || !values.paths || !values.widths)
  throw new Error(
    "Usage: npm run shoot -- --base <url> --out <dir> --paths /,/web --widths 1440,390 [--themes light,dark] [--deadline-s 300]",
  );
const base = new URL(values.base);
if (!["http:", "https:"].includes(base.protocol)) throw new Error("--base must be an HTTP URL");
const paths = values.paths.split(",");
if (paths.some((path) => !path.startsWith("/") || path.startsWith("//")))
  throw new Error("--paths must contain local paths beginning with /");
const widths = values.widths.split(",").map(Number);
if (widths.some((width) => !Number.isSafeInteger(width) || width < 1)) throw new Error("--widths must contain positive integers");
const themes = values.themes.split(",");
if (themes.some((theme) => !["light", "dark"].includes(theme))) throw new Error("--themes must contain light or dark");
const deadlineMs = Number(values["deadline-s"]) * 1000;
if (!Number.isFinite(deadlineMs) || deadlineMs <= 0 || deadlineMs > 2_147_483_647)
  throw new Error("--deadline-s must be a positive duration");

const PAGE_TIMEOUT = 20_000;
let server;
let browser;
let current = "startup";
// launchServer exposes the local browser process, so even a stalled close cannot extend the deadline.
const deadline = setTimeout(() => {
  console.error(`fail ${current}: overall deadline exceeded (${values["deadline-s"]}s)`);
  void browser?.close().catch(() => {});
  server?.process()?.kill("SIGKILL");
  process.exit(1);
}, deadlineMs);

async function waitForFonts(page) {
  let timer;
  try {
    await Promise.race([
      page.evaluate(() => document.fonts.ready.then(() => undefined)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Fonts did not become ready within 20s")), PAGE_TIMEOUT);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

let failed = false;
try {
  await mkdir(values.out, { recursive: true });
  server = await chromium.launchServer({ timeout: PAGE_TIMEOUT });
  browser = await chromium.connect(server.wsEndpoint(), { timeout: PAGE_TIMEOUT });
  for (const [index, path] of paths.entries()) {
    for (const width of widths) {
      for (const theme of themes) {
        current = `${path} ${width} ${theme}`;
        let page;
        try {
          page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce", colorScheme: theme });
          page.setDefaultTimeout(PAGE_TIMEOUT);
          const url = new URL(path, base);
          url.searchParams.set("theme", theme);
          const response = await page.goto(url.href, { waitUntil: "load", timeout: PAGE_TIMEOUT });
          if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? "no response"}`);
          // Docs demos load after the document's load event; capture their content, not Suspense.
          await page.waitForFunction(() => !document.querySelector(".showcase-loading"), null, { timeout: PAGE_TIMEOUT });
          await waitForFonts(page);
          const name =
            path
              .split(/[?#]/)[0]
              .replace(/[^a-z0-9-]+/gi, "-")
              .replace(/^-|-$/g, "") || "home";
          await page.screenshot({
            path: join(values.out, `${index}-${name}-${width}-${theme}.png`),
            fullPage: true,
            timeout: PAGE_TIMEOUT,
            animations: "disabled",
          });
          console.log(`ok ${current}`);
        } catch (error) {
          failed = true;
          console.log(`fail ${current}`);
          console.error(error.message);
        } finally {
          await page?.close();
        }
      }
    }
  }
} catch (error) {
  failed = true;
  console.error(`fail ${current}: ${error.message}`);
} finally {
  try {
    await browser?.close();
  } finally {
    await server?.close();
    clearTimeout(deadline);
  }
}
process.exitCode = failed ? 1 : 0;
