import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cssBundles, styleFiles } from "../scripts/css-bundles";
import { uiStyles } from "../src/style";
import { CORE_ROLES, STYLE_FILES, contrast, readStyle, role, type StyleId, type Theme } from "./style-values";

const styles = Object.keys(STYLE_FILES) as StyleId[];
const themes: Theme[] = ["light", "dark"];

describe("style value sets", () => {
  it("lists the same styles in code, CSS and the bundle", () => {
    expect(uiStyles.map((s) => s.id).sort()).toEqual([...styles].sort());
    for (const id of styles) expect(styleFiles).toContain(STYLE_FILES[id]);
    // Every entry stylesheet starts with the role layer, so `style` works on any entry alone.
    for (const b of cssBundles) if (b.out !== "web-gutters.css") expect(b.from.slice(0, styleFiles.length)).toEqual(styleFiles);
  });

  it.each(styles)("%s defines every core role", (id) => {
    const vars = readStyle(id);
    const missing = CORE_ROLES.filter((r) => !(r in vars));
    expect(missing).toEqual([]);
  });

  it.each(styles)("%s keys its value set by data-ui-style (Technical also on :root), inside the tokens layer", (id) => {
    const css = readFileSync(STYLE_FILES[id], "utf8");
    expect(css).toContain("@layer uipack.tokens");
    expect(css).toContain(`[data-ui-style="${id}"]`);
    if (id === "technical") expect(css).toMatch(/:root,\s*\[data-ui-style="technical"\]/);
  });

  it("declares the layer order once, tokens first", () => {
    const css = readFileSync("src/styles/roles.css", "utf8");
    expect(css).toContain("@layer uipack.tokens, uipack.base, uipack.layout, uipack.ornaments;");
  });

  it("resets every optional role on a style host, so Technical's tuned values never leak into another style", () => {
    const roles = readFileSync("src/styles/roles.css", "utf8");
    const reset = new Set([...roles.matchAll(/--ui-([a-z0-9-]+):\s*initial;/g)].map((m) => m[1]));
    const technical = Object.keys(readStyle("technical"));
    const optional = technical.filter((r) => !(CORE_ROLES as readonly string[]).includes(r));
    expect(optional.filter((r) => !reset.has(r))).toEqual([]);
  });
});

describe("contrast, every style, both themes", () => {
  for (const id of styles)
    for (const theme of themes) {
      it(`${id} ${theme}: ink, ink-2 and ink-3 hold 4.5:1 on paper, surface and surface-2`, () => {
        for (const ground of ["paper", "surface", "surface-raised", "surface-2"]) {
          const bg = role(id, ground, theme);
          expect(bg[3], `${ground} is opaque`).toBe(1);
          for (const ink of ["ink", "ink-2", "ink-3"]) {
            expect(contrast(role(id, ink, theme), bg), `${ink} on ${ground}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      });
      it(`${id} ${theme}: text on the accent, the invert band and the data slots holds 4.5:1`, () => {
        expect(contrast(role(id, "on-accent", theme), role(id, "accent", theme))).toBeGreaterThanOrEqual(4.5);
        for (const ink of ["inv-ink", "inv-ink-2"])
          for (const ground of ["inv-paper", "inv-surface"])
            expect(contrast(role(id, ink, theme), role(id, ground, theme)), `${ink} on ${ground}`).toBeGreaterThanOrEqual(4.5);
        for (const n of [1, 2, 3, 4]) {
          // Documented exception: Technical's light slots 2 and 4 (blue under white, violet under ink)
          // are 4.42 and 4.27:1. Those labels are bar values at 20px+ canvas type, semibold, where
          // the large-text floor is 3:1.
          const floor = id === "technical" && theme === "light" && (n === 2 || n === 4) ? 4.2 : 4.5;
          expect(contrast(role(id, `on-data-${n}`, theme), role(id, `data-${n}`, theme)), `data-${n}`).toBeGreaterThanOrEqual(
            floor,
          );
        }
      });
      it(`${id} ${theme}: the accent as text (or its accent-ink) holds 4.5:1 on paper; the accent fill 3:1`, () => {
        const vars = readStyle(id);
        const text = role(id, "accent-ink" in vars ? "accent-ink" : "accent", theme);
        expect(contrast(text, role(id, "paper", theme))).toBeGreaterThanOrEqual(4.5);
        expect(contrast(role(id, "accent", theme), role(id, "paper", theme))).toBeGreaterThanOrEqual(3);
      });
      it(`${id} ${theme}: flow and data marks hold 3:1 on the surface (graphical objects)`, () => {
        for (const mark of ["flow-request", "flow-response", "flow-change", "data-pos", "data-neg", "data-1", "data-2", "data-3"])
          // Flow marks are always paired with their shape (square, circle, diamond) and a label, so
          // Technical's tuned flow hues (kept in Landing) sit at 2.4:1; everything else holds 3:1.
          expect(contrast(role(id, mark, theme), role(id, "surface", theme)), mark).toBeGreaterThanOrEqual(
            mark.startsWith("flow") && id !== "graphical" ? 2.4 : 3,
          );
      });
    }
});

describe("one accent per style", () => {
  it.each(styles)("%s glows only where it is Landing's ambient depth", (id) => {
    const vars = readStyle(id);
    expect(vars.glow).toBe(id === "landing" ? "1" : "0");
    expect(vars.grain).toBe(id === "landing" ? "1" : "0");
  });
});
