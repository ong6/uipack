import { libraryPages } from "../playground/catalog";
import { tidyFacts } from "../playground/tidyFacts";
import { wordRules } from "../playground/guideFacts";
import { expect, test, type Page } from "./fixtures";

// The /web sample page and its gallery are example data any area can edit: a styles fix once put
// an invented headline, a "Most picked" badge and a numbering bug on it unseen. These checks hold
// the sample to the product's facts and the page to the rules its own guides teach.

/**
 * Text the sample product says: the example page and the gallery demos that show its copy
 * (`data-sample`; the type, opacity and grid specimens show system values instead).
 */
const SAMPLE = ".web-example, .web-block[data-sample]";

async function settle(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await expect(page.locator(".web-example")).toBeVisible();
  // Lazy sections and the gallery mount on scroll.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await expect(page.locator(".web-block").first()).toBeVisible();
}

const sampleText = (page: Page) =>
  page.locator(SAMPLE).evaluateAll((els) => els.map((e) => (e as HTMLElement).innerText).join("\n"));

test.describe("/web sample content", () => {
  test("says only what the product's facts support, with no builder words", async ({ page }) => {
    test.setTimeout(60_000);
    await settle(page, "/web?theme=light");
    const text = await sampleText(page);
    expect(text.match(/\b(slots?|placeholder|lorem|todo|tbd)\b/gi) ?? []).toEqual([]);
    const unsupported: string[] = [];
    // Money, durations, percentages and decimals are claims: each must be a fact.
    for (const m of text.matchAll(/\$\d+(?:\.\d+)?|\d+(?:\.\d+)?\s?(?:%|h\b|hours?\b|s\b|seconds?\b|ms\b)|\b\d+\.\d+\b/g))
      if (!tidyFacts.claims.includes(m[0].replace(/\s/g, ""))) unsupported.push(m[0]);
    // Bare counts above the section and step indices must be counts the product facts give.
    for (const m of text.matchAll(/(?<![\d.$])\d+(?![\d.%])/g)) {
      const n = Number(m[0]);
      if (n > 12 && !tidyFacts.counts.includes(n)) unsupported.push(m[0]);
    }
    expect(unsupported).toEqual([]);
  });

  test("one goal: every primary button on the sample page is the one call to action", async ({ page }) => {
    await settle(page, "/web?theme=light");
    const primary = await page
      .locator('.web-example .uipack-web-cta[data-variant="primary"], .web-example .uipack-web-cta:not([data-variant])')
      .evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetParent).map((e) => (e as HTMLElement).innerText.trim()));
    expect(primary.length).toBeGreaterThan(0);
    expect(primary.length).toBeLessThanOrEqual(4);
    expect(new Set(primary)).toEqual(new Set([tidyFacts.cta]));
  });

  test("sections are numbered in order and their heads keep the web section-head budget", async ({ page }) => {
    await settle(page, "/web?theme=light");
    const indices = await page
      .locator(".web-example .uipack-web-section__index")
      .evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetParent).map((e) => (e as HTMLElement).innerText.trim()));
    indices.forEach((ix, i) => expect(Number(ix.replace(/\D/g, "")), `index ${ix}`).toBe(i + 1));
    const [min, max] = wordRules.webSectionHead;
    const heads = await page
      .locator(".web-example .uipack-web-section h2")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).innerText.trim()));
    expect(heads.length).toBeGreaterThan(4);
    const over = heads.filter((h) => {
      const n = h.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
      return n < min || n > max;
    });
    expect(over, `section heads outside ${min}–${max} words`).toEqual([]);
  });
});

test("every Foundations guide links to where its full rules live", async ({ page }) => {
  test.setTimeout(90_000);
  const guides = libraryPages.filter((p) => p.group === "foundations" && p.path.startsWith("/foundations"));
  const missing: string[] = [];
  for (const g of guides) {
    await page.goto(`${g.path}?theme=light`);
    await expect(page.locator("main > section h2").first()).toBeVisible();
    const links = await page.locator('main a[href*="github.com/ong6/uipack/blob/main/docs/"]').count();
    if (!links) missing.push(g.path);
  }
  expect(missing).toEqual([]);
});
