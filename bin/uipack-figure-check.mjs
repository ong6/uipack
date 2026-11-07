// The figure geometry check a site can run on its own page (the uipack-diagram skill, step 6):
//
//   node node_modules/uipack/bin/uipack-figure-check.mjs <url> [--views 1440,390]
//
// For every figure drawing the page shows at each width, it reports an arrow label that a
// connector crosses without the label sitting on it, a label drawn over a node, chip or another
// label, and lists the connectors with no label beside them so the author can check each one.
// Exit codes: 0 no finding, 1 a finding, 2 usage error. Needs `playwright` and its Chromium.
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Overlap of two boxes along one axis. */
const span = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/**
 * The findings for one drawing, in its user units. `labels` are the label plates (`text`, `x`, `y`,
 * `w`, `h`), `lines` each connector as sampled points (`pts`: `[x, y][]`) and `boxes` the nodes and
 * chips (`x`, `y`, `w`, `h`, `kind`). A label may sit on a connector: the line runs along it (through
 * most of its width) or through its middle third (a label centred on a vertical arrow). Any other
 * crossing is a line drawn through the words.
 */
export function figureFindings({ labels, lines, boxes }) {
  const problems = [];
  const unlabelled = [];
  for (const l of labels) {
    const inner = { x0: l.x + 1, x1: l.x + l.w - 1, y0: l.y + 1, y1: l.y + l.h - 1 };
    for (const line of lines) {
      const inside = line.pts.filter(([x, y]) => x > inner.x0 && x < inner.x1 && y > inner.y0 && y < inner.y1);
      if (!inside.length) continue;
      const xs = inside.map((p) => p[0]);
      const run = Math.max(...xs) - Math.min(...xs);
      const along = run >= (inner.x1 - inner.x0) * 0.6;
      const mid = (inner.x0 + inner.x1) / 2;
      const third = (inner.x1 - inner.x0) / 6;
      const centred = run < 4 && xs.every((x) => Math.abs(x - mid) <= third);
      if (!along && !centred)
        problems.push(`a connector crosses the label "${l.text}" at ${Math.round(xs[0])},${Math.round(inside[0][1])}`);
    }
    for (const b of boxes) {
      if (span(l.x, l.x + l.w, b.x, b.x + b.w) > 2 && span(l.y, l.y + l.h, b.y, b.y + b.h) > 2)
        problems.push(`the label "${l.text}" is drawn over the ${b.kind}${b.text ? ` "${b.text}"` : ""}`);
    }
  }
  for (let i = 0; i < labels.length; i++)
    for (let j = i + 1; j < labels.length; j++) {
      const a = labels[i];
      const b = labels[j];
      if (span(a.x, a.x + a.w, b.x, b.x + b.w) > 2 && span(a.y, a.y + a.h, b.y, b.y + b.h) > 2)
        problems.push(`the labels "${a.text}" and "${b.text}" overlap`);
    }
  // A connector with no label plate within 16 units of its line: listed, not failed (a feed arrow
  // or a bus stub may need none), so the author checks each one says what moves.
  for (const line of lines) {
    const near = labels.some((l) =>
      line.pts.some(([x, y]) => x > l.x - 16 && x < l.x + l.w + 16 && y > l.y - 16 && y < l.y + l.h + 16),
    );
    if (!near && line.pts.length) {
      const [a, b] = [line.pts[0], line.pts[line.pts.length - 1]];
      unlabelled.push(`${Math.round(a[0])},${Math.round(a[1])} → ${Math.round(b[0])},${Math.round(b[1])}`);
    }
  }
  return { problems, unlabelled };
}

/** Runs in the page: each visible figure drawing's labels, connectors and boxes, in user units. */
export function collectFigures() {
  const out = [];
  const bbox = (el) => {
    const b = el.getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  };
  for (const svg of document.querySelectorAll("svg.uipack--wide, svg.uipack--narrow")) {
    if (!svg.getClientRects().length) continue;
    const figure = svg.closest("figure");
    const name =
      figure?.querySelector("figcaption, h2, h3, h4")?.textContent?.trim().slice(0, 60) ||
      figure?.getAttribute("aria-label") ||
      "figure";
    const labels = [...svg.querySelectorAll('[data-uipack="label"]')]
      .filter((g) => g.getClientRects().length)
      .map((g) => ({ text: g.textContent.trim(), ...bbox(g.querySelector("rect")) }));
    const lines = [...svg.querySelectorAll('[data-uipack="connector"]')]
      .filter((p) => p.getClientRects().length)
      .map((p) => {
        const len = p.getTotalLength();
        const pts = [];
        for (let s = 0; s <= len; s += 2) {
          const q = p.getPointAtLength(s);
          pts.push([q.x, q.y]);
        }
        return { pts };
      });
    const boxes = [
      ...[...svg.querySelectorAll('[data-uipack="node"] > rect')].map((r) => ({
        kind: "node",
        text: r.parentElement.querySelector("text")?.textContent?.trim() ?? "",
        ...bbox(r),
      })),
      ...[...svg.querySelectorAll('[data-uipack="chip"] > rect')].map((r) => ({
        kind: "chip",
        text: r.parentElement.querySelector("text")?.textContent?.trim() ?? "",
        ...bbox(r),
      })),
    ].filter((b) => b.w > 0 && b.h > 0);
    out.push({ name, drawing: svg.classList.contains("uipack--narrow") ? "narrow" : "wide", labels, lines, boxes });
  }
  return out;
}

async function loadPlaywright() {
  for (const name of ["playwright", "@playwright/test"]) {
    try {
      const mod = await import(name);
      const pw = mod.chromium ? mod : mod.default;
      if (pw?.chromium) return pw;
    } catch {
      // try the next one
    }
  }
  throw new Error("uipack-figure-check needs Playwright: npm i -D playwright && npx playwright install chromium");
}

export async function main(argv) {
  const url = argv.find((a) => !a.startsWith("--"));
  const at = argv.indexOf("--views");
  const views = (at >= 0 ? argv[at + 1] : "1440,390").split(",").map(Number);
  if (!url || views.some((v) => !v)) {
    console.error("usage: uipack-figure-check <url> [--views 1440,390]");
    return 2;
  }
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch();
  let failed = 0;
  try {
    for (const width of views) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const figures = await page.evaluate(`(${collectFigures.toString()})()`);
      if (!figures.length) console.log(`${width}px: no figure drawing on the page`);
      for (const fig of figures) {
        const { problems, unlabelled } = figureFindings(fig);
        failed += problems.length;
        console.log(`${width}px ${fig.drawing} · ${fig.name}: ${problems.length ? `${problems.length} problem(s)` : "ok"}`);
        for (const p of problems) console.log(`  fail: ${p}`);
        if (unlabelled.length)
          console.log(`  check: ${unlabelled.length} connector(s) with no label beside them (${unlabelled.join("; ")})`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href)
  process.exitCode = await main(process.argv.slice(2));
