import * as react from 'react';
import { ReactNode } from 'react';
import { L as LegendItem } from './Legend-n6GikDm_.js';
import { U as UiStyleId } from './style-CBYPyqqV.js';

interface FigureProps {
    /** Allow opening a zoomable canvas. */
    expandable?: boolean;
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
     * The style it is painted in (sets data-ui-style): "technical" (default), "landing" or
     * "graphical". Only tokens change; the drawing, its words and its layout stay put. Omitted, the
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
declare function Figure({ expandable, number, eyebrow, title, headingLevel, caption, legend, controls, viewBox, children, narrow, narrowViewBox, alt, className, theme, uiStyle, background, minFont, measuredWidth, static: still, id, }: FigureProps): react.JSX.Element;

export { Figure as F, type FigureProps as a };
