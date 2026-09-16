import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// The exported file is loaded the way a README or a Markdown site loads it:
// through <img>, where no page CSS, JavaScript or fonts can reach it. Motion
// is checked by screenshotting the image twice; the pixels differ only when
// SMIL runs inside the image.
async function mount(page: import("@playwright/test").Page, src: string) {
  await page.goto("/");
  await page.evaluate((src) => {
    document.body.innerHTML = `<img id="static-img" src="${src}" style="width:900px;display:block">`;
  }, src);
  const img = page.locator("#static-img");
  await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await page.waitForTimeout(200);
  return img;
}

test.describe("static export in <img>", () => {
  test("the file carries no CSS variables and keeps SMIL", () => {
    const svg = readFileSync("playground/e2e-static/motion.svg", "utf8");
    expect(svg).not.toContain("var(--");
    expect(svg).toContain("<animateMotion");
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    const still = readFileSync("playground/e2e-static/still.svg", "utf8");
    expect(still).not.toContain("<animateMotion");
  });

  test("packets move inside the image when motion is on", async ({ page }) => {
    const img = await mount(page, "/e2e-static/motion.svg");
    const a = await img.screenshot();
    await page.waitForTimeout(600);
    const b = await img.screenshot();
    expect(a.equals(b)).toBe(false);
  });

  test("nothing moves when motion is off", async ({ page }) => {
    const img = await mount(page, "/e2e-static/still.svg");
    const a = await img.screenshot();
    await page.waitForTimeout(600);
    const b = await img.screenshot();
    expect(a.equals(b)).toBe(true);
  });

  test("bare export has the drawing's own viewBox and a transparent canvas", async ({ page }) => {
    const svg = readFileSync("playground/e2e-static/bare.svg", "utf8");
    expect(svg).toContain('viewBox="0 0 1120 480"');
    expect(svg).not.toContain('fill="#ffffff"/>');
    const img = await mount(page, "/e2e-static/bare.svg");
    const ratio = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth / (el as HTMLImageElement).naturalHeight);
    expect(Math.abs(ratio - 1120 / 480)).toBeLessThan(0.01);
  });
});
