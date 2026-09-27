import * as react from 'react';
import { ReactNode, ElementType, CSSProperties, ButtonHTMLAttributes } from 'react';

interface WebSurfaceProps {
    children: ReactNode;
    /** Force a theme; omit to follow the nearest data-theme ancestor or the system. */
    theme?: "light" | "dark";
    as?: ElementType;
    className?: string;
    style?: CSSProperties;
}
/** Root of the Landing style: carries its scoped tokens, background and type. */
declare function WebSurface({ children, theme, as: Tag, className, style }: WebSurfaceProps): react.JSX.Element;
interface GridProps {
    children: ReactNode;
    className?: string;
    as?: ElementType;
}
/** 12 / 8 / 4 column grid with 8-pt gutters, sized by its container. */
declare function Grid({ children, className, as: Tag }: GridProps): react.JSX.Element;
interface GridItemProps {
    children: ReactNode;
    /** Columns spanned at wide (of 12), medium (of 8) and narrow (of 4) widths. */
    span?: [wide: number, medium: number, narrow: number];
    className?: string;
    as?: ElementType;
}
declare function GridItem({ children, span, className, as: Tag }: GridItemProps): react.JSX.Element;

/** Landing style type scale: 16px base, Major Third (x1.25), expressed in rem. */
declare const TYPE_BASE_PX = 16;
declare const TYPE_RATIO = 1.25;
/** Font size for a scale step, in rem, rounded to 4 places. Step 0 is the body size. */
declare function typeScale(step: number): number;
/** Tighter tracking and leading as the size grows; body copy stays at 1.5. */
declare function typeMetrics(step: number): {
    lineHeight: number;
    letterSpacing: string;
};
declare const TYPE_STEPS: readonly [-1, 0, 1, 2, 3, 4, 5, 6];
type TypeStep = (typeof TYPE_STEPS)[number];
/** Opacity emphasis for text on any Landing surface (Material's high / medium / low). */
declare const EMPHASIS: {
    readonly high: 1;
    readonly medium: 0.87;
    readonly low: 0.66;
};
/** 8-point spacing, in px. */
declare const SPACE: readonly [0, 8, 16, 24, 32, 48, 64, 96, 128];
/** 12 / 8 / 4 columns at wide (>= 1024px container), medium (>= 640px) and narrow widths. */
declare const GRID_COLUMNS: {
    readonly wide: 12;
    readonly medium: 8;
    readonly narrow: 4;
};

type Emphasis = "high" | "medium" | "low";
interface TextProps {
    children: ReactNode;
    className?: string;
    as?: ElementType;
    id?: string;
}
/** Small uppercase label above a heading. Low emphasis by opacity, not by colour. */
declare function Eyebrow({ children, className, as: Tag, id }: TextProps): react.JSX.Element;
interface HeadingProps extends TextProps {
    level?: 1 | 2 | 3 | 4;
    /** Type-scale step; defaults to 6 / 4 / 2 / 1 by level. */
    size?: TypeStep;
}
declare function Heading({ children, level, size, className, id }: HeadingProps): react.JSX.Element;
/** One step above body, medium emphasis (~87%). */
declare function Subhead({ children, className, as: Tag, id }: TextProps): react.JSX.Element;
interface BodyProps extends TextProps {
    emphasis?: Emphasis;
}
/** Body copy: 1rem, line-height 1.5, emphasis by opacity. */
declare function Body({ children, emphasis, className, as: Tag, id }: BodyProps): react.JSX.Element;

interface CtaButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    children: ReactNode;
    /** Primary carries the single accent colour; keep one primary per view. */
    variant?: "primary" | "secondary";
    /** Renders a link (keep links as links). */
    href?: string;
    size?: "md" | "lg";
}
declare function CtaButton({ children, variant, href, size, className, type, ...rest }: CtaButtonProps): react.JSX.Element;

interface GlassNavLink {
    label: string;
    href: string;
}
interface GlassNavProps {
    /** Brand mark or name; wrap it in a link yourself if it should navigate. */
    brand: ReactNode;
    links: GlassNavLink[];
    /** The page's one goal, repeated from the hero. */
    cta?: ReactNode;
    /** Stick to the top of the scroll container. Default true. */
    sticky?: boolean;
    label?: string;
}
/** Sticky bar with a subtle backdrop blur and a hairline border. Links fold into a menu in narrow containers. */
declare function GlassNav({ brand, links, cta, sticky, label }: GlassNavProps): react.JSX.Element;

interface SectionProps {
    eyebrow?: ReactNode;
    title?: ReactNode;
    intro?: ReactNode;
    children?: ReactNode;
    /** "secondary" paints the 30% colour band behind the section. */
    tone?: "default" | "secondary";
    align?: "start" | "center";
    id?: string;
    className?: string;
}
/** A page section on the 8-pt rhythm, with an optional eyebrow, heading and intro. */
declare function Section({ eyebrow, title, intro, children, tone, align, id, className }: SectionProps): react.JSX.Element;
interface Feature {
    title: string;
    body: ReactNode;
    icon?: ReactNode;
    href?: string;
}
interface FeatureGridProps {
    features: Feature[];
    /** Upgrade the quiet cards to pointer-following spotlight cards. */
    spotlight?: boolean;
}
/** Three across at 12 columns, two at 8, one at 4. */
declare function FeatureGrid({ features, spotlight }: FeatureGridProps): react.JSX.Element;

interface SpotlightCardProps {
    children: ReactNode;
    /** Makes the whole card a link. Otherwise put links inside it. */
    href?: string;
    className?: string;
}
/**
 * A card whose fill and border glow follow a fine pointer. CSS variables carry the position,
 * so moving the pointer never re-renders. Off on touch and under reduced motion; keyboard
 * focus shows the same highlight, fixed at the top edge.
 */
declare function SpotlightCard({ children, href, className }: SpotlightCardProps): react.JSX.Element;

interface RevealTextProps {
    /** Words reveal one by one. */
    text?: string;
    /** Or authored lines, which reveal one line at a time. */
    lines?: string[];
    as?: ElementType;
    className?: string;
    /** Milliseconds between units. */
    stagger?: number;
}
/**
 * Scroll-in reveal: words (or authored lines) rise into place when 30% is on screen.
 * IntersectionObserver plus CSS; the text is always in the DOM and fully visible
 * without JavaScript, without IntersectionObserver, and under reduced motion.
 */
declare function RevealText({ text, lines, as: Tag, className, stagger }: RevealTextProps): react.JSX.Element;

interface StarHeroProps {
    eyebrow?: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    /** The CTA(s). Put the page's one goal here, then repeat it in the nav and at the end. */
    actions?: ReactNode;
    /** The star of the show. Defaults to StarChart; pass a still, an SVG, or a 3D scene. */
    visual?: ReactNode;
    /** Values for the default StarChart, taken from your product story. */
    values?: number[];
    /** Below the copy, e.g. a DemoPlayer that proves the claim. */
    children?: ReactNode;
    /** Noise opacity; 0 turns it off. */
    noise?: number;
    headingId?: string;
}
/**
 * One focal visual derived from the product story, masked so it never fights the headline,
 * with a quiet noise layer for depth. Copy uses opacity hierarchy, not extra colours.
 */
declare function StarHero({ eyebrow, title, subtitle, actions, visual, values, children, noise, headingId }: StarHeroProps): react.JSX.Element;

/** Default story data: messages handled over a morning (40 in, 3 left). Rising, so it reads as progress. */
declare const DEFAULT_STAR_VALUES: number[];
/** Smooth path through values normalised into a w x h box (y grows downward). */
declare function curvePath(values: number[], w: number, h: number, pad?: number): string;
interface StarChartProps {
    /** Values from your product story; the curve is the star of the show. */
    values?: number[];
    className?: string;
}
/** An abstract gradient that reads as a chart. Decorative: aria-hidden. */
declare function StarChart({ values, className }: StarChartProps): react.JSX.Element;
interface RhymeIconProps {
    /** Which point on the shared curve to mark, 0..1. Icons rhyme by reusing the star's shape. */
    at?: number;
    values?: number[];
    size?: number;
}
/** A small icon built from the hero's curve, so feature icons visually rhyme with the star. */
declare function RhymeIcon({ at, values, size }: RhymeIconProps): react.JSX.Element;
/** Quiet depth: an inline feTurbulence noise layer. No image files, no network. */
declare function NoiseLayer({ opacity }: {
    opacity?: number;
}): react.JSX.Element;

/** Pure playback model for DemoPlayer. Time in, frame out: no DOM, easy to test. */
interface DemoAction {
    label: string;
    /** Optional mono detail, e.g. "22 threads". */
    detail?: string;
    /** Metric value once this action completes (e.g. the inbox count). */
    metric?: number;
}
interface DemoStep {
    id: string;
    /** Short tab label: "Ask", "Act", "Review". */
    label: string;
    /** One-line caption announced when the step starts. */
    title: string;
    /** Typed into the composer, one character at a time. */
    prompt?: string;
    /** Ticked off one by one after the prompt is typed. */
    actions?: (string | DemoAction)[];
    /** Metric value once the step settles. */
    metric?: number;
    /** Shown in the result pane once the step settles. Consumer-supplied content. */
    screen?: ReactNode;
    /** Milliseconds to hold the settled step before the next one. */
    hold?: number;
}
interface DemoTiming {
    /** Pause before typing starts. */
    leadMs: number;
    typeMs: number;
    actionMs: number;
    holdMs: number;
}
declare const DEFAULT_TIMING: DemoTiming;
interface DemoFrame {
    step: number;
    /** Characters of the current prompt that are visible. */
    typed: number;
    /** Completed actions in the current step. */
    actionsDone: number;
    /** True once the prompt is typed and every action is done. */
    settled: boolean;
    /** True once the final step has settled. */
    done: boolean;
    metric: number | undefined;
}
/** Where step `i` starts, in ms. */
declare function stepStart(steps: DemoStep[], i: number, timing?: DemoTiming): number;
/** Elapsed time at which the last step settles; playback stops here unless looping. */
declare function demoEnd(steps: DemoStep[], timing?: DemoTiming): number;
/** Full cycle length including the last hold, used for looping. */
declare function demoCycle(steps: DemoStep[], timing?: DemoTiming): number;
declare function demoFrame(steps: DemoStep[], elapsed: number, timing?: DemoTiming, initialMetric?: number): DemoFrame;

interface DemoPlayerProps {
    /** The scripted sequence. Content is yours; timing and playback belong to the player. */
    steps: DemoStep[];
    /** Accessible name for the demo region. */
    label: string;
    /** Shown in the window chrome, e.g. "app.example.com/inbox". */
    address?: string;
    /** Metric shown in the result pane before any step changes it (e.g. 40). */
    initialMetric?: number;
    /** Words after the metric, e.g. "in your inbox". */
    metricLabel?: string;
    /** Placeholder for the composer before anything is typed. */
    placeholder?: string;
    /** Start when at least a quarter is on screen. Default true. */
    autoplay?: boolean;
    /** Restart after the last step's hold. Default false: the result stays. */
    loop?: boolean;
    timing?: Partial<DemoTiming>;
    /** Optional call to action beside the controls, e.g. a "Try it yourself" CtaButton. */
    cta?: ReactNode;
    className?: string;
    onStepChange?: (index: number) => void;
}
/**
 * A baked-in product demo: a window frame that types a prompt, ticks through the
 * agent's actions and settles on the result. Plays when on screen, pauses when off,
 * and shows every step statically under reduced motion.
 */
declare function DemoPlayer({ steps, label, address, initialMetric, metricLabel, placeholder, autoplay, loop, timing: timingProp, cta, className, onStepChange, }: DemoPlayerProps): react.JSX.Element;

export { Body, type BodyProps, CtaButton, type CtaButtonProps, DEFAULT_STAR_VALUES, DEFAULT_TIMING, type DemoAction, type DemoFrame, DemoPlayer, type DemoPlayerProps, type DemoStep, type DemoTiming, EMPHASIS, Eyebrow, type Feature, FeatureGrid, type FeatureGridProps, GRID_COLUMNS, GlassNav, type GlassNavLink, type GlassNavProps, Grid, GridItem, type GridItemProps, type GridProps, Heading, type HeadingProps, NoiseLayer, RevealText, type RevealTextProps, RhymeIcon, type RhymeIconProps, SPACE, Section, type SectionProps, SpotlightCard, type SpotlightCardProps, StarChart, type StarChartProps, StarHero, type StarHeroProps, Subhead, TYPE_BASE_PX, TYPE_RATIO, TYPE_STEPS, type TypeStep, WebSurface, type WebSurfaceProps, curvePath, demoCycle, demoEnd, demoFrame, stepStart, typeMetrics, typeScale };
