// Regenerates the object art-direction stills on /styles (playground/assets/styles/*.jpg).
// One scene (the travel study) in each of the six directions and both themes, so the cards
// compare looks rather than subjects. Needs the dev server: `npx vite --port 5285`, then
// `node scripts/style-stills.mjs [baseURL]`. No image dependency: the browser downscales.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:5285";
const out = new URL("../playground/assets/styles/", import.meta.url);
const directions = ["studio", "paper-theatre", "kinetic", "cartoon", "realistic", "abstract"];
const [W, H] = [720, 360];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  for (const [variant, id] of directions.entries()) {
    await page.goto(`${base}/animations?story=travel&variant=${variant}&theme=${theme}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(5000);
    const canvas = page.locator(".uipack-gallery-stage canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error(`no canvas for ${id}`);
    // A 2:1 band below the stage's label and Open canvas button.
    const top = box.y + 68;
    const png = await page.screenshot({ clip: { x: box.x, y: top, width: box.width, height: box.width / 2 } });
    const jpeg = await page.evaluate(
      async ({ src, W, H }) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const c = document.createElement("canvas");
        [c.width, c.height] = [W, H];
        const g = c.getContext("2d");
        g.imageSmoothingQuality = "high";
        g.drawImage(img, 0, 0, W, H);
        return c.toDataURL("image/jpeg", 0.8).split(",")[1];
      },
      { src: `data:image/png;base64,${png.toString("base64")}`, W, H },
    );
    writeFileSync(new URL(`${id}-${theme}.jpg`, out), Buffer.from(jpeg, "base64"));
  }
  await page.close();
}
await browser.close();
