// The role contract as data, for the code that checks style files and site specs. Plain Node, no
// imports: scripts/check-spec.ts runs it from another repo too.

/**
 * Roles every style, and so every site spec, must define (docs/system/style.md, "The role contract").
 * test/style-roles.test.tsx checks each style file sets them; scripts/check-spec.ts checks each spec
 * gives them a value or a TODO.
 */
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
  "inv-node",
  "node",
  "line-solid",
  "accent-ink",
  "data-neg-ink",
  "alert",
  "warn",
  "slide-font-text",
  "slide-font-label",
  "slide-font-display",
  "web-font-text",
  "web-font-label",
  "web-font-display",
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
  // Added with Technical's Cyanotype values (2026-11-05)
  "accent-stroke",
  "flow-error",
  "font-heading",
  "canvas-pattern",
  "cta-fill",
  "on-cta",
  "em-decoration",
  "num-ring",
] as const;

/** Split a CSS value on top-level commas. */
export function splitArgs(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of value) {
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

/** A value's light and dark halves: the two arguments of a top-level `light-dark()`, else the value twice. */
export function lightDark(value: string): [string, string] {
  const v = value.trim();
  if (v.startsWith("light-dark(") && v.endsWith(")")) {
    const parts = splitArgs(v.slice("light-dark(".length, -1));
    if (parts.length === 2) return [parts[0], parts[1]];
  }
  return [v, v];
}

/** The `--ui-*` declarations in a style file's CSS, name (without `--ui-`) to its value, in file order. */
export function parseValueSet(css: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/--ui-([a-z0-9-]+):\s*([^;]+);/g))
    out.set(m[1], m[2].replace(/\s+/g, " ").trim());
  return out;
}
