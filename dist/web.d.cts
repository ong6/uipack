import * as react from 'react';
import { ReactNode, ElementType, CSSProperties, ButtonHTMLAttributes, RefObject } from 'react';

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
interface GrainOverlayProps {
    /** 0.04–0.08 reads as texture, not noise. */
    opacity?: number;
    /** Noise frequency; higher is finer. */
    frequency?: number;
}
/** Quiet depth: inline SVG feTurbulence noise. No image file, no request, no motion. */
declare function GrainOverlay({ opacity, frequency }: GrainOverlayProps): react.JSX.Element;
/** The noise layer StarHero uses; same as GrainOverlay. */
declare const NoiseLayer: typeof GrainOverlay;

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

interface InViewOptions {
    /** Fraction of the element that must be visible. Default 0. */
    threshold?: number;
    /** Stay true after the first time the element is seen. Default false. */
    once?: boolean;
    rootMargin?: string;
}
/**
 * True while the element is on screen. Without IntersectionObserver (old browsers, jsdom)
 * it is always true, so content never waits on an observer that cannot fire.
 * Starts false on the server and first client render, so hydration matches.
 */
declare function useInView(ref: RefObject<Element>, { threshold, once, rootMargin }?: InViewOptions): boolean;
/** Scroll progress of an element through the viewport: 0 as its top enters the bottom edge, 1 as its bottom leaves the top edge. */
declare function scrollProgressOf(rect: {
    top: number;
    height: number;
}, viewport: number): number;
/**
 * Tracks scrollProgressOf for an element. Listens to scroll only while the element is on
 * screen and coalesces updates into one per animation frame.
 */
declare function useScrollProgress(ref: RefObject<Element>): number;
/** True on devices with a hovering, fine pointer (mouse, trackpad). False on touch and on the server. */
declare function useFinePointer(): boolean;
/**
 * Run a DOM update inside a View Transition when the browser supports it and the viewer
 * has not asked for reduced motion; otherwise run it directly. In React, wrap the state
 * change in flushSync so the DOM is updated inside the callback.
 */
declare function withViewTransition(update: () => void): Promise<void>;
interface PaintTransitionOptions {
    /** Milliseconds for the pour. Default 750: long enough to read as a pour, short enough not to wait on. */
    duration?: number;
}
/**
 * Run a DOM update (typically a theme change) as paint poured down the page: a sheet
 * with drips that start, accelerate and thin out on their own, new every call. The
 * keyframes live in a <style> added for this transition, and <html> carries the class
 * `theme-switching` (which freezes element CSS transitions, so no part of the new live
 * layer is still fading from the old theme); both are removed when it finishes.
 * Falls back to calling update() directly without View Transitions or under reduced
 * motion. In React, wrap the state change in flushSync.
 */
declare function withPaintTransition(update: () => void, { duration }?: PaintTransitionOptions): Promise<void>;

interface BackgroundFrameProps {
    /** One ambient effect: GrainOverlay, DotGrid, LineGrid, Aurora, MaskedStar or BeamLines. */
    background: ReactNode;
    children?: ReactNode;
    as?: ElementType;
    className?: string;
    style?: CSSProperties;
}
/** A positioned, clipped box that puts one decorative background behind its content. */
declare function BackgroundFrame({ background, children, as: Tag, className, style }: BackgroundFrameProps): react.JSX.Element;

interface GridBackgroundProps {
    /** Cell size in px, on the 8-pt grid. Default 24. */
    size?: number;
    /** Fade the pattern out towards the edges. Default true. */
    fade?: boolean;
    /** Light the pattern under a fine pointer. Off on touch and under reduced motion. */
    spotlight?: boolean;
}
/** A dot pattern with a radial fade; optionally lit under the pointer. */
declare function DotGrid(props: GridBackgroundProps): react.JSX.Element;
/** A hairline grid with a radial fade; optionally lit under the pointer. */
declare function LineGrid(props: GridBackgroundProps): react.JSX.Element;
interface AuroraProps {
    /** Seconds for one drift cycle. Slow is the point. Default 24. */
    duration?: number;
}
/**
 * Two or three blurred colour blobs from the theme tokens, drifting slowly. The blobs sit in
 * one layer at --web-aurora-opacity, so overlaps never add up past the contrast budget.
 * Paused off screen; still under reduced motion.
 */
declare function Aurora({ duration }: AuroraProps): react.JSX.Element;
interface MaskedStarProps {
    values?: number[];
    /** Mirror the star: "x" rises toward the start edge, "y" hangs from the top. Default "none". */
    flip?: "x" | "y" | "none";
    /** Where the copy sits; the mask clears that area. Default "center". */
    clear?: "center" | "start";
}
/** The star of the show behind a headline: flipped, then masked clear of the text. */
declare function MaskedStar({ values, flip, clear }: MaskedStarProps): react.JSX.Element;
interface BeamLinesProps {
    /** Grid cell in px. Default 48. */
    size?: number;
    /** Number of beams. Default 5. */
    count?: number;
    /** Seconds for a beam to cross. Default 6. */
    duration?: number;
}
/**
 * Thin light beams travelling along grid lines, like packets on a connector. Positions are
 * deterministic, so server and client agree. Paused off screen; parked mid-line under reduced motion.
 */
declare function BeamLines({ size, count, duration }: BeamLinesProps): react.JSX.Element;
interface DriftingGuttersProps {
    /** Width of the centred content column the gutters flank: px, or any CSS length. Default 1120. */
    contentWidth?: number | string;
    /** Top offset in px, e.g. a fixed header's height. Default 72. */
    top?: number;
    /** Smallest viewport width in px that shows the gutters; below it they are hidden. Default 1280. */
    minViewport?: number;
    /** Seconds for one full drift of the dot grid. Default 48. */
    drift?: number;
}
/**
 * A dotted grid drifting upward in the empty side gutters of a centred page column, with a
 * few signal dots pulsing. Fixed to the viewport, decorative, never takes pointer events, and
 * masked toward the content and the top and bottom edges. Hidden below `minViewport` and still
 * under reduced motion. Colour: --web-gutters-color, else --web-accent. Render it once per page;
 * portal it to <body> if an ancestor has a transform, which would otherwise contain it.
 */
declare function DriftingGutters({ contentWidth, top, minViewport, drift }: DriftingGuttersProps): react.JSX.Element;

interface RevealProps {
    children: ReactNode;
    /** fade, up (fade + 16px rise) or blur (fade + blur-in). Default "up". */
    variant?: "fade" | "up" | "blur";
    /** Milliseconds between direct children. Default 80. */
    stagger?: number;
    as?: ElementType;
    className?: string;
}
/**
 * Reveals its direct children, staggered, the first time a fifth of it scrolls into view.
 * Only opacity, transform and filter change, so nothing shifts. Content is visible without
 * JavaScript, without IntersectionObserver and under reduced motion.
 */
declare function Reveal({ children, variant, stagger, as: Tag, className }: RevealProps): react.JSX.Element;
/** The frame of a scramble or typewriter at progress t (0..1). Pure, for tests and SSR. */
declare function scrambleFrame(text: string, t: number, mode: "scramble" | "type", seed?: number): string;
interface TextScrambleProps {
    text: string;
    /** scramble resolves random glyphs left to right; type reveals one character at a time. */
    mode?: "scramble" | "type";
    /** Milliseconds for the whole line. Default 1200. */
    duration?: number;
    as?: ElementType;
    className?: string;
}
/**
 * A hero line that resolves once, the first time it is on screen. The final text reserves
 * the space, so the layout never moves, and screen readers get the final text only.
 */
declare function TextScramble({ text, mode, duration, as: Tag, className }: TextScrambleProps): react.JSX.Element;
interface NumberTickerProps {
    value: number;
    from?: number;
    /** Milliseconds. Default 1400. */
    duration?: number;
    /** Intl.NumberFormat options, e.g. { maximumFractionDigits: 1 }. */
    format?: Intl.NumberFormatOptions;
    locale?: string;
    prefix?: string;
    suffix?: string;
    className?: string;
}
/**
 * Counts up to a proof stat the first time it is on screen. Tabular figures and a hidden copy
 * of the final value reserve the width; assistive tech reads the final value only.
 */
declare function NumberTicker({ value, from, duration, format, locale, prefix, suffix, className }: NumberTickerProps): react.JSX.Element;
interface MarqueeProps {
    items: ReactNode[];
    /** Accessible name, e.g. "Tools I use". */
    label: string;
    /** Seconds for one full loop. Default 30. */
    duration?: number;
    reverse?: boolean;
}
/**
 * A logo or skill strip that scrolls. Pauses on hover, on focus, off screen and with its own
 * Pause button (moving content longer than five seconds needs one). Under reduced motion it is
 * a static, wrapping row. The duplicate copy is inert, so keyboard focus visits each item once.
 */
declare function Marquee({ items, label, duration, reverse }: MarqueeProps): react.JSX.Element;
interface TiltCardProps {
    children: ReactNode;
    /** Maximum tilt in degrees. Subtle: default 5. */
    max?: number;
    href?: string;
    className?: string;
}
/** A card that tilts a few degrees toward a mouse pointer. Nothing on touch or under reduced motion; keyboard focus lifts it. */
declare function TiltCard({ children, max, href, className }: TiltCardProps): react.JSX.Element;
interface MagneticButtonProps extends CtaButtonProps {
    /** Maximum pull in px. Subtle: default 6. */
    strength?: number;
}
/** A CtaButton that leans a few pixels toward a mouse pointer. The hit area never moves. */
declare function MagneticButton({ strength, ...button }: MagneticButtonProps): react.JSX.Element;
type Range = [from: number, to: number];
interface ScrollTransformProps {
    children: ReactNode;
    /** Degrees across the scroll. */
    rotate?: Range;
    scale?: Range;
    /** Pixels. */
    translateY?: Range;
    opacity?: Range;
    className?: string;
}
/**
 * Drives a transform from the element's scroll progress: reuse the hero's star further down
 * the page and let it turn or grow as the reader moves. Listens only while on screen; under
 * reduced motion it holds the midpoint.
 */
declare function ScrollTransform({ children, rotate, scale, translateY, opacity, className }: ScrollTransformProps): react.JSX.Element;

export { Aurora, type AuroraProps, BackgroundFrame, type BackgroundFrameProps, BeamLines, type BeamLinesProps, Body, type BodyProps, CtaButton, type CtaButtonProps, DEFAULT_STAR_VALUES, DEFAULT_TIMING, type DemoAction, type DemoFrame, DemoPlayer, type DemoPlayerProps, type DemoStep, type DemoTiming, DotGrid, DriftingGutters, type DriftingGuttersProps, EMPHASIS, Eyebrow, type Feature, FeatureGrid, type FeatureGridProps, GRID_COLUMNS, GlassNav, type GlassNavLink, type GlassNavProps, GrainOverlay, type GrainOverlayProps, Grid, type GridBackgroundProps, GridItem, type GridItemProps, type GridProps, Heading, type HeadingProps, type InViewOptions, LineGrid, MagneticButton, type MagneticButtonProps, Marquee, type MarqueeProps, MaskedStar, type MaskedStarProps, NoiseLayer, NumberTicker, type NumberTickerProps, type PaintTransitionOptions, Reveal, type RevealProps, RevealText, type RevealTextProps, RhymeIcon, type RhymeIconProps, SPACE, ScrollTransform, type ScrollTransformProps, Section, type SectionProps, SpotlightCard, type SpotlightCardProps, StarChart, type StarChartProps, StarHero, type StarHeroProps, Subhead, TYPE_BASE_PX, TYPE_RATIO, TYPE_STEPS, TextScramble, type TextScrambleProps, TiltCard, type TiltCardProps, type TypeStep, WebSurface, type WebSurfaceProps, curvePath, demoCycle, demoEnd, demoFrame, scrambleFrame, scrollProgressOf, stepStart, typeMetrics, typeScale, useFinePointer, useInView, useScrollProgress, withPaintTransition, withViewTransition };
