import * as react from 'react';
import { ReactNode } from 'react';
import { b as LegendItem } from './Legend-S2FQoAxv.cjs';

interface FigureProps {
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
    /** Canvas background: the dotted grid (default), plain, or ruled lines. */
    background?: "dots" | "plain" | "ruled";
    id?: string;
}
declare function Figure({ number, eyebrow, title, headingLevel, caption, legend, controls, viewBox, children, narrow, narrowViewBox, alt, className, theme, background, id, }: FigureProps): react.JSX.Element;

export { Figure as F, type FigureProps as a };
