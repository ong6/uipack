// Regenerates the 3D look's stills (playground/assets/styles/ink-{light,dark}.jpg): the travel scene
// in ink line art at its rest pose, for the style card on /specs/technical and the landing page's
// 3D tile without WebGL. The same subject as the card's link in playground/CatalogShowcase.tsx.
// Needs the dev server: `npx vite --port 5285`, then `node scripts/style-stills.mjs [baseURL]`.
// One headless browser on the real GPU, with page timeouts and an overall deadline; no image
// dependency (the browser downscales).
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:5285";
const out = new URL("../playground/assets/styles/", import.meta.url);
const [W, H] = [720, 360];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const deadline = setTimeout(() => browser.close().finally(() => process.exit(2)), 120_000);
try {
  for (const theme of ["light", "dark"]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
    });
    page.setDefaultTimeout(20_000);
    await page.goto(`${base}/animations?story=travel&theme=${theme}`, { waitUntil: "domcontentloaded" });
    const canvas = page.locator(".uipack-gallery-stage canvas").first();
    await canvas.and(page.locator('[data-phase="rest"]')).waitFor();
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".uipack-gallery-stage canvas")).opacity === "1");
    // The still is the drawing alone: no player chrome.
    await page.addStyleTag({ content: ".uipack-object-open, .uipack-object__motion { visibility: hidden; }" });
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("no canvas for the travel scene");
    // The whole stage, fitted into the 2:1 still on the stage's own ground (its corner pixel).
    const png = await page.screenshot({ clip: box });
    const jpeg = await page.evaluate(
      async ({ src, W, H }) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const c = document.createElement("canvas");
        [c.width, c.height] = [W, H];
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0, 1, 1, 0, 0, W, H);
        g.imageSmoothingQuality = "high";
        const scale = Math.min(W / img.width, (H * 1.12) / img.height);
        const w = img.width * scale,
          h = img.height * scale;
        g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        return c.toDataURL("image/jpeg", 0.85).split(",")[1];
      },
      { src: `data:image/png;base64,${png.toString("base64")}`, W, H },
    );
    writeFileSync(new URL(`ink-${theme}.jpg`, out), Buffer.from(jpeg, "base64"));
    await page.close();
  }
} finally {
  clearTimeout(deadline);
  await browser.close();
}
