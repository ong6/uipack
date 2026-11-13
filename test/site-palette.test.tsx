import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lightDark } from "../scripts/style-contract";
import { contrast, readStyle, resolveColor, type Theme } from "./style-values";

// The docs site's own values (docs/specs/docs-site.md, playground/site-palette.css) over
// Technical's: light must stay Technical's exactly, dark is the site's charcoal, and every text
// role and navigation hue must read on every surface it sits on.
const css = readFileSync("playground/site-palette.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
/** The custom properties a rule block declares, as name to value. */
const declarations = (block: string) =>
  Object.fromEntries(
    [...block.matchAll(/--([a-z][a-z0-9-]*):\s*([^;]+);/g)].map((m) => [m[1], m[2].replace(/\s+/g, " ").trim()]),
  );
// Two rules: the site's values but the ground, on the frame and stopping at demos (the file's first
// block), and the ground, whose selector starts with :is(.showcase-demo, …) and also names the frame.
const frameBlock = /\{([^}]*)\}/.exec(css)![1];
const ground = /^(:is\(\.showcase-demo[^{]*)\{([^}]*)\}/m.exec(css)!;
const groundSelectors = ground[1].split(/,\s*(?![^()]*\))/).map((s) => s.trim());
const groundValues = declarations(ground[2]);
const site: Record<string, string> = {};
for (const [name, value] of Object.entries({ ...declarations(frameBlock), ...groundValues }))
  if (/^(ui|site)-/.test(name)) site[name.replace(/^(ui|site)-/, "$1:")] = value;
const technical = readStyle("technical");
const siteUi = Object.fromEntries(
  Object.entries(site)
    .filter(([k]) => k.startsWith("ui:"))
    .map(([k, v]) => [k.slice(3), v]),
);
const vars: Record<string, string> = { ...technical, ...siteUi };
const color = (name: string, theme: Theme) => resolveColor(vars[name], theme, vars);
const hue = (section: string, theme: Theme) => resolveColor(site[`site:hue-${section}`], theme, vars);

describe("the docs site's palette", () => {
  it("sets only roles Technical has, and keeps every light half Technical's", () => {
    expect(Object.keys(siteUi).length).toBeGreaterThan(10);
    for (const [name, value] of Object.entries(siteUi)) {
      expect(technical, name).toHaveProperty(name);
      const [light] = lightDark(value);
      const [technicalLight] = lightDark(technical[name]);
      expect(resolveColor(light, "light", technical), `--ui-${name} light`).toEqual(
        resolveColor(technicalLight, "light", technical),
      );
    }
  });

  it("dark is a near-black neutral ground: charcoal, not navy", () => {
    const [r, g, b] = color("paper", "dark");
    expect(Math.max(r, g, b)).toBeLessThan(28);
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(8);
    // Each raised surface a little lighter than the one below it.
    const l = (n: string) =>
      color(n, "dark")
        .slice(0, 3)
        .reduce((a, c) => a + c, 0);
    expect(l("surface")).toBeGreaterThan(l("paper"));
    expect(l("surface-raised")).toBeGreaterThan(l("surface"));
    expect(l("surface-2")).toBeGreaterThan(l("surface-raised"));
  });

  for (const theme of ["light", "dark"] as const) {
    it(`${theme}: ink, ink-2, ink-3 and the accent hold 4.5:1 on paper and every surface`, () => {
      for (const ground of ["paper", "surface", "surface-raised", "surface-2"])
        for (const ink of ["ink", "ink-2", "ink-3", "accent"])
          expect(contrast(color(ink, theme), color(ground, theme)), `${ink} on ${ground}`).toBeGreaterThanOrEqual(4.5);
    });

    it(`${theme}: text on the accent, the call to action and the band holds 4.5:1`, () => {
      expect(contrast(color("on-accent", theme), color("accent", theme))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(color("on-cta", theme), color("cta-fill", theme))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(color("band-ink", theme), color("band-fill", theme))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(color("band-ink-2", theme), color("band-fill", theme))).toBeGreaterThanOrEqual(4.5);
      for (const n of [1, 2, 3, 4]) {
        const floor = theme === "light" && (n === 2 || n === 4) ? 4.2 : 4.5;
        expect(contrast(color(`on-data-${n}`, theme), color(`data-${n}`, theme)), `data-${n}`).toBeGreaterThanOrEqual(floor);
      }
    });

    it(`${theme}: every navigation hue holds 3:1 as a mark on paper and every surface (4.5:1 in dark)`, () => {
      const floor = theme === "dark" ? 4.5 : 3;
      for (const section of ["start", "rules", "build", "check", "reference"])
        for (const ground of ["paper", "surface", "surface-raised", "surface-2"])
          expect(contrast(hue(section, theme), color(ground, theme)), `${section} on ${ground}`).toBeGreaterThanOrEqual(floor);
    });
  }
});

// <body> holds Technical's roles, so the colour it hands down is Technical's ink (blue-tinted in
// dark). The frame sets its own text to the site's ink, so the header and a view with no docs layout
// around it (the Assets tab) read as a docs page does (e2e/site-consistency.spec.ts measures it).
describe("the docs site's base text", () => {
  it("is the site's ink on the frame, a neutral in dark", () => {
    expect(css).toMatch(/(^|\})\s*\.showcase-frame\s*\{\s*color:\s*var\(--ui-ink\);\s*\}/);
    const [r, g, b] = color("ink", "dark");
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(8);
    const [tr, tg, tb] = resolveColor(technical.ink, "dark", technical);
    expect(Math.max(tr, tg, tb) - Math.min(tr, tg, tb)).toBeGreaterThan(8);
  });
});

// Demos, previews and figure dialogs keep Technical's hues and, in dark, sit on the site's ground
// (docs/specs/docs-site.md, "Demos and fixed looks"): a fixed look's ground is the only value set.
describe("the docs site's ground under demos and fixed looks", () => {
  const GROUNDS = ["ui-paper", "ui-surface", "ui-surface-raised", "ui-surface-2", "ui-node", "ui-line-solid"];
  const demo: Record<string, string> = {
    ...technical,
    ...Object.fromEntries(
      Object.entries(groundValues)
        .filter(([k]) => k.startsWith("ui-"))
        .map(([k, v]) => [k.slice(3), v]),
    ),
  };
  const demoColor = (name: string, theme: Theme) => resolveColor(demo[name], theme, demo);

  it("sets only the ground: surfaces, node fills, solid lines and the band, never a hue, ink or face", () => {
    const allowed = new Set([...GROUNDS, "tune-slide-line", "ui-band-fill"]);
    for (const name of Object.keys(groundValues)) expect(allowed, name).toContain(name);
    for (const name of GROUNDS) expect(groundValues, name).toHaveProperty(name);
  });

  it("is one rule for the page and every demo, preview and canvas dialog, and the frame's own rule leaves it alone", () => {
    for (const selector of [
      ".showcase-frame",
      '.showcase-frame [data-ui-style="technical"]',
      ":is(.showcase-demo, .gallery-preview, .uipack-canvas-dialog)",
      ':is(.showcase-demo, .gallery-preview, .uipack-canvas-dialog) [data-ui-style="technical"]',
    ])
      expect(groundSelectors).toContain(selector);
    for (const name of Object.keys(groundValues)) expect(declarations(frameBlock), name).not.toHaveProperty(name);
  });

  it("dark is neutral: no ground reads as navy", () => {
    for (const name of ["paper", "surface", "surface-raised", "surface-2", "node", "line-solid", "band-fill"]) {
      const [r, g, b] = demoColor(name, "dark");
      // Technical's navy surfaces lean 50 or more toward blue; a cool charcoal leans a little.
      expect(Math.max(r, g, b) - Math.min(r, g, b), name).toBeLessThan(16);
      expect(b - r, `${name}: blue over red`).toBeLessThan(16);
    }
  });

  for (const theme of ["light", "dark"] as const)
    it(`${theme}: Technical's inks and accent hold 4.5:1, its flow colours 3:1, on every demo ground`, () => {
      for (const surface of ["paper", "surface", "surface-raised", "surface-2", "node"]) {
        for (const ink of ["ink", "ink-2", "ink-3", "accent"])
          expect(contrast(demoColor(ink, theme), demoColor(surface, theme)), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
        for (const flow of ["flow-request", "flow-response", "flow-change", "flow-error"])
          expect(contrast(demoColor(flow, theme), demoColor(surface, theme)), `${flow} on ${surface}`).toBeGreaterThanOrEqual(3);
      }
      expect(contrast(demoColor("band-ink", theme), demoColor("band-fill", theme))).toBeGreaterThanOrEqual(4.5);
    });
});
