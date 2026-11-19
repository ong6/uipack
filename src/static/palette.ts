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

export function resolvePalette(theme: StaticOptions["theme"], mode: DiagramMode = "light"): Palette {
  let p: Palette;
  if (!theme || theme === "light") p = LIGHT;
  else if (theme === "dark") p = DARK;
  else if (isDiagramTheme(theme)) p = themePalette(theme, mode);
  else {
    const rest = stripBase(theme);
    // An older palette that sets its accent and not the accent ink means both.
    p = { ...(theme.base === "dark" ? DARK : LIGHT), ...rest };
    if (rest.accent && !rest["accent-ink"]) p["accent-ink"] = rest.accent;
  }
  // Font stacks land inside attribute values; a double quote there breaks the XML.
  return { ...p, mono: p.mono.replace(/"/g, "'"), sans: p.sans.replace(/"/g, "'") };
}

function stripBase(t: LegacyPalette): Partial<Palette> {
  const { base: _base, ...rest } = t;
  return rest;
}

/** Replace every `var(--uipack-x)` with the palette literal. Unknown names fall back to currentColor. */
export function inlineVars(markup: string, p: Palette): string {
  return markup.replace(
    /var\(--uipack-([a-z-]+)(?:,\s*(?:[^()]|\([^()]*\))*)?\)/g,
    (_, k: string) => (p as unknown as Record<string, string>)[k] ?? "currentColor",
  );
}
