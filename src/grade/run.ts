/**
 * Drives a headless Chromium through every view of a site spec (each viewport, light and dark,
 * reduced motion on) and grades the page: measure, evaluate, crop, write. Node only. Playwright
 * is loaded at run time (`playwright` or `@playwright/test`), so the package does not depend on it.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  measureFocus,
  measureMotion,
  measurePage,
  type Box,
  type FocusSample,
  type Measurements,
  type MotionSample,
} from "./measure";
import { decodePng, diffBitmaps, sampleBackground } from "./png";
import { REPORT_VERSION, summarise, toMarkdown, type GradeReport, type ViewReport } from "./report";
import { evaluateView, findOverlaps, firstFamily, type Extras, type PlatformFontUse } from "./rules";
import type { SiteSpec, ThemeSetup, Viewport } from "./spec";

// The few Playwright calls the grader makes, typed here so the package's types do not need Playwright's.
interface PwPage {
  goto(url: string, o?: object): Promise<unknown>;
  evaluate<T>(fn: string): Promise<T>;
  addInitScript(script: string): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  waitForSelector(sel: string, o?: object): Promise<unknown>;
  screenshot(o?: object): Promise<Buffer>;
  keyboard: { press(key: string): Promise<void> };
  mouse: { move(x: number, y: number): Promise<void> };
  on(event: "pageerror", fn: (e: Error) => void): void;
}
interface PwSession {
  send<T = unknown>(method: string, params?: object): Promise<T>;
}
interface PwContext {
  newPage(): Promise<PwPage>;
  newCDPSession(page: PwPage): Promise<PwSession>;
  close(): Promise<void>;
}
interface PwBrowser {
  newContext(o: object): Promise<PwContext>;
  close(): Promise<void>;
}
interface Pw {
  chromium: { launch(o?: object): Promise<PwBrowser> };
}

/** Imports Playwright from the consumer's node_modules; the specifier is a variable so bundlers leave it alone. */
export async function loadPlaywright(): Promise<Pw> {
  for (const name of ["playwright", "@playwright/test"]) {
    try {
      const mod = (await import(/* @vite-ignore */ name)) as Pw & { default?: Pw };
      const pw = mod.chromium ? mod : mod.default;
      if (pw?.chromium) return pw;
    } catch {
      // try the next one
    }
  }
  throw new Error("uipack-grade needs Playwright: npm i -D playwright && npx playwright install chromium");
}

/** Runs a measuring function in the page. Passed as source so a build's helper wrappers (esbuild's __name) cannot break it. */
const inPage = <T>(page: PwPage, fn: (...a: never[]) => unknown, ...args: unknown[]) =>
  page.evaluate<T>(
    `(() => { const __name = (f) => f; return (${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(", ")}); })()`,
  );

export function withQuery(url: string, query: Record<string, string> = {}) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
  return u.toString();
}

async function settle(page: PwPage, viewport: Viewport, spec: SiteSpec) {
  // Scroll to the bottom and back so lazy sections mount and scroll-triggered parts reach their end state.
  let height = await page.evaluate<number>("document.documentElement.scrollHeight");
  for (let y = 0; y < height; y += Math.round(viewport.height * 0.8)) {
    await page.evaluate(`window.scrollTo(0, ${y})`);
    await page.waitForTimeout(120);
    height = await page.evaluate<number>("document.documentElement.scrollHeight");
    if (y > 60000) break;
  }
  await page.evaluate("window.scrollTo(0, 0)");
  await page.evaluate("document.fonts && document.fonts.ready.then(() => true)");
  await page.evaluate("new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))");
  await page.waitForTimeout(spec.ready.settleMs);
}

async function platformFonts(context: PwContext, page: PwPage): Promise<PlatformFontUse[] | null> {
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send<{ root: { nodeId: number } }>("DOM.getDocument", { depth: 0 });
    const { nodeIds } = await cdp.send<{ nodeIds: number[] }>("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: "[data-uipack-grade-font]",
    });
    const meta = await page.evaluate<
      { i: number; selector: string; text: string; box: Box }[]
    >(`[...document.querySelectorAll("[data-uipack-grade-font]")].map((el) => {
      const r = el.getBoundingClientRect();
      const name = el.tagName.toLowerCase() + [...el.classList].slice(0, 3).map((c) => "." + c).join("");
      return { i: Number(el.getAttribute("data-uipack-grade-font")), selector: name, text: (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 60),
        box: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) } };
    })`);
    const out: PlatformFontUse[] = [];
    for (const [k, nodeId] of nodeIds.entries()) {
      const { fonts } = await cdp.send<{ fonts: PlatformFontUse["fonts"] }>("CSS.getPlatformFontsForNode", { nodeId });
      if (meta[k]) out.push({ ...meta[k], fonts });
    }
    return out;
  } catch {
    return null;
  }
}

/** Fills in `sampled` for text over an image or gradient: one full-page shot with that text hidden. */
async function sampleBackgrounds(page: PwPage, m: Measurements) {
  const marked = m.texts.filter((t) => t.contrastable && !t.disabled && t.color && !t.layers);
  if (!marked.length) return;
  await page.evaluate(`(() => { const s = document.createElement("style"); s.id = "uipack-grade-hide";
    s.textContent = "[data-uipack-grade-bg] { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }";
    document.head.append(s); })()`);
  try {
    const bmp = decodePng(await page.screenshot({ fullPage: true, animations: "allow" }));
    for (const t of marked) {
      const bg = sampleBackground(bmp, t.box);
      if (bg) t.sampled = bg;
    }
  } catch {
    // a page too tall to shoot whole keeps these unmeasured
  } finally {
    await page.evaluate(`document.getElementById("uipack-grade-hide")?.remove()`);
  }
}

/**
 * Of the overlaps found from line boxes, the ones a reader sees: hiding either text changes the
 * pixels where they meet. Text under an opaque window stacked above it changes nothing, so it is
 * occluded, not overlapping. Checks at most 60 pairs; the rest count as seen.
 */
async function seenOverlaps(page: PwPage, pairs: [number, number, Box][]): Promise<[number, number][]> {
  const out: [number, number][] = [];
  const shot = async (b: Box) =>
    decodePng(
      await page.screenshot({
        fullPage: true,
        clip: { x: b.x, y: b.y, width: Math.max(2, b.w), height: Math.max(2, b.h) },
        animations: "allow",
      }),
    );
  const hide = (i: number, on: boolean) =>
    page.evaluate(`(() => { const el = document.querySelector('[data-uipack-grade-t="${i}"]'); if (!el) return;
      if (${on}) { el.style.setProperty("color", "transparent", "important"); el.style.setProperty("-webkit-text-fill-color", "transparent", "important"); el.style.setProperty("text-shadow", "none", "important"); }
      else { el.style.removeProperty("color"); el.style.removeProperty("-webkit-text-fill-color"); el.style.removeProperty("text-shadow"); } })()`);
  for (const [k, [a, b, box]] of pairs.entries()) {
    if (k >= 60) {
      out.push([a, b]);
      continue;
    }
    try {
      const base = await shot(box);
      const drawn: boolean[] = [];
      for (const i of [a, b]) {
        await hide(i, true);
        drawn.push(diffBitmaps(base, await shot(box), 24) !== null);
        await hide(i, false);
      }
      if (drawn.every(Boolean)) out.push([a, b]);
    } catch {
      // The shared box is off the page (outside the document's width): nobody sees it.
    }
  }
  return out;
}

async function frameDiff(page: PwPage): Promise<Extras["frameDiff"]> {
  const a = decodePng(await page.screenshot({ animations: "allow", caret: "initial" }));
  await page.waitForTimeout(1000);
  const b = decodePng(await page.screenshot({ animations: "allow", caret: "initial" }));
  const d = diffBitmaps(a, b);
  if (!d) return null;
  const sy = await page.evaluate<number>("scrollY");
  return { ...d, box: { ...d.box, y: d.box.y + sy } };
}

/**
 * Tabs through the page, reading each focused control. A failing one is cropped while it holds
 * focus (a ring cut by a scrolling sidebar is gone once focus moves on). `crops` is [dir, prefix].
 */
async function focusWalk(
  page: PwPage,
  spec: SiteSpec,
  crops?: [string, string],
): Promise<{ samples: FocusSample[]; misses: number }> {
  const samples: FocusSample[] = [];
  let cropped = 0;
  const seen = new Set<string>();
  let misses = 0;
  await page.evaluate(
    "window.scrollTo(0, 0); document.activeElement && document.activeElement.blur && document.activeElement.blur()",
  );
  for (let i = 0; i < spec.maxTabs; i++) {
    await page.keyboard.press("Tab");
    const s = await inPage<FocusSample | null>(
      page,
      measureFocus,
      [...spec.ignore, ...(spec.ignoreByCheck["focus-visible"] ?? [])].join(", "),
    );
    if (!s) {
      if (++misses > 2) break;
      continue;
    }
    const key = `${s.selector}@${s.box.x},${s.box.y}`;
    if (seen.has(key)) break; // focus came round again
    seen.add(key);
    if (crops && (!s.indicator || s.clippedBy) && cropped < spec.maxCrops) {
      const sy = await page.evaluate<number>("scrollY");
      const sx = await page.evaluate<number>("scrollX");
      const rel = `crops/${crops[1]}-focus-visible-${++cropped}.png`;
      try {
        const pad = 12;
        writeFileSync(
          join(crops[0], rel),
          await page.screenshot({
            clip: {
              x: Math.max(0, s.box.x - sx - pad),
              y: Math.max(0, s.box.y - sy - pad),
              width: s.box.w + pad * 2,
              height: s.box.h + pad * 2,
            },
            animations: "allow",
          }),
        );
        s.crop = rel;
      } catch {
        cropped--;
      }
    }
    samples.push(s);
  }
  return { samples, misses };
}

async function crop(page: PwPage, box: Box, docHeight: number, docWidth: number, file: string): Promise<boolean> {
  const pad = 8;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  const w = Math.min(box.w + pad * 2, 1600, docWidth - x);
  const h = Math.min(box.h + pad * 2, 1200, docHeight - y);
  if (w < 2 || h < 2) return false;
  try {
    writeFileSync(file, await page.screenshot({ fullPage: true, clip: { x, y, width: w, height: h }, animations: "allow" }));
    return true;
  } catch {
    return false;
  }
}

export interface GradeOptions {
  /** Where report.json, summary.md, shots/ and crops/ go; nothing is written when omitted. */
  outDir?: string;
  /** Themes to grade (default both). */
  themes?: ("light" | "dark")[];
  /** Viewport names to grade (default every spec viewport). */
  views?: string[];
  /** Full-page screenshots per view (default true when outDir is set). */
  screenshots?: boolean;
  /** Progress lines (default silent). */
  log?: (line: string) => void;
}

/** Grades one URL against a resolved spec. Resolves with the report; never throws for a failing page. */
export async function gradeUrl(url: string, spec: SiteSpec, opts: GradeOptions = {}): Promise<GradeReport> {
  const started = Date.now();
  const log = opts.log ?? (() => {});
  const out = opts.outDir;
  const shots = out && opts.screenshots !== false;
  if (out) {
    mkdirSync(join(out, "crops"), { recursive: true });
    if (shots) mkdirSync(join(out, "shots"), { recursive: true });
  }
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  const views: ViewReport[] = [];
  let title = "";
  const lightColour = new Map<string, string>();
  try {
    for (const viewport of spec.viewports.filter((v) => !opts.views || opts.views.includes(v.name))) {
      for (const theme of opts.themes ?? (["light", "dark"] as const)) {
        const name = `${viewport.name}-${theme}`;
        log(`grading ${name}`);
        const setup: ThemeSetup = spec.themes[theme];
        const touch = !!viewport.touch;
        const view: ViewReport = {
          view: name,
          viewport: { width: viewport.width, height: viewport.height, touch },
          theme,
          themeApplied: true,
          bodyBackground: "",
          checks: [],
          errors: [],
        };
        views.push(view);
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          isMobile: touch,
          hasTouch: touch,
          colorScheme: setup.colorScheme,
          reducedMotion: "reduce",
        });
        try {
          const page = await context.newPage();
          page.on("pageerror", (e) => view.errors.length < 5 && view.errors.push(`page error: ${e.message.slice(0, 160)}`));
          const init = `(() => { const d = document.documentElement; for (const [k, v] of Object.entries(${JSON.stringify(setup.htmlAttributes ?? {})})) d.setAttribute(k, v);
            try { for (const [k, v] of Object.entries(${JSON.stringify(setup.localStorage ?? {})})) localStorage.setItem(k, v); } catch (e) {} })()`;
          await page.addInitScript(init);
          await page.goto(withQuery(url, setup.query), { waitUntil: "load", timeout: 60_000 });
          try {
            if (spec.ready.selector) await page.waitForSelector(spec.ready.selector, { state: "visible", timeout: 20_000 });
            if (spec.ready.gone) await page.waitForSelector(spec.ready.gone, { state: "detached", timeout: 20_000 });
          } catch {
            view.errors.push(
              `ready condition not met within 20s (${spec.ready.selector ?? ""} ${spec.ready.gone ?? ""}); graded as rendered`,
            );
          }
          await page.mouse.move(0, 0);
          await settle(page, viewport, spec);
          const varFaces = await page.evaluate<string[]>(
            `(${JSON.stringify(spec.faceVars)}).map((v) => getComputedStyle(document.body).getPropertyValue(v)).filter(Boolean)`,
          );
          const m = await inPage<Measurements>(page, measurePage, {
            scope: spec.scope,
            ignore: spec.ignore,
            ignoreByCheck: spec.ignoreByCheck,
            floors: spec.textFloors.map((f) => f.selector),
            cardMinHeight: spec.cardMinHeightPx,
            maxFontSamples: 400,
          });
          title = title || m.title;
          const colour = await page.evaluate<string>(
            "getComputedStyle(document.documentElement).backgroundColor + ' ' + getComputedStyle(document.body).backgroundColor",
          );
          view.bodyBackground = m.bodyBackground;
          if (theme === "light") lightColour.set(viewport.name, colour);
          else view.themeApplied = lightColour.get(viewport.name) !== colour;
          await sampleBackgrounds(page, m);
          const visibleOverlaps = await seenOverlaps(page, findOverlaps(m.lines));
          const fonts = await platformFonts(context, page);
          const motion = await inPage<MotionSample[]>(
            page,
            measureMotion,
            [...spec.ignore, ...(spec.ignoreByCheck["reduced-motion"] ?? [])].join(", "),
          );
          const frames = spec.skip["reduced-motion"] ? null : await frameDiff(page);
          if (shots) {
            try {
              writeFileSync(join(out!, "shots", `${name}.png`), await page.screenshot({ fullPage: true, animations: "allow" }));
              view.screenshot = `shots/${name}.png`;
            } catch (e) {
              view.errors.push(`full-page screenshot failed: ${String(e).slice(0, 120)}`);
            }
          }
          const focus = spec.skip["focus-visible"]
            ? { samples: [], misses: 0 }
            : await focusWalk(page, spec, out ? [out, name] : undefined);
          view.checks = evaluateView(
            m,
            {
              platformFonts: fonts,
              focus: focus.samples,
              focusMisses: focus.misses,
              motion,
              frameDiff: frames,
              touch,
              visibleOverlaps,
            },
            spec,
            varFaces.map(firstFamily),
          );
          if (out)
            for (const check of view.checks) {
              let n = 0;
              for (const f of check.findings) {
                if (f.crop || n >= spec.maxCrops || !f.box) continue;
                const rel = `crops/${name}-${check.id}-${n + 1}.png`;
                if (await crop(page, f.box, m.docHeight, m.scrollWidth, join(out, rel))) {
                  f.crop = rel;
                  n++;
                }
              }
            }
        } catch (e) {
          view.errors.push(`could not grade this view: ${String(e).slice(0, 300)}`);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  const report: GradeReport = {
    tool: "uipack-grade",
    reportVersion: REPORT_VERSION,
    url,
    title,
    spec: spec.name,
    startedAt: new Date(started).toISOString(),
    durationMs: Date.now() - started,
    ...summarise(views),
    views,
  };
  if (out) {
    writeFileSync(join(out, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(join(out, "summary.md"), toMarkdown(report));
  }
  return report;
}
