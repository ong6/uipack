import { ReactNode, ReactElement } from 'react';
import { a as FigureProps } from './Figure-BF6Zmtho.cjs';
import { b as LegendItem } from './Legend-S2FQoAxv.cjs';

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
    "token-request": string;
    "token-response": string;
    "token-change": string;
    mono: string;
    sans: string;
}
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
interface StaticOptions {
    /** A named palette, or one to spread over it. */
    theme?: StaticTheme | (Partial<Palette> & {
        base?: StaticTheme;
    });
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
declare function resolvePalette(theme: StaticOptions["theme"]): Palette;
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

export { DARK, LIGHT, type Palette, type StaticFigure, type StaticOptions, type StaticTheme, inlineVars, renderStatic, resolvePalette, wrapText };
