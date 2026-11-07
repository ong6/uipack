// Static export: a Figure (or bare parts) to a self-contained SVG string with
// every CSS variable resolved, fonts declared inline and, when asked, the SMIL
// packets kept. Made for places that consume SVG files through <img>, where
// currentColor and custom properties never reach the drawing: a Markdown site,
// a GitHub README, a slide.
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FigureScaleProvider, DEFAULT_RENDER_WIDTH, fontFloor } from "../scale";
import { FigureMotionContext, type FigureMotion } from "../context";
import type { FigureProps } from "../Figure";
import type { LegendItem } from "../Legend";
import type { FigureMeta, PresetFigureProps } from "../presets/shared";
import { Token, TOKEN_SHAPE } from "../tokens";
import { technicalFonts, technicalValues, type TechnicalColors } from "../styles/technical-values";
import { diagramColors, isDiagramTheme, type DiagramCanvas, type DiagramMode, type DiagramThemeInput } from "../diagram-theme";

export type StaticTheme = "light" | "dark";

/** Every colour the theme exposes, as literals. Keys mirror `--uipack-*`. */
export interface Palette {
  fg: string;
  muted: string;
  bg: string;
  surface: string;
  "surface-raised": string;
  grid: string;
  border: string;
  accent: string;
  /** Accent as text (Node, Label, Badge, Outcome words). Default the accent. */
  "accent-ink": string;
  "token-request": string;
  "token-response": string;
  "token-change": string;
  "token-error": string;
  mono: string;
  sans: string;
}

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

export interface StaticFigure {
  /** The wide drawing. */
  children: ReactNode;
  viewBox: string;
  legend?: LegendItem[];
  number?: string;
  eyebrow?: string;
  title?: string;
  caption?: string;
  alt?: string;
  background?: "dots" | "plain" | "ruled";
}

/** The older palette form: a named base and the literals to spread over it. */
export type LegacyPalette = Partial<Palette> & { base?: StaticTheme };

export interface StaticOptions {
  /**
   * A diagram theme (`defineDiagramTheme`, `blueprint`) drawn in `mode`; or the older forms: a named
   * palette ("light" | "dark"), or literals to spread over one.
   */
  theme?: StaticTheme | LegacyPalette | DiagramThemeInput;
  /** Which half of a diagram theme to draw. Default "light". The older forms carry their own mode. */
  mode?: DiagramMode;
  /** Keep the SMIL packets (they run inside <img>). False renders every packet once at its `at`. */
  motion?: boolean;
  /** Draw the header (eyebrow, title, caption, legend) and the border in SVG. False gives the bare drawing. */
  frame?: boolean;
  /** Output width attribute; height follows the viewBox. Default the viewBox width. */
  width?: number;
  /** Smallest text size in CSS px at the width the file is shown at (default 1088 wide). Default 11. */
  minFont?: number;
  /** Paint the canvas background (and the dotted grid). False leaves it transparent so the page shows through. */
  background?: boolean;
}

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

/**
 * The drafting-film grid as an SVG pattern: 12px minor hairlines at 5% ink, 60px major at 12%, the
 * same ground src/theme.css paints behind a live figure. Anchored to the canvas's top-left corner.
 */
function draftingGrid(id: string, ink: string, y: number) {
  const line = (size: number, opacity: number) =>
    `<path d="M ${size} 0 V ${size} M 0 ${size} H ${size}" fill="none" stroke="${ink}" stroke-opacity="${opacity}" stroke-width="1"/>`;
  return (
    `<pattern id="${id}-minor" width="12" height="12" patternUnits="userSpaceOnUse">${line(12, 0.05)}</pattern>` +
    `<pattern id="${id}" width="60" height="60" patternUnits="userSpaceOnUse" y="${y}"><rect width="60" height="60" fill="url(#${id}-minor)"/>${line(60, 0.12)}</pattern>`
  );
}

/** Replace every `var(--uipack-x)` with the palette literal. Unknown names fall back to currentColor. */
export function inlineVars(markup: string, p: Palette): string {
  return markup.replace(
    /var\(--uipack-([a-z-]+)(?:,\s*(?:[^()]|\([^()]*\))*)?\)/g,
    (_, k: string) => (p as unknown as Record<string, string>)[k] ?? "currentColor",
  );
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Word-wrap for the SVG caption. `chars` is an average column count for the font size. */
export function wrapText(text: string, chars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if ((line + " " + word).trim().length > chars && line) {
      lines.push(line.trim());
      line = word;
    } else line += " " + word;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function figureOf(input: ReactElement<FigureProps> | StaticFigure): StaticFigure {
  if (isValidElement(input)) {
    // A component that knows its own static form (DrillFigure) supplies it.
    const toStatic = (input.type as { toStatic?: (props: unknown) => StaticFigure }).toStatic;
    if (typeof toStatic === "function") return toStatic(input.props);
    const pp = input.props as Partial<PresetFigureProps<{ figure: FigureMeta }>>;
    if (typeof pp.parts === "function" && pp.spec) {
      const parts = pp.parts(pp.spec, pp.id ?? "static");
      const m = pp.spec.figure;
      return {
        children: parts.wide,
        viewBox: parts.viewBox,
        legend: parts.legend,
        number: m.number,
        eyebrow: m.eyebrow,
        title: m.title,
        caption: m.caption,
        alt: m.alt,
      };
    }
    const p = input.props as FigureProps;
    return {
      children: p.children,
      viewBox: p.viewBox,
      legend: p.legend,
      number: p.number,
      eyebrow: p.eyebrow,
      title: p.title,
      caption: p.caption,
      alt: p.alt,
      background: p.background,
    };
  }
  return input;
}

/**
 * SVG children as markup. Rendered inside an <svg> so React treats them as SVG (camel-cased
 * elements such as animateMotion and clipPath are valid there, not miscased HTML), then the
 * wrapper is cut away: the caller writes its own root.
 */
function svgMarkup(children: ReactNode): string {
  const html = renderToStaticMarkup(<svg>{children}</svg>);
  return html.slice("<svg>".length, -"</svg>".length);
}

/**
 * Render a Figure element (what a preset returns) or a bare {children, viewBox}
 * to an SVG string. The result needs no CSS, no JavaScript and no fonts from
 * the page; drop it in an <img>, a README or a slide.
 */
export function renderStatic(input: ReactElement<FigureProps> | StaticFigure, opts: StaticOptions = {}): string {
  const fig = figureOf(input);
  const p = resolvePalette(opts.theme, opts.mode);
  // A diagram theme brings its canvas ground; the older forms keep the dotted grid.
  const ground: DiagramCanvas | "ruled" =
    fig.background === "plain" || fig.background === "ruled"
      ? fig.background
      : isDiagramTheme(opts.theme)
        ? (opts.theme.canvas ?? "grid")
        : "dots";
  const motion = opts.motion ?? true;
  const frame = opts.frame ?? true;
  const paint = opts.background ?? true;
  const [vx, vy, vw, vh] = fig.viewBox.split(/\s+/).map(Number);

  const ctx: FigureMotion = {
    playing: motion,
    reduced: !motion,
    cycle: 0,
    toggle: () => {},
    replay: () => {},
    prerender: motion,
  };
  const g = globalThis as { __UIPACK_PRERENDER__?: boolean };
  const prev = g.__UIPACK_PRERENDER__;
  g.__UIPACK_PRERENDER__ = motion;
  let drawing: string;
  try {
    const floor = fontFloor(vw, opts.width ?? DEFAULT_RENDER_WIDTH, opts.minFont ?? 11);
    drawing = inlineVars(
      svgMarkup(
        <FigureMotionContext.Provider value={ctx}>
          <FigureScaleProvider floor={floor}>{fig.children}</FigureScaleProvider>
        </FigureMotionContext.Provider>,
      ),
      p,
    );
  } finally {
    g.__UIPACK_PRERENDER__ = prev;
  }

  // Header laid out in user units at the drawing's scale, so the frame keeps
  // its proportions whatever width the file is shown at.
  const pad = 28;
  let hy = 0;
  const head: string[] = [];
  if (frame) {
    hy = 24;
    const eyebrow = [fig.number, fig.eyebrow].filter(Boolean).join(" · ");
    if (eyebrow) {
      hy += 11;
      head.push(
        `<text x="${pad}" y="${hy}" font-family="${p.mono}" font-size="11" font-weight="700" letter-spacing=".08em" fill="${p.fg}">${esc(eyebrow.toUpperCase())}</text>`,
      );
      hy += 8;
    }
    if (fig.title) {
      hy += 20;
      head.push(
        `<text x="${pad}" y="${hy}" font-family="${p.sans}" font-size="20" font-weight="700" letter-spacing="-0.01em" fill="${p.fg}">${esc(fig.title)}</text>`,
      );
      hy += 6;
    }
    if (fig.caption) {
      const cols = Math.max(40, Math.floor((vw - pad * 2) / 7.2));
      for (const line of wrapText(fig.caption, Math.min(cols, 96))) {
        hy += 19;
        head.push(`<text x="${pad}" y="${hy}" font-family="${p.sans}" font-size="14" fill="${p.muted}">${esc(line)}</text>`);
      }
      hy += 4;
    }
    if (fig.legend?.length) {
      hy += 24;
      let lx = pad;
      for (const it of fig.legend) {
        const kind = it.kind ?? "neutral";
        const tok = inlineVars(
          svgMarkup(<Token kind={kind} shape={it.shape ?? TOKEN_SHAPE[kind]} r={5.5} cx={lx + 6} cy={hy - 4} />),
          p,
        );
        head.push(
          tok,
          `<text x="${lx + 20}" y="${hy}" font-family="${p.sans}" font-size="13" fill="${p.fg}">${esc(it.label)}</text>`,
        );
        lx += 20 + it.label.length * 7.4 + 24;
      }
    }
    hy += 20;
  }

  const H = hy + vh;
  const bgId = "uipack-static-dots";
  const fill = `<rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="${p.bg}"/>`;
  const patterned = (pattern: string) =>
    `<defs>${pattern}</defs>${fill}<rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="url(#${bgId})"/>`;
  const canvas = !paint
    ? ""
    : ground === "plain"
      ? fill
      : ground === "ruled"
        ? patterned(
            `<pattern id="${bgId}" width="${vw}" height="24" patternUnits="userSpaceOnUse"><rect width="${vw}" height="1" fill="${p.grid}"/></pattern>`,
          )
        : ground === "grid"
          ? patterned(draftingGrid(bgId, p.fg, hy))
          : patterned(
              `<pattern id="${bgId}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${p.grid}"/></pattern>`,
            );
  const border = frame
    ? `<rect x="0.5" y="0.5" width="${vw - 1}" height="${H - 1}" rx="4" fill="${paint ? p.bg : "none"}" stroke="${p.border}"/>` +
      (hy ? `<line x1="0" y1="${hy}" x2="${vw}" y2="${hy}" stroke="${p.border}"/>` : "")
    : "";
  const width = opts.width ?? vw;
  const height = Math.round((width / vw) * H);
  const label = fig.alt ? ` role="img" aria-label="${esc(fig.alt)}"` : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${H}" width="${width}" height="${height}" color="${p.fg}" font-family="${esc(p.sans)}"${label}>` +
    `<style>text{user-select:none}</style>` +
    border +
    canvas +
    head.join("") +
    `<g transform="translate(${-vx},${hy - vy})">${drawing}</g>` +
    `</svg>\n`
  );
}
