import * as react from 'react';
import { ReactNode, CSSProperties } from 'react';
import { F as FigureChrome } from './context-CfQZ0ans.js';
import { L as LegendItem } from './Legend-n6GikDm_.js';
import { U as UiStyleId } from './style-oR-5TVuD.js';

interface FigureProps {
    /** Allow opening a zoomable canvas. Default: true, except under quiet chrome. */
    expandable?: boolean;
    /**
     * Tool chrome. "full": Open canvas and the legend as given. "quiet": no Open canvas, and no
     * legend with fewer than two entries (a one-entry key explains nothing). Omitted, the nearest
     * provider decides: a `uipack/web` page (WebSurface, WebPage) is quiet, anything else full.
     */
    chrome?: FigureChrome;
    /** "Figure 01" or "Fig. 3". Rendered mono, uppercase, before the eyebrow title. */
    number?: string;
    /** Short mono topic after the number: "What is Habitat?". */
    eyebrow?: string;
    title?: string;
    /** Heading element for the title, so the figure fits the page outline. Default 3. */
    headingLevel?: 2 | 3 | 4 | 5;
    caption?: string;
    legend?: LegendItem[];
    /** Show Pause and Replay. Hidden automatically under reduced motion. */
    controls?: boolean;
    /** SVG viewBox for the wide drawing. */
    viewBox: string;
    /** Wide drawing. */
    children: ReactNode;
    /** Optional narrow drawing shown below 720px. */
    narrow?: ReactNode;
    narrowViewBox?: string;
    /** Accessible description of what the figure shows. */
    alt: string;
    className?: string;
    theme?: "light" | "dark";
    /**
     * The style it is painted in (sets data-ui-style): a registered style id, "technical"
     * (the default and only one today). Only tokens change; the drawing, its words and its layout stay put. Omitted, the
     * figure follows the nearest ancestor with data-ui-style.
     */
    uiStyle?: UiStyleId;
    /** Canvas background: the dotted grid (default), plain, or ruled lines. */
    background?: "dots" | "plain" | "ruled";
    /**
     * Smallest rendered text size in CSS px. Every text part (Node, Lane, Label,
     * Chip, Badge, Group) clamps its font to this once the drawing's scale is
     * known. Default 11. 0 turns the floor off.
     */
    minFont?: number;
    /**
     * Width in CSS px the figure renders at, when known (static export, tests).
     * Otherwise it is measured after mount; before that, 1088 is assumed.
     */
    measuredWidth?: number;
    /**
     * Hold the finished resting frame: no scroll-in entrance, no moving packets, no Pause or
     * Replay. Reduced motion does the same. The default already paints the finished drawing
     * first and layers motion on top; use this for thumbnails, print or a capture.
     */
    static?: boolean;
    id?: string;
}
declare function Figure({ expandable: expandableProp, chrome: chromeProp, number, eyebrow, title, headingLevel, caption, legend, controls, viewBox, children, narrow, narrowViewBox, alt, className, theme, uiStyle, background, minFont, measuredWidth, static: still, id, }: FigureProps): react.JSX.Element;

/**
 * The colour roles a diagram reads, named as the `--ui-*` roles they stand in for. Values are CSS
 * colours; hex keeps the static export exact (it derives the line weights from a hex ink).
 */
interface DiagramColors {
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
interface DiagramFonts {
    text?: string;
    label?: string;
    heading?: string;
}
/** The canvas ground: the drafting-film grid (12px minor, 60px major hairlines), a 12px dot grid, or plain. */
type DiagramCanvas = "grid" | "dots" | "plain";
interface DiagramThemeInput {
    /** kebab-case id; the value of `data-diagram-theme` and of a spec's `diagram-themes` entries. */
    name: string;
    light: DiagramColors;
    dark: DiagramColors;
    fonts?: DiagramFonts;
    /** Default "grid". */
    canvas?: DiagramCanvas;
}
/** A checked theme, from defineDiagramTheme. */
interface DiagramTheme extends Readonly<DiagramThemeInput> {
    readonly canvas: DiagramCanvas;
    readonly __diagramTheme: true;
}
type DiagramMode = "light" | "dark";
/** Every colour role, in the order the CSS writes them. */
declare const DIAGRAM_COLOR_ROLES: readonly (keyof DiagramColors)[];
/** Every carrier name: what CanvasView copies into the open-canvas dialog, which sits outside the scope. */
declare const DIAGRAM_CARRIERS: readonly string[];
/** Checks a theme (name, every required role in both modes) and fills its defaults. Throws on a mistake. */
declare function defineDiagramTheme(input: DiagramThemeInput): DiagramTheme;
/** True for a theme object (from defineDiagramTheme or the same shape), false for a legacy static palette. */
declare function isDiagramTheme(value: unknown): value is DiagramThemeInput;
/**
 * The built-in theme: today's default rendering (Technical's values, the drafting grid). Faces are
 * left to the page, as they were. A figure inside a `blueprint` scope draws exactly what it draws
 * with no scope at all.
 */
declare const blueprint: DiagramTheme;
/** One mode's colours with every optional role filled: literals, for output that cannot read CSS (static SVG). */
declare function diagramColors(theme: DiagramThemeInput, mode: DiagramMode): Required<DiagramColors>;
/**
 * The carriers a scope sets, as custom properties: each colour a light-dark() pair, so one set
 * serves both modes. Spread into a style attribute, or written by diagramThemeCss.
 */
declare function diagramThemeVars(theme: DiagramThemeInput): Record<string, string>;
interface DiagramThemeCssOptions {
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
/**
 * The theme as a stylesheet a host injects once (a <style> in the document head, so the first
 * paint is right in both modes). Several themes concatenate; a page scope nested inside the
 * site's wins because the carriers inherit from the nearest scope.
 */
declare function diagramThemeCss(theme: DiagramThemeInput, opts?: DiagramThemeCssOptions): string;
interface DiagramThemeScopeProps {
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
declare function DiagramThemeScope({ theme, mode, children, className, style }: DiagramThemeScopeProps): react.JSX.Element;

export { DIAGRAM_CARRIERS as D, Figure as F, DIAGRAM_COLOR_ROLES as a, type DiagramCanvas as b, type DiagramColors as c, type DiagramFonts as d, type DiagramMode as e, type DiagramTheme as f, type DiagramThemeCssOptions as g, type DiagramThemeInput as h, DiagramThemeScope as i, type DiagramThemeScopeProps as j, type FigureProps as k, blueprint as l, defineDiagramTheme as m, diagramColors as n, diagramThemeCss as o, diagramThemeVars as p, isDiagramTheme as q };
