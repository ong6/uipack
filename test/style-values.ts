// Reads the style value sets in src/styles and resolves colour roles to RGBA, so tests can check
// contrast and completeness without a browser. Understands what the value files use: hex,
// rgb()/rgba(), light-dark(), color-mix(in srgb, A p%, B | transparent) and var() to roles in
// the same block (or the paper the colour sits on, for mixes with transparent).
import { readFileSync } from "node:fs";

export type RGBA = [number, number, number, number];
export type Theme = "light" | "dark";

export const STYLE_FILES = {
  technical: "src/styles/technical.css",
  landing: "src/styles/landing.css",
  graphical: "src/styles/graphical.css",
} as const;
export type StyleId = keyof typeof STYLE_FILES;

/** Roles every style must define (docs/system/style.md, "The role contract"). */
export const CORE_ROLES = [
  "paper",
  "surface",
  "surface-raised",
  "surface-2",
  "ink",
  "ink-2",
  "ink-3",
  "line",
  "line-soft",
  "accent",
  "on-accent",
  "accent-surface",
  "accent-ink-2",
  "accent-line",
  "flow-request",
  "flow-response",
  "flow-change",
  "data-pos",
  "data-neg",
  "data-context",
  "data-1",
  "data-2",
  "data-3",
  "data-4",
  "on-data-1",
  "on-data-2",
  "on-data-3",
  "on-data-4",
  "inv-paper",
  "inv-surface",
  "inv-ink",
  "inv-ink-2",
  "inv-line",
  "inv-accent",
  "font-text",
  "font-label",
  "font-display",
  "display-weight",
  "display-tracking",
  "display-case",
  "label-tracking",
  "radius",
  "radius-sm",
  "radius-xs",
  "radius-pill",
  "stroke",
  "rule-width",
  "density",
  "type-ratio",
  "measure",
  "ease-settle",
  "ease-travel",
  "dur-quick",
  "dur-base",
  "dur-slow",
  // Ornament slots
  "backdrop",
  "backdrop-mask",
  "frame-border",
  "frame-shadow",
  "card-shadow",
  "marker-size",
  "marker-shape",
  "marker-color",
  "section-rule",
  "nav-fill",
  "nav-blur",
  "grain",
  "glow",
  "cta-shadow",
  "cta-shadow-hover",
  "display-scale",
  "em-style",
  "em-color",
  "star-fill",
] as const;

/** The custom properties a style file declares, name (without --ui-) to raw value. */
export function readStyle(id: StyleId): Record<string, string> {
  const css = readFileSync(STYLE_FILES[id], "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/--ui-([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].replace(/\s+/g, " ").trim();
  return out;
}

/** Split on top-level commas. */
function args(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const inner = (s: string, fn: string) => s.slice(fn.length + 1, s.lastIndexOf(")"));

export function hexToRgba(h: string): RGBA {
  let x = h.slice(1);
  if (x.length === 3) x = [...x].map((c) => c + c).join("");
  const n = parseInt(x.slice(0, 6), 16);
  const a = x.length === 8 ? parseInt(x.slice(6), 16) / 255 : 1;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

/** Resolve a colour value for one theme. `vars` is the style's declarations. */
export function resolveColor(value: string, theme: Theme, vars: Record<string, string>, depth = 0): RGBA {
  if (depth > 20) throw new Error(`cycle resolving ${value}`);
  const v = value.trim();
  if (v.startsWith("#")) return hexToRgba(v);
  if (v === "transparent") return [0, 0, 0, 0];
  if (v === "white") return [255, 255, 255, 1];
  if (v === "black") return [0, 0, 0, 1];
  if (v.startsWith("light-dark(")) {
    const [l, d] = args(inner(v, "light-dark"));
    return resolveColor(theme === "light" ? l : d, theme, vars, depth + 1);
  }
  if (v.startsWith("var(")) {
    const [name, fallback] = args(inner(v, "var"));
    const key = name.replace(/^--ui-/, "");
    if (key in vars) return resolveColor(vars[key], theme, vars, depth + 1);
    if (fallback) return resolveColor(fallback, theme, vars, depth + 1);
    throw new Error(`unresolved ${name}`);
  }
  if (v.startsWith("rgb")) {
    const body = v.slice(v.indexOf("(") + 1, v.lastIndexOf(")"));
    const [rgb, alpha] = body.split("/");
    const parts = rgb
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    const a = alpha !== undefined ? Number(alpha) : (parts[3] ?? 1);
    return [parts[0], parts[1], parts[2], a];
  }
  if (v.startsWith("color-mix(")) {
    const [space, a, b] = args(inner(v, "color-mix"));
    if (space !== "in srgb") throw new Error(`unsupported mix space ${space}`);
    const split = (s: string) => {
      const m = s.match(/^(.*?)\s+([\d.]+)%$/);
      return m ? { c: m[1], p: Number(m[2]) / 100 } : { c: s, p: undefined };
    };
    const A = split(a);
    const B = split(b);
    const pa = A.p ?? (B.p !== undefined ? 1 - B.p : 0.5);
    const ca = resolveColor(A.c, theme, vars, depth + 1);
    const cb = resolveColor(B.c, theme, vars, depth + 1);
    // Premultiplied interpolation, as browsers do.
    const alpha = ca[3] * pa + cb[3] * (1 - pa);
    if (alpha === 0) return [0, 0, 0, 0];
    const ch = (i: number) => (ca[i] * ca[3] * pa + cb[i] * cb[3] * (1 - pa)) / alpha;
    return [ch(0), ch(1), ch(2), alpha];
  }
  throw new Error(`unsupported colour ${v}`);
}

/** A colour composited over an opaque base. */
export function over(top: RGBA, base: RGBA): RGBA {
  const a = top[3];
  return [top[0] * a + base[0] * (1 - a), top[1] * a + base[1] * (1 - a), top[2] * a + base[2] * (1 - a), 1];
}

const lum = ([r, g, b]: RGBA) => {
  const c = (x: number) => ((x /= 255) <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};

/** WCAG contrast ratio of `fg` (composited over `bg`) against `bg`. */
export function contrast(fg: RGBA, bg: RGBA): number {
  const a = lum(over(fg, bg));
  const b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** A role resolved for a theme; base roles are opaque by contract. */
export function role(id: StyleId, name: string, theme: Theme): RGBA {
  const vars = readStyle(id);
  return resolveColor(vars[name], theme, vars);
}
