// Stills for the studio-style exploration. One headless Chromium on the real GPU; page timeout and an
// overall deadline; never waits for networkidle.
// node shoot.cjs <outDir> <spec,...>   spec = kind:t:theme:w:h   (e.g. server:1:light:573:558)
// Needs the playground dev server: npx vite --port 5191 --strictPort --host 127.0.0.1 (stop it after).
// env COLD=1: a fresh browser per spec; one priming load, one warm load, then three loads with
// ?cold=<random> (unique shader source, so no cache serves it); writes <outDir>/timings.json.
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const [outDir, list] = process.argv.slice(2);
const specs = list.split(",");
const BASE = "http://127.0.0.1:5191/studio-style/index.html";
const DEADLINE = Number(process.env.DEADLINE_S ?? 240) * 1000;
const ARGS = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"];
fs.mkdirSync(outDir, { recursive: true });

let browser;
const deadline = setTimeout(async () => {
  console.error("DEADLINE hit");
  try {
    await browser?.close();
  } catch {}
  process.exit(2);
}, DEADLINE);

async function shot(page, spec, save, cold) {
  const [kind, t, theme, w, h, time] = spec.split(":");
  const url = `${BASE}?kind=${kind}&t=${t}&theme=${theme}&w=${w}&h=${h}${time ? `&time=${time}` : ""}${cold ? `&cold=${cold}` : ""}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => document.title === "ready" || document.title === "error", null, { timeout: 30000 });
  const result = await page.evaluate(() => window.__studioStyle);
  if (save && !result.error) {
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(outDir, `${kind}-t${t}-${theme}-${w}${time ? `-at${time}` : ""}.png`);
    const info = await page.evaluate(() => { const r = document.getElementById("stage").getBoundingClientRect(); return { title: document.title, w: r.width, h: r.height, x: r.x, y: r.y, url: location.href, hasResult: !!window.__studioStyle }; });
    if (!info.w) console.log("stage info", JSON.stringify(info));
    await page.screenshot({ path: file, clip: { x: info.x, y: info.y, width: info.w, height: info.h }, timeout: 15000 });
    result.file = file;
  }
  return result;
}

(async () => {
  const results = [];
  const gpuCheck = async (page) =>
    page.evaluate(() => {
      const c = document.createElement("canvas").getContext("webgl2");
      const ext = c && c.getExtension("WEBGL_debug_renderer_info");
      return ext ? c.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown";
    });
  if (process.env.COLD) {
    for (const spec of specs) {
      browser = await chromium.launch({ headless: true, args: ARGS });
      const page = await browser.newPage({ viewport: { width: 700, height: 700 }, deviceScaleFactor: 2 });
      page.setDefaultTimeout(20000);
      await shot(page, spec, false); // warms the JS modules and the shader caches
      const warm = await shot(page, spec, false);
      const cold = [];
      for (let i = 0; i < 3; i++) cold.push(await shot(page, spec, false, 1000 + Math.floor(Math.random() * 1e6)));
      const median = (key) => cold.map((c) => c[key]).sort((a, b) => a - b)[1];
      const row = {
        spec,
        coldFirstPaintMs: median("firstPaintMs"),
        coldCompileMs: median("compileMs"),
        coldRuns: cold.map((c) => c.firstPaintMs),
        warmFirstPaintMs: warm.firstPaintMs,
        warmCompileMs: warm.compileMs,
        buildMs: warm.buildMs,
        setupMs: warm.setupMs,
        programs: warm.programs,
        drawCalls: warm.drawCalls,
        triangles: warm.triangles,
        gpu: await gpuCheck(page),
      };
      results.push(row);
      console.log(JSON.stringify(row));
      await browser.close();
      browser = undefined;
    }
  } else {
    browser = await chromium.launch({ headless: true, args: ARGS });
    const page = await browser.newPage({ viewport: { width: 700, height: 700 }, deviceScaleFactor: 2 });
    page.setDefaultTimeout(20000);
    page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
    page.on("pageerror", (e) => console.error("pageerror:", e.message));
    for (const spec of specs) {
      const r = await shot(page, spec, true);
      results.push(r);
      console.log(JSON.stringify(r));
    }
    console.log("GPU:", await gpuCheck(page));
    await browser.close();
    browser = undefined;
  }
  fs.writeFileSync(path.join(outDir, process.env.COLD ? "timings.json" : `results-${Date.now()}.json`), JSON.stringify(results, null, 2));
  clearTimeout(deadline);
})().catch(async (e) => {
  console.error(e);
  try {
    await browser?.close();
  } catch {}
  clearTimeout(deadline);
  process.exit(1);
});
