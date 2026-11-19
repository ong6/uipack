// Static export's palettes: Technical's light and dark literals, a diagram theme's half, the older
// palette forms, and the var() inliner. Kept out of the uipack/static entry; renderStatic uses them.
import { technicalFonts, technicalValues, type TechnicalColors } from "../styles/technical-values";
import { diagramColors, isDiagramTheme, type DiagramMode, type DiagramThemeInput } from "../diagram-theme";
import type { LegacyPalette, Palette, StaticOptions } from "./index";

const paletteOf = (c: TechnicalColors): Palette => ({
  fg: c.ink,
  muted: c["ink-2"],
  bg: c.surface,
  surface: c["surface-raised"],
  "surface-raised": c["surface-2"],
  grid: c["line-soft"],
  border: c.line,
  accent: c.accent,
  "accent-ink": c.accent,
  "token-request": c["flow-request"],
  "token-response": c["flow-response"],
  "token-change": c["flow-change"],
  "token-error": c["flow-error"],
  mono: technicalFonts.mono,
  sans: technicalFonts.sans,
});

/** Technical's light and dark values (src/styles/technical-values.ts, the mirror of technical.css). */
export const LIGHT: Palette = paletteOf(technicalValues.light);

export const DARK: Palette = paletteOf(technicalValues.dark);

/** A diagram theme's half as a palette. Faces that are not literal stacks (a `var()`) fall back to Technical's. */
export function themePalette(theme: DiagramThemeInput, mode: DiagramMode = "light"): Palette {
  const c = diagramColors(theme, mode);
  const face = (v: string | undefined, fallback: string) => (v && !v.includes("var(") ? v : fallback);
  return {
    fg: c.ink,
    muted: c["ink-2"],
    bg: c.surface,
    surface: c["surface-raised"],
    "surface-raised": c["surface-2"],
    grid: c["line-soft"],
    border: c.line,
    accent: c.accent,
    "accent-ink": c["accent-ink"],
    "token-request": c["flow-request"],
    "token-response": c["flow-response"],
    "token-change": c["flow-change"],
    "token-error": c["flow-error"],
    mono: face(theme.fonts?.label, technicalFonts.mono),
    sans: face(theme.fonts?.text, technicalFonts.sans),
  };
}

/**
 * A palette plus the chip washes (`Chip`'s fill-opacity). Light leaves them unset, so the chip's own
 * fallbacks (0.55, soft 0.2) apply as they do live; dark sets the 28% and 12% washes theme.css and a
 * diagram theme's dark rule give a live figure, which keep a chip's pale label at 4.5:1.
 */
export type StaticPalette = Palette & { "chip-tint"?: string; "chip-soft"?: string };

const DARK_CHIPS = { "chip-tint": "0.28", "chip-soft": "0.12" };

export function resolvePalette(theme: StaticOptions["theme"], mode: DiagramMode = "light"): StaticPalette {
  let p: StaticPalette;
  if (!theme || theme === "light") p = LIGHT;
  else if (theme === "dark") p = { ...DARK, ...DARK_CHIPS };
  else if (isDiagramTheme(theme)) p = { ...themePalette(theme, mode), ...(mode === "dark" ? DARK_CHIPS : {}) };
  else {
    const rest = stripBase(theme);
    // An older palette that sets its accent and not the accent ink means both.
    p = { ...(theme.base === "dark" ? { ...DARK, ...DARK_CHIPS } : LIGHT), ...rest };
    if (rest.accent && !rest["accent-ink"]) p["accent-ink"] = rest.accent;
  }
  // Font stacks land inside attribute values; a double quote there breaks the XML.
  return { ...p, mono: p.mono.replace(/"/g, "'"), sans: p.sans.replace(/"/g, "'") };
}

function stripBase(t: LegacyPalette): Partial<Palette> {
  const { base: _base, ...rest } = t;
  return rest;
}

/**
 * Replace every `var(--uipack-x, fallback)` with the palette literal. A name the palette lacks takes
 * its declared fallback, as the browser does when the property is unset; with no fallback (or one
 * that still reads the page) it falls back to currentColor.
 */
export function inlineVars(markup: string, p: Palette): string {
  return markup.replace(/var\(--uipack-([a-z-]+)(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g, (_, k: string, fallback?: string) => {
    const known = (p as unknown as Record<string, string | undefined>)[k];
    if (known !== undefined) return known;
    const own = fallback?.trim() ? inlineVars(fallback.trim(), p) : "";
    return own && !own.includes("var(") ? own : "currentColor";
  });
}
