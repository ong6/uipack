import { ReactNode, ReactElement } from 'react';
import { h as DiagramThemeInput, e as DiagramMode, k as FigureProps } from './diagram-theme-CkHU82_2.cjs';
import { L as LegendItem } from './Legend-n6GikDm_.cjs';
import './context-CfQZ0ans.cjs';
import './style-oR-5TVuD.cjs';

type StaticTheme = "light" | "dark";
/** Every colour the theme exposes, as literals. Keys mirror `--uipack-*`. */
interface Palette {
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
/** Technical's light and dark values (src/styles/technical-values.ts, the mirror of technical.css). */
declare const LIGHT: Palette;
declare const DARK: Palette;
interface StaticFigure {
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
type LegacyPalette = Partial<Palette> & {
    base?: StaticTheme;
};
interface StaticOptions {
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
declare function themePalette(theme: DiagramThemeInput, mode?: DiagramMode): Palette;
declare function resolvePalette(theme: StaticOptions["theme"], mode?: DiagramMode): Palette;
/** Replace every `var(--uipack-x)` with the palette literal. Unknown names fall back to currentColor. */
declare function inlineVars(markup: string, p: Palette): string;
/** Word-wrap for the SVG caption. `chars` is an average column count for the font size. */
declare function wrapText(text: string, chars: number): string[];
/**
 * Render a Figure element (what a preset returns) or a bare {children, viewBox}
 * to an SVG string. The result needs no CSS, no JavaScript and no fonts from
 * the page; drop it in an <img>, a README or a slide.
 */
declare function renderStatic(input: ReactElement<FigureProps> | StaticFigure, opts?: StaticOptions): string;

export { DARK, LIGHT, type LegacyPalette, type Palette, type StaticFigure, type StaticOptions, type StaticTheme, inlineVars, renderStatic, resolvePalette, themePalette, wrapText };
