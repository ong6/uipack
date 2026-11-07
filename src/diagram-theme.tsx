// Diagram themes: one object that colours every diagram renderer (live React in both modes, the
// static SVG export, the open-canvas dialog). Only colours, faces and the canvas ground vary by
// theme; geometry, the 8px grid, type sizes, strokes, what each flow kind means and the one accent
// path per figure stay in the parts (docs/components/diagrams.md, "What a theme may change").
//
// How it reaches a figure: a theme scope (an element with data-diagram-theme, or any selector a
// host passes to diagramThemeCss) sets the private carriers --uipack-diagram-<role>. src/theme.css
// reads each carrier first and falls back to the page's --ui-* role, so a figure outside every
// scope renders exactly as before, the nearest scope wins (custom properties inherit), and a role a
// theme leaves out falls through to the enclosing theme, then the page. Each colour is one
// light-dark() pair, resolved by the figure's own color-scheme: the host's dark switch
// ([data-theme="dark"] by default, or `darkSelector`) flips every theme at once, with no flash.
import type { CSSProperties, ReactNode } from "react";
import { technicalValues } from "./styles/technical-values";

/**
 * The colour roles a diagram reads, named as the `--ui-*` roles they stand in for. Values are CSS
 * colours; hex keeps the static export exact (it derives the line weights from a hex ink).
 */
export interface DiagramColors {
  /** Text, strokes and arrows (`--ui-ink`). */
  ink: string;
  /** Captions and secondary text (`--ui-ink-2`). */
  "ink-2": string;
  /** The canvas ground and label underlays (`--ui-surface`). */
  surface: string;
  /** Node, screen and note fill (`--ui-surface-raised`). */
  "surface-raised": string;
  /** Hovered or raised fill: actors, actions, a hovered node (`--ui-surface-2`). */
  "surface-2": string;
  /** Borders: the frame and canvas edge (`--ui-line`). Default ink at 26%. */
  line?: string;
  /** The canvas pattern and faint rules (`--ui-line-soft`). Default ink at 13%. */
  "line-soft"?: string;
  /** The one accent: the claim's path, numbered steps, the outcome (`--ui-accent`). */
  accent: string;
  /** Accent used as text, when the stroke accent is too light to read (`--ui-accent-ink`). Default the accent. */
  "accent-ink"?: string;
  /** The main flow, square packets (`--ui-flow-request`). */
  "flow-request": string;
  /** The return path, circle packets (`--ui-flow-response`). */
  "flow-response": string;
  /** Async change, diamond packets (`--ui-flow-change`). */
  "flow-change": string;
  /** A failed or declined branch (`--ui-flow-error`). */
  "flow-error": string;
}

/** Faces, as CSS font stacks (`--ui-font-text`, `--ui-font-label`, `--ui-font-heading`). Left out, a face follows the enclosing theme, then the page. */
export interface DiagramFonts {
  text?: string;
  label?: string;
  heading?: string;
}

/** The canvas ground: the drafting-film grid (12px minor, 60px major hairlines), a 12px dot grid, or plain. */
export type DiagramCanvas = "grid" | "dots" | "plain";

export interface DiagramThemeInput {
  /** kebab-case id; the value of `data-diagram-theme` and of a spec's `diagram-themes` entries. */
  name: string;
  light: DiagramColors;
  dark: DiagramColors;
  fonts?: DiagramFonts;
  /** Default "grid". */
  canvas?: DiagramCanvas;
}

/** A checked theme, from defineDiagramTheme. */
export interface DiagramTheme extends Readonly<DiagramThemeInput> {
  readonly canvas: DiagramCanvas;
  readonly __diagramTheme: true;
}

export type DiagramMode = "light" | "dark";

const NAME = /^[a-z][a-z0-9-]*$/;
const REQUIRED: readonly (keyof DiagramColors)[] = [
  "ink",
  "ink-2",
  "surface",
  "surface-raised",
  "surface-2",
  "accent",
  "flow-request",
  "flow-response",
  "flow-change",
  "flow-error",
];
/** Every colour role, in the order the CSS writes them. */
export const DIAGRAM_COLOR_ROLES: readonly (keyof DiagramColors)[] = [
  "ink",
  "ink-2",
  "surface",
  "surface-raised",
  "surface-2",
  "line",
  "line-soft",
  "accent",
  "accent-ink",
  "flow-request",
  "flow-response",
  "flow-change",
  "flow-error",
];

/** The private custom property a role travels in, from a theme scope to the figures inside it. */
export const diagramCarrier = (role: keyof DiagramColors | `font-${keyof DiagramFonts}` | "canvas") => `--uipack-diagram-${role}`;

/** Every carrier name: what CanvasView copies into the open-canvas dialog, which sits outside the scope. */
export const DIAGRAM_CARRIERS: readonly string[] = [
  ...DIAGRAM_COLOR_ROLES.map((r) => diagramCarrier(r)),
  diagramCarrier("font-text"),
  diagramCarrier("font-label"),
  diagramCarrier("font-heading"),
  diagramCarrier("canvas"),
];

/** Checks a theme (name, every required role in both modes) and fills its defaults. Throws on a mistake. */
export function defineDiagramTheme(input: DiagramThemeInput): DiagramTheme {
  if (!NAME.test(input.name)) throw new Error(`diagram theme "${input.name}": the name must be kebab-case`);
  for (const mode of ["light", "dark"] as const) {
    const colors = input[mode];
    if (!colors) throw new Error(`diagram theme "${input.name}": no ${mode} colours`);
    for (const role of REQUIRED)
      if (typeof colors[role] !== "string" || !colors[role].trim())
        throw new Error(`diagram theme "${input.name}": ${mode} has no "${role}"`);
  }
  return Object.freeze({ ...input, canvas: input.canvas ?? "grid", __diagramTheme: true as const });
}

/** True for a theme object (from defineDiagramTheme or the same shape), false for a legacy static palette. */
export function isDiagramTheme(value: unknown): value is DiagramThemeInput {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as DiagramThemeInput).name === "string" &&
    typeof (value as DiagramThemeInput).light === "object" &&
    typeof (value as DiagramThemeInput).dark === "object"
  );
}

/** Technical's Cyanotype values (src/styles/technical-values.ts): what every figure draws by default. */
const technical = (m: DiagramMode): DiagramColors => {
  const v = technicalValues[m];
  return {
    ink: v.ink,
    "ink-2": v["ink-2"],
    surface: v.surface,
    "surface-raised": v["surface-raised"],
    "surface-2": v["surface-2"],
    accent: v.accent,
    "flow-request": v["flow-request"],
    "flow-response": v["flow-response"],
    "flow-change": v["flow-change"],
    "flow-error": v["flow-error"],
  };
};

/**
 * The built-in theme: today's default rendering (Technical's values, the drafting grid). Faces are
 * left to the page, as they were. A figure inside a `blueprint` scope draws exactly what it draws
 * with no scope at all.
 */
export const blueprint: DiagramTheme = defineDiagramTheme({
  name: "blueprint",
  light: technical("light"),
  dark: technical("dark"),
  canvas: "grid",
});

/* ------------------------------------------------------------------ resolution */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `rgba()` of a hex colour at an alpha, in the format technicalValues uses; null for anything else. */
function hexAt(color: string, alpha: number): string | null {
  const m = HEX.exec(color.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  const n = parseInt(h, 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const mix = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** One mode's colours with every optional role filled: literals, for output that cannot read CSS (static SVG). */
export function diagramColors(theme: DiagramThemeInput, mode: DiagramMode): Required<DiagramColors> {
  const c = theme[mode];
  return {
    ...c,
    line: c.line ?? hexAt(c.ink, 0.26) ?? mix(c.ink, 26),
    "line-soft": c["line-soft"] ?? hexAt(c.ink, 0.13) ?? mix(c.ink, 13),
    "accent-ink": c["accent-ink"] ?? c.accent,
  };
}

const pair = (light: string, dark: string) => (light === dark ? light : `light-dark(${light}, ${dark})`);

/** The canvas ground as a background layer list, in a mode-aware ink. */
function canvasPattern(canvas: DiagramCanvas, ink: string, lineSoft: string) {
  if (canvas === "plain") return "none";
  if (canvas === "dots") return `radial-gradient(${lineSoft} 1px, transparent 1.2px) 0 0 / 12px 12px`;
  const major = mix(ink, 12);
  const minor = mix(ink, 5);
  return [
    `linear-gradient(90deg, ${major} 1px, transparent 1px) -1px -1px / 60px 60px`,
    `linear-gradient(${major} 1px, transparent 1px) -1px -1px / 60px 60px`,
    `linear-gradient(90deg, ${minor} 1px, transparent 1px) -1px -1px / 12px 12px`,
    `linear-gradient(${minor} 1px, transparent 1px) -1px -1px / 12px 12px`,
  ].join(", ");
}

/**
 * The carriers a scope sets, as custom properties: each colour a light-dark() pair, so one set
 * serves both modes. Spread into a style attribute, or written by diagramThemeCss.
 */
export function diagramThemeVars(theme: DiagramThemeInput): Record<string, string> {
  const vars: Record<string, string> = {};
  const light = theme.light;
  const dark = theme.dark;
  const ink = pair(light.ink, dark.ink);
  for (const role of DIAGRAM_COLOR_ROLES) {
    const l = light[role];
    const d = dark[role];
    if (role === "line" || role === "line-soft") {
      const pct = role === "line" ? 26 : 13;
      vars[diagramCarrier(role)] = pair(l ?? mix(light.ink, pct), d ?? mix(dark.ink, pct));
    } else if (role === "accent-ink") {
      vars[diagramCarrier(role)] = pair(l ?? light.accent, d ?? dark.accent);
    } else vars[diagramCarrier(role)] = pair(l as string, d as string);
  }
  for (const face of ["text", "label", "heading"] as const) {
    const value = theme.fonts?.[face];
    if (value) vars[diagramCarrier(`font-${face}`)] = value;
  }
  vars[diagramCarrier("canvas")] = canvasPattern(theme.canvas ?? "grid", ink, vars[diagramCarrier("line-soft")]);
  return vars;
}

export interface DiagramThemeCssOptions {
  /** Where the theme applies. Default `[data-diagram-theme="<name>"]`; `:root` makes it the site default. */
  scope?: string;
  /**
   * The host's dark switch, when it is not uipack's own (`[data-theme="dark"]` on any ancestor, or the
   * OS setting). Figures under it draw their dark half.
   */
  darkSelector?: string;
  /** The host's explicit light switch, when the OS may be dark (wins over prefers-color-scheme). */
  lightSelector?: string;
}

/** The figure roots a mode rule reaches: figures, the HTML charts and the open-canvas dialog. */
const ROOTS = [".uipack", ".uipack-span", ".uipack-stack", ".uipack-canvas-dialog"];

/** A rule that sets the dark (or light) half on every figure root under a host selector, above uipack's own mode rules. */
function modeRule(selector: string, mode: DiagramMode) {
  // Three repeats of the root class out-rank `:root:not([data-theme="light"]) .uipack` (0,3,0).
  const sel = ROOTS.map((r) => `:is(${selector}) ${r}${r}${r}`).join(",\n");
  const chips =
    mode === "dark"
      ? " --uipack-chip-tint: 0.28; --uipack-chip-soft: 0.12;"
      : " --uipack-chip-tint: initial; --uipack-chip-soft: initial;";
  return `${sel} {\n  color-scheme: ${mode};${chips}\n}`;
}

/**
 * The theme as a stylesheet a host injects once (a <style> in the document head, so the first
 * paint is right in both modes). Several themes concatenate; a page scope nested inside the
 * site's wins because the carriers inherit from the nearest scope.
 */
export function diagramThemeCss(theme: DiagramThemeInput, opts: DiagramThemeCssOptions = {}): string {
  const scope = opts.scope ?? `[data-diagram-theme="${theme.name}"]`;
  const vars = Object.entries(diagramThemeVars(theme))
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  const out = [`/* uipack diagram theme: ${theme.name} */\n${scope} {\n${vars}\n}`];
  if (opts.darkSelector) out.push(modeRule(opts.darkSelector, "dark"));
  if (opts.lightSelector) out.push(modeRule(opts.lightSelector, "light"));
  return out.join("\n") + "\n";
}

export interface DiagramThemeScopeProps {
  theme: DiagramThemeInput;
  /** Hold one mode for every figure inside (data-diagram-mode); omitted, the host's mode applies. */
  mode?: DiagramMode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * A theme scope in React: an element that lays out as its children (display: contents) and carries
 * the theme in its style attribute, so server HTML is themed before any script runs. Nest one per
 * page inside a site-wide scope (or inside a host's diagramThemeCss) to override it.
 */
export function DiagramThemeScope({ theme, mode, children, className, style }: DiagramThemeScopeProps) {
  return (
    <div
      className={className}
      data-diagram-theme={theme.name}
      data-diagram-mode={mode}
      style={{ display: "contents", ...(diagramThemeVars(theme) as CSSProperties), ...style }}
    >
      {children}
    </div>
  );
}
