import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lightDark } from "../scripts/style-contract";
import { contrast, readStyle, resolveColor, type Theme } from "./style-values";

// The docs site's own values (docs/specs/docs-site.md, playground/site-palette.css) over
// Technical's: light must stay Technical's exactly, dark is the site's charcoal, and every text
// role and navigation hue must read on every surface it sits on.
const css = readFileSync("playground/site-palette.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const site: Record<string, string> = {};
for (const m of css.matchAll(/--(ui|site)-([a-z0-9-]+):\s*([^;]+);/g)) site[`${m[1]}:${m[2]}`] = m[3].replace(/\s+/g, " ").trim();
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
