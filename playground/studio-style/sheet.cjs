// Composes sheet-light.png and sheet-dark.png from the frames: rows = treatments, columns = subjects
// (573 px, then 390 px). node sheet.cjs <framesDir> <outDir>
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const [framesDir, outDir] = process.argv.slice(2);
const timings = JSON.parse(fs.readFileSync(path.join(framesDir, "timings.json"), "utf8"));
const metric = (kind, t) => timings.find((r) => r.spec === `${kind}:${t}:light:573:558`);
const FONT = path.resolve(__dirname, "../../src/web/fonts");
const rows = [
  [0, "Current Studio", "Photographic PBR: room environment, shadow map, rim light, sweep (reference)."],
  [1, "Ink line art", "Unlit page-toned faces, ink silhouettes and creases, one cobalt part."],
  [2, "Blueprint blend", "Line model on the 12px dotted canvas, dashed hidden lines, mono callouts and a fig. caption in HTML."],
  [3, "Halftone shading", "Shade printed as a 6px dot screen locked to the page grid, ink outlines."],
  [4, "Paper and ink", "Three flat tones per material (toon steps), thin silhouette, hard ink contact shadow."],
  [5, "Grid relief", "Own idea: the object printed with the page's 12px dot grid, dots grow with shade."],
];
const colours = {
  light: { page: "#F3EFE7", ink: "#29231F", muted: "#6b625b", rule: "#d9d2c6" },
  dark: { page: "#151311", ink: "#F2ECE3", muted: "#a59c92", rule: "#3a3530" },
};
const deadline = setTimeout(() => process.exit(2), 120000);

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
  try {
    for (const theme of ["light", "dark"]) {
      const c = colours[theme];
      const cell = (kind, t, w) => {
        const file = path.join(framesDir, `${kind}-t${t}-${theme}-${w}.png`);
        const m = w === 573 ? metric(kind, t) : null;
        const note = m
          ? `first paint ${m.coldFirstPaintMs} ms cold · ${m.warmFirstPaintMs} ms warm · ${m.programs} programs · ${m.drawCalls} draws`
          : `${w} px wide`;
        return `<figure><img src="file://${file}" style="width:${w}px"><figcaption>${note}</figcaption></figure>`;
      };
      const body = rows
        .map(
          ([t, name, what]) => `<section>
            <header><span class="n">${String(t).padStart(2, "0")}</span><h2>${name}</h2><p>${what}</p></header>
            ${cell("server", t, 573)}${cell("travel", t, 573)}${cell("server", t, 390)}${cell("travel", t, 390)}
          </section>`,
        )
        .join("");
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
        @font-face { font-family: Mono; src: url("file://${FONT}/ibm-plex-mono-latin-400-normal.woff2"); font-weight: 400; }
        @font-face { font-family: Mono; src: url("file://${FONT}/ibm-plex-mono-latin-600-normal.woff2"); font-weight: 600; }
        @font-face { font-family: Sans; src: url("file://${FONT}/ibm-plex-sans-latin-600-normal.woff2"); font-weight: 600; }
        body { margin: 0; padding: 32px 40px; background: ${c.page}; color: ${c.ink}; font: 400 13px/1.4 Mono, monospace; width: max-content; }
        .top { display: flex; gap: 40px; align-items: baseline; margin-bottom: 16px; }
        .top h1 { font: 600 28px/1.2 Sans, sans-serif; margin: 0; }
        .cols { display: grid; grid-template-columns: 220px 573px 573px 390px 390px; gap: 0 16px; color: ${c.muted}; padding-bottom: 8px; border-bottom: 1px solid ${c.rule}; }
        section { display: grid; grid-template-columns: 220px 573px 573px 390px 390px; gap: 0 16px; align-items: start; padding: 16px 0; border-bottom: 1px solid ${c.rule}; }
        header .n { color: ${c.muted}; }
        header h2 { font: 600 20px/1.2 Sans, sans-serif; margin: 6px 0 8px; }
        header p { margin: 0; color: ${c.muted}; font-size: 12px; }
        figure { margin: 0; }
        img { display: block; }
        figcaption { font-size: 12px; color: ${c.muted}; margin-top: 4px; }
      </style></head><body>
        <div class="top"><h1>Studio rendering treatments</h1><span>// ${theme} theme · same geometry, rest pose · frames on a transparent canvas over the page</span></div>
        <div class="cols"><span>// treatment</span><span>Inference hardware · 573×558</span><span>Folded atlas · 573×558</span><span>Inference hardware · 390</span><span>Folded atlas · 390</span></div>
        ${body}
      </body></html>`;
      const htmlFile = path.join(framesDir, `sheet-${theme}.html`);
      fs.writeFileSync(htmlFile, html);
      const page = await browser.newPage({ viewport: { width: 2400, height: 1000 }, deviceScaleFactor: 1.5 });
      page.setDefaultTimeout(20000);
      await page.goto(`file://${htmlFile}`, { waitUntil: "load", timeout: 20000 });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(outDir, `sheet-${theme}.png`), fullPage: true, timeout: 30000 });
      await page.close();
    }
  } finally {
    await browser.close();
    clearTimeout(deadline);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
