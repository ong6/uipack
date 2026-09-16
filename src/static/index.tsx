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
  "token-request": string;
  "token-response": string;
  "token-change": string;
  mono: string;
  sans: string;
}

export const LIGHT: Palette = {
  fg: "#1a1c1a",
  muted: "#5c625e",
  bg: "#ffffff",
  surface: "#ffffff",
  "surface-raised": "#f4f6f4",
  grid: "rgba(26, 28, 26, 0.16)",
  border: "rgba(26, 28, 26, 0.22)",
  accent: "#205f49",
  "token-request": "#4f6fe6",
  "token-response": "#3fb27f",
  "token-change": "#9a63e0",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

export const DARK: Palette = {
  ...LIGHT,
  fg: "#e8ece9",
  muted: "#9aa39e",
  bg: "#0e1512",
  surface: "#14201b",
  "surface-raised": "#1a2a23",
  grid: "rgba(232, 236, 233, 0.16)",
  border: "rgba(232, 236, 233, 0.22)",
  accent: "#71dcb2",
  "token-request": "#8ea4ff",
  "token-response": "#5fd39b",
  "token-change": "#c39aff",
};

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

export interface StaticOptions {
  /** A named palette, or one to spread over it. */
  theme?: StaticTheme | (Partial<Palette> & { base?: StaticTheme });
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

export function resolvePalette(theme: StaticOptions["theme"]): Palette {
  const p = !theme || theme === "light" ? LIGHT : theme === "dark" ? DARK : { ...(theme.base === "dark" ? DARK : LIGHT), ...stripBase(theme) };
  // Font stacks land inside attribute values; a double quote there breaks the XML.
  return { ...p, mono: p.mono.replace(/"/g, "'"), sans: p.sans.replace(/"/g, "'") };
}

function stripBase(t: Partial<Palette> & { base?: StaticTheme }): Partial<Palette> {
  const { base: _base, ...rest } = t;
  return rest;
}

/** Replace every `var(--uipack-x)` with the palette literal. Unknown names fall back to currentColor. */
export function inlineVars(markup: string, p: Palette): string {
  return markup.replace(/var\(--uipack-([a-z-]+)(?:,\s*[^)]*)?\)/g, (_, k: string) => (p as unknown as Record<string, string>)[k] ?? "currentColor");
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
    const pp = input.props as Partial<PresetFigureProps<{ figure: FigureMeta }>>;
    if (typeof pp.parts === "function" && pp.spec) {
      const parts = pp.parts(pp.spec, pp.id ?? "static");
      const m = pp.spec.figure;
      return { children: parts.wide, viewBox: parts.viewBox, legend: parts.legend, number: m.number, eyebrow: m.eyebrow, title: m.title, caption: m.caption, alt: m.alt };
    }
    const p = input.props as FigureProps;
    return { children: p.children, viewBox: p.viewBox, legend: p.legend, number: p.number, eyebrow: p.eyebrow, title: p.title, caption: p.caption, alt: p.alt, background: p.background };
  }
  return input;
}

/**
 * Render a Figure element (what a preset returns) or a bare {children, viewBox}
 * to an SVG string. The result needs no CSS, no JavaScript and no fonts from
 * the page; drop it in an <img>, a README or a slide.
 */
export function renderStatic(input: ReactElement<FigureProps> | StaticFigure, opts: StaticOptions = {}): string {
  const fig = figureOf(input);
  const p = resolvePalette(opts.theme);
  const motion = opts.motion ?? true;
  const frame = opts.frame ?? true;
  const paint = opts.background ?? true;
  const [vx, vy, vw, vh] = fig.viewBox.split(/\s+/).map(Number);

  const ctx: FigureMotion = { playing: motion, reduced: !motion, cycle: 0, toggle: () => {}, replay: () => {}, prerender: motion };
  const g = globalThis as { __UIPACK_PRERENDER__?: boolean };
  const prev = g.__UIPACK_PRERENDER__;
  g.__UIPACK_PRERENDER__ = motion;
  let drawing: string;
  try {
    const floor = fontFloor(vw, opts.width ?? DEFAULT_RENDER_WIDTH, opts.minFont ?? 11);
    drawing = inlineVars(
      renderToStaticMarkup(
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
      head.push(`<text x="${pad}" y="${hy}" font-family="${p.mono}" font-size="11" font-weight="700" letter-spacing=".08em" fill="${p.fg}">${esc(eyebrow.toUpperCase())}</text>`);
      hy += 8;
    }
    if (fig.title) {
      hy += 20;
      head.push(`<text x="${pad}" y="${hy}" font-family="${p.sans}" font-size="20" font-weight="700" letter-spacing="-0.01em" fill="${p.fg}">${esc(fig.title)}</text>`);
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
        const tok = inlineVars(renderToStaticMarkup(<Token kind={kind} shape={it.shape ?? TOKEN_SHAPE[kind]} r={5.5} cx={lx + 6} cy={hy - 4} />), p);
        head.push(tok, `<text x="${lx + 20}" y="${hy}" font-family="${p.sans}" font-size="13" fill="${p.fg}">${esc(it.label)}</text>`);
        lx += 20 + it.label.length * 7.4 + 24;
      }
    }
    hy += 20;
  }

  const H = hy + vh;
  const bgId = "uipack-static-dots";
  const canvas = paint
    ? fig.background === "plain"
      ? `<rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="${p.bg}"/>`
      : fig.background === "ruled"
        ? `<defs><pattern id="${bgId}" width="${vw}" height="24" patternUnits="userSpaceOnUse"><rect width="${vw}" height="1" fill="${p.grid}"/></pattern></defs><rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="${p.bg}"/><rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="url(#${bgId})"/>`
        : `<defs><pattern id="${bgId}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${p.grid}"/></pattern></defs><rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="${p.bg}"/><rect x="0" y="${hy}" width="${vw}" height="${vh}" fill="url(#${bgId})"/>`
    : "";
  const border = frame ? `<rect x="0.5" y="0.5" width="${vw - 1}" height="${H - 1}" rx="4" fill="${paint ? p.bg : "none"}" stroke="${p.border}"/>` + (hy ? `<line x1="0" y1="${hy}" x2="${vw}" y2="${hy}" stroke="${p.border}"/>` : "") : "";
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
