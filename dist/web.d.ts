import * as react from 'react';
import { ReactNode, ElementType, CSSProperties, ButtonHTMLAttributes, RefObject, ReactElement } from 'react';

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
/** The three type roles. Display: headlines and big numbers. Text: everything read or pressed. Mono: labels and data. */
type TypeRole = "display" | "text" | "mono";
/** Default faces per role (web.css: --web-font-display, --web-font-text, --web-font-mono). */
declare const TYPE_FACES: {
    readonly display: "Instrument Serif";
    readonly text: "IBM Plex Sans";
    readonly mono: "IBM Plex Mono";
};
/** The first heading step set in the display face (39px; 31px in narrow containers). */
declare const DISPLAY_FROM_STEP = 4;
/** Which face a heading at this step uses: display from step 4 up, text below it. */
declare function typeRole(step: number): Exclude<TypeRole, "mono">;
/**
 * Leading and tracking per heading step, matching web.css. Display steps carry the single
 * display weight with light tracking (the serif is already narrow); text steps tighten
 * gradually toward body copy at 1.5. Step 3 drops to 500 so a 31px sans heading does not
 * outweigh a 39px display one.
 */
declare function typeMetrics(step: number): {
    role: Exclude<TypeRole, "mono">;
    lineHeight: number;
    letterSpacing: string;
    weight: number;
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
    /** The real heading level, h1–h6: one h1 per page (StarHero's title), then no skipped levels. */
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Type-scale step; defaults to 6 / 4 / 2 / 1 / 0 / 0 by level. Size is separate from level. */
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
    /**
     * For sections well below the fold: skip their layout and paint until they near the viewport
     * (content-visibility: auto, with a remembered intrinsic size). The content stays in the DOM, so
     * crawlers, find-in-page and screen readers still get it. Leave it off for the first screen and
     * for sections above an in-page link target.
     */
    lazyRender?: boolean;
}
/** A page section on the 8-pt rhythm, with an optional eyebrow, heading and intro. */
declare function Section({ eyebrow, title, intro, children, tone, align, id, className, lazyRender }: SectionProps): react.JSX.Element;
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
    /** "display" (default) sets the number in the display face, as a proof stat; "inherit" keeps the surrounding face, for a number inside a sentence. */
    face?: "display" | "inherit";
}
/**
 * Counts up to a proof stat the first time it is on screen. Tabular figures and a hidden copy
 * of the final value reserve the width; assistive tech reads the final value only.
 */
declare function NumberTicker({ value, from, duration, format, locale, prefix, suffix, className, face }: NumberTickerProps): react.JSX.Element;
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
 * a static, wrapping row. The duplicate copy is inert, so keyboard focus visits each item once,
 * and it is added after mount, so server HTML lists each item once.
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

/**
 * Rate, per second, of an exponential follow that closes `lerp` of the remaining gap every
 * 1/60 s. Time-based, so a 120 Hz screen takes two smaller steps and lands at the same moment.
 */
declare function followRate(lerp: number): number;
/** One frame of the follow: the gap to the target shrinks by e^(−rate·dt), whatever dt is. */
declare function followStep(current: number, target: number, rate: number, dt: number): number;
/** Ease for a fixed-duration scrollTo: fast start, long soft landing (exponential out). */
declare function easeOutExpo(t: number): number;
/** Pixels per wheel "line" (deltaMode 1, e.g. Firefox with a mouse wheel). */
declare const WHEEL_LINE_PX = 40;
/** A wheel "page" (deltaMode 2) is the viewport less the overlap browsers keep on Page Down. */
declare const WHEEL_PAGE_FRACTION = 0.875;
interface WheelLike {
    deltaX: number;
    deltaY: number;
    deltaMode: number;
}
/** A wheel event's deltas in pixels, whichever unit the browser reported them in. */
declare function normalizeWheel(e: WheelLike, viewport: {
    width: number;
    height: number;
}): {
    x: number;
    y: number;
};
interface SmoothScrollOptions {
    /** Share of the remaining distance closed per 1/60 s (time-based). Lower is softer. Default 0.1. */
    lerp?: number;
    /** Scales wheel distances. Default 1. */
    wheelMultiplier?: number;
    /** Ease same-page anchor links, landing below a sticky nav. Default true. */
    anchors?: boolean;
}
interface SmoothScrollToOptions {
    /**
     * Pixels to keep clear above the target. For an element or selector the default is its
     * scroll-margin-top plus the page's scroll-padding-top (web.css sets 5rem on Landing ids,
     * which clears GlassNav); for a number it is 0.
     */
    offset?: number;
    /** Milliseconds for a fixed-length, exponential-out scroll. Omit to use the follow. */
    duration?: number;
    /** Jump with no animation. */
    immediate?: boolean;
}
type SmoothScrollTarget = number | string | Element;
interface SmoothScrollController {
    /** Scroll the page to a y position, an element, or a selector ("#pricing"). */
    scrollTo(target: SmoothScrollTarget, options?: SmoothScrollToOptions): void;
    /** Stop an eased scroll where it is. */
    stop(): void;
    /** True while wheel easing is on: a fine pointer and no reduced-motion preference. */
    readonly enabled: boolean;
    /** Remove every listener and give scrolling back to the browser. */
    destroy(): void;
}
/** Marks <html> while easing is on; web.css turns its CSS smooth scrolling off under it. */
declare const SMOOTH_SCROLL_ATTR = "data-uipack-smooth-scroll";
/** Put on an element whose wheel events must stay native, like Lenis's data-lenis-prevent. */
declare const SMOOTH_SCROLL_PREVENT_ATTR = "data-smooth-scroll-prevent";
/**
 * Eases the page's own scroll position toward a wheel target, Lenis style, with no
 * dependencies. The real window scroll moves every frame, so sticky positioning, scroll
 * events, IntersectionObserver, Reveal and ScrollTransform all keep working.
 *
 * - On only for a fine pointer without a reduced-motion preference; it follows changes to
 *   either. Touch, pens on tablets and reduced motion keep native scrolling.
 * - Ctrl/⌘ + wheel (zoom, pinch) and mostly-horizontal or Shift + wheel stay native.
 * - Wheel over anything that can scroll on its own (overflow auto/scroll, an open dialog,
 *   [data-smooth-scroll-prevent]) stays native, and so does a page locked by a modal.
 * - Keyboard scrolling stays native: browsers already animate it and own its focus rules.
 *   A scroll it did not make right after a scroll key, or for three frames running (scrollbar
 *   drag, find in page), stops the easing; a one-off shift (scroll anchoring) is carried along.
 * - Same-page anchor links scroll to their target below a sticky nav (see offset), update the
 *   hash with pushState and move focus there. Handled even while wheel easing is off: natively
 *   smooth on touch, an instant jump under reduced motion.
 * - Stops when the tab is hidden or the scrollbar is grabbed.
 */
declare function createSmoothScroll({ lerp, wheelMultiplier, anchors }?: SmoothScrollOptions): SmoothScrollController;
/**
 * Scroll the page through the mounted SmoothScroll, or natively (smooth unless reduced
 * motion) when none is mounted or it is off. Safe to call on the server.
 */
declare function smoothScrollTo(target: SmoothScrollTarget, options?: SmoothScrollToOptions): void;
type SmoothScrollHandle = Omit<SmoothScrollController, "destroy">;
/**
 * Turns on SmoothScroll for the page while the calling component is mounted and returns a
 * stable handle. Mount it once per page. Its scrollTo works before mount and when easing is
 * off, falling back to the browser's own scroll.
 */
declare function useSmoothScroll({ lerp, wheelMultiplier, anchors }?: SmoothScrollOptions): SmoothScrollHandle;
type SmoothScrollProps = SmoothScrollOptions;
/**
 * Opt-in smooth wheel scrolling for a landing page: render it once, anywhere on the page.
 * Renders nothing. Use smoothScrollTo() (or useSmoothScroll's handle) to scroll from code.
 */
declare function SmoothScroll(props: SmoothScrollProps): null;

/**
 * Framework-agnostic SEO and answer-engine helpers for Landing pages. Everything here is pure:
 * it returns data (head tags, JSON-LD objects, strings) that any server, static generator or
 * client can render. React wrappers live in Head.tsx; crawl files live in crawl.ts.
 */
/** One element for the document head, as plain data. */
type HeadTag = {
    tag: "title";
    text: string;
} | {
    tag: "meta";
    attrs: Record<string, string>;
} | {
    tag: "link";
    attrs: Record<string, string>;
} | {
    tag: "script";
    attrs: Record<string, string>;
    text: string;
};
interface PageMetaOptions {
    /** The page title, as it should appear in a result: specific first, brand last. Aim for under 60 characters. */
    title: string;
    /** One or two sentences that answer "what is this page"; about 150 characters is shown in results. */
    description: string;
    /** The canonical, absolute URL of this page (no tracking or theme parameters). */
    url: string;
    /** Social preview image: absolute, or relative to `url`. 1200 × 630 is the common size. */
    image?: string | {
        url: string;
        alt?: string;
        width?: number;
        height?: number;
    };
    /** The site or product name, e.g. "Tidy". */
    siteName?: string;
    /** BCP 47 or Open Graph locale, e.g. "en_US" or "en-US". Default "en_US". */
    locale?: string;
    /** Open Graph type. Default "website"; use "article" for posts. */
    type?: "website" | "article" | "product" | "profile";
    /** Twitter/X handle of the site, e.g. "@tidyhq". */
    twitterSite?: string;
    /** Robots directives, e.g. "noindex" for a preview. Omitted by default (indexable). */
    robots?: string;
}
/**
 * The head tags a Landing page needs to be found and previewed: title, description, canonical,
 * Open Graph and Twitter cards. Returns plain data; render it with `<HeadTags>`, `useHead` or
 * `headTagsToHtml`.
 */
declare function pageMeta(o: PageMetaOptions): HeadTag[];
/** Serialise head tags to an HTML string, for a static generator or a server template. */
declare function headTagsToHtml(tags: HeadTag[]): string;
/** The identity of a head tag: a later tag with the same key replaces an earlier one. */
declare function headTagKey(t: HeadTag): string;
/** The self-hosted Landing faces, by role. Files ship in `uipack/fonts/*` (dist/fonts). */
declare const WEB_FONT_FILES: {
    readonly display: "instrument-serif-latin-400-normal.woff2";
    readonly "display-italic": "instrument-serif-latin-400-italic.woff2";
    readonly text: "ibm-plex-sans-latin-400-normal.woff2";
    readonly "text-500": "ibm-plex-sans-latin-500-normal.woff2";
    readonly "text-600": "ibm-plex-sans-latin-600-normal.woff2";
    readonly mono: "ibm-plex-mono-latin-400-normal.woff2";
    readonly "mono-600": "ibm-plex-mono-latin-600-normal.woff2";
};
type WebFontFace = keyof typeof WEB_FONT_FILES;
interface FontPreloadOptions {
    /**
     * The faces above the fold. Default `["display"]`: the hero headline, usually the LCP text.
     * Add "display-italic" when the hero title has an `<em>`. Preload two at most; every
     * preload competes with the hero's other requests.
     */
    faces?: WebFontFace[];
    /** Where the woff2 files are served, e.g. "/fonts/". Default "/fonts/". */
    base?: string;
    /** Or resolve each file yourself, e.g. to a bundler's hashed URL. Must match the URL web.css uses. */
    href?: (file: string, face: WebFontFace) => string;
    /**
     * Preload only where it pays, e.g. "(min-width: 720px)" when the swap moves the hero only in
     * wide layouts. On a slow phone a preload competes with the page's own scripts.
     */
    media?: string;
}
/**
 * `<link rel="preload" as="font">` descriptors for the faces the hero shows first, so they arrive
 * with the HTML instead of after the stylesheet and layout. The URL must be the same one the
 * @font-face rule fetches, or the browser downloads the file twice.
 */
declare function fontPreloads({ faces, base, href, media }?: FontPreloadOptions): HeadTag[];
/** A schema.org node. Builders return these without "@context"; `jsonLd()` adds it. */
type JsonLdNode = {
    "@type": string | string[];
    "@id"?: string;
} & Record<string, unknown>;
type JsonLdDocument = Record<string, unknown> & {
    "@context": "https://schema.org";
};
/** A reference to a node by its "@id", for linking nodes in one graph. */
declare const ref: (node: {
    "@id"?: string;
} | string) => {
    "@id": string | undefined;
};
interface OrganizationOptions {
    name: string;
    url: string;
    logo?: string;
    description?: string;
    /** Profiles that identify the organisation elsewhere (GitHub, LinkedIn, X…). */
    sameAs?: string[];
    id?: string;
}
declare function organization(o: OrganizationOptions): JsonLdNode;
interface WebSiteOptions {
    name: string;
    url: string;
    description?: string;
    /** The Organization node (or its "@id") that publishes the site. */
    publisher?: {
        "@id"?: string;
    } | string;
    inLanguage?: string;
    id?: string;
}
declare function webSite(o: WebSiteOptions): JsonLdNode;
interface OfferOptions {
    /** A number or a decimal string ("8.00"). 0 for free. */
    price: number | string;
    /** ISO 4217, e.g. "USD". */
    priceCurrency: string;
    /** Plan name as shown on the page, e.g. "Personal". */
    name?: string;
    url?: string;
    /** Recurring billing: the price is per month ("MON") or per year ("ANN"). */
    billing?: "MON" | "ANN";
    availability?: "InStock" | "PreOrder" | "OutOfStock" | "Discontinued";
    /** Free trial length in days, if the page states one. */
    trialDays?: number;
    description?: string;
}
/** An Offer, e.g. the plan on the Pricing section. Same words and numbers as the page shows. */
declare function offer(o: OfferOptions): JsonLdNode;
interface RatingOptions {
    ratingValue: number;
    ratingCount: number;
    bestRating?: number;
}
interface SoftwareApplicationOptions {
    name: string;
    description: string;
    url: string;
    /** One of Google's supported app types, e.g. "BusinessApplication", "CommunicationApplication". */
    applicationCategory?: string;
    /** Default "SoftwareApplication"; "WebApplication" for a browser-only SaaS. */
    type?: "SoftwareApplication" | "WebApplication" | "MobileApplication";
    /** e.g. "Web", "macOS, Windows", "iOS". */
    operatingSystem?: string;
    offers?: JsonLdNode | JsonLdNode[];
    image?: string;
    publisher?: {
        "@id"?: string;
    } | string;
    /** Only real, visible ratings. Google's app rich result needs one; never invent it. */
    aggregateRating?: RatingOptions;
    id?: string;
}
/** A SaaS or app landing page's product, with its offer(s). */
declare function softwareApplication(o: SoftwareApplicationOptions): JsonLdNode;
interface ProductOptions {
    name: string;
    description: string;
    url: string;
    image?: string | string[];
    brand?: string;
    sku?: string;
    offers?: JsonLdNode | JsonLdNode[];
    aggregateRating?: RatingOptions;
    id?: string;
}
/** A physical or generic product with its offer(s). */
declare function product(o: ProductOptions): JsonLdNode;
interface FaqItem {
    /** The question as a reader would ask it, ending in "?". */
    question: string;
    /** Plain text. The first sentence answers the question on its own; blank lines separate paragraphs. */
    answer: string;
    /** Anchor id for the item; defaults to a slug of the question. */
    id?: string;
}
/** FAQPage from the same items the FAQ component shows, so markup and visible text cannot drift. */
declare function faqPage(items: FaqItem[], { url, id }?: {
    url?: string;
    id?: string;
}): JsonLdNode;
interface BreadcrumbItem {
    name: string;
    /** Absolute URL. The last item (the current page) may omit it. */
    url?: string;
}
declare function breadcrumbList(items: BreadcrumbItem[]): JsonLdNode;
interface ArticleOptions {
    headline: string;
    description?: string;
    url: string;
    image?: string | string[];
    /** ISO 8601 dates. */
    datePublished: string;
    dateModified?: string;
    author: {
        name: string;
        url?: string;
    } | {
        name: string;
        url?: string;
    }[];
    publisher?: {
        "@id"?: string;
    } | string;
    type?: "Article" | "BlogPosting" | "NewsArticle" | "TechArticle";
}
declare function article(o: ArticleOptions): JsonLdNode;
/** Wrap one node, or several as an "@graph", in a JSON-LD document with its "@context". */
declare function jsonLd(...nodes: JsonLdNode[]): JsonLdDocument;
declare function serializeJsonLd(data: unknown): string;
/** A JSON-LD document as a head tag, for `headTagsToHtml` or `useHead`. */
declare function jsonLdTag(data: JsonLdDocument, id?: string): HeadTag;
/** URL-safe anchor id from a question or heading. */
declare function slugify(s: string): string;

interface HeadTagsProps {
    tags: HeadTag[];
}
/**
 * Renders head tags as React elements, for a server-rendered document that owns its `<head>`
 * (renderToString / renderToPipeableStream inside `<head>…</head>`). React 18 does not move
 * tags into the head for you; in a client-only app use `useHead` instead.
 */
declare function HeadTags({ tags }: HeadTagsProps): ReactElement;
/**
 * Applies head tags to `document.head` in a client-rendered page: updates an existing title,
 * description, canonical or og:* tag in place, adds what is missing, and restores everything on
 * unmount. Crawlers that do not run JavaScript never see these; server-render the head
 * (`HeadTags` or `headTagsToHtml`) when the page must be found by them.
 */
declare function useHead(tags: HeadTag[]): void;
interface JsonLdProps {
    /** A JSON-LD document, e.g. `jsonLd(organization(...), softwareApplication(...))`. */
    data: unknown;
    id?: string;
}
/**
 * `<script type="application/ld+json">` with the data serialised safely: "<", ">" and "&" are
 * escaped, so text such as "</script>" inside a value cannot break out of the tag. Valid in the
 * head or the body.
 */
declare function JsonLd({ data, id }: JsonLdProps): react.JSX.Element;

interface FAQProps {
    /**
     * The questions. Answers are plain text: the first sentence answers the question on its own,
     * so an answer engine can quote it without the rest; blank lines separate paragraphs.
     */
    items: FaqItem[];
    eyebrow?: ReactNode;
    title?: ReactNode;
    intro?: ReactNode;
    /** Section id, for nav links. Default "faq". */
    id?: string;
    /** The page's canonical URL, used for the FAQPage "@id". */
    url?: string;
    /** Emit FAQPage JSON-LD built from the same items. Default true. */
    jsonLd?: boolean;
    /**
     * "list" (default): every answer visible under an h3, which reads best for people, screen
     * reader heading navigation and crawlers. "accordion": native `<details>`, answers collapsed but
     * still in the HTML.
     */
    variant?: "list" | "accordion";
    tone?: SectionProps["tone"];
    /**
     * Skip rendering work while off screen (content-visibility: auto). Default false: turn it on when
     * no in-page link target (a pricing anchor, a closing CTA) sits below the FAQ.
     */
    lazyRender?: boolean;
}
/**
 * Questions and answers whose visible text and FAQPage JSON-LD come from one array, so the
 * markup can never say something the page does not.
 */
declare function FAQ({ items, eyebrow, title, intro, id, url, jsonLd, variant, tone, lazyRender, }: FAQProps): react.JSX.Element;

/**
 * Crawl files for a Landing site: robots.txt with an explicit stance per AI crawler,
 * sitemap.xml with lastmod, and llms.txt in the llmstxt.org format. Pure string builders;
 * write the result wherever your host serves the site root.
 */
type CrawlRule = "allow" | "disallow";
/** What a crawler's visits are for, as its operator documents it. */
type CrawlerPurpose = "search" | "user" | "training";
interface AiCrawler {
    /** The robots.txt user-agent token. */
    agent: string;
    operator: string;
    purpose: CrawlerPurpose;
    /** One line for the robots.txt comment: what allowing or blocking it changes. */
    note: string;
    docs: string;
}
/**
 * The AI crawlers Landing sites should state a stance on, from each operator's own documentation
 * (checked October 2026). Search and user agents decide whether answer engines can find, fetch and
 * cite the page; training agents decide whether the page may be used to train models.
 */
declare const AI_CRAWLERS: readonly [{
    readonly agent: "OAI-SearchBot";
    readonly operator: "OpenAI";
    readonly purpose: "search";
    readonly note: "Shows the site in ChatGPT search answers. Blocked sites appear only as navigational links.";
    readonly docs: "https://platform.openai.com/docs/bots";
}, {
    readonly agent: "ChatGPT-User";
    readonly operator: "OpenAI";
    readonly purpose: "user";
    readonly note: "Fetches a page when a ChatGPT user asks. User-initiated, so OpenAI says robots.txt rules may not apply.";
    readonly docs: "https://platform.openai.com/docs/bots";
}, {
    readonly agent: "GPTBot";
    readonly operator: "OpenAI";
    readonly purpose: "training";
    readonly note: "Collects pages that may train OpenAI's foundation models. Independent of search.";
    readonly docs: "https://platform.openai.com/docs/bots";
}, {
    readonly agent: "Claude-SearchBot";
    readonly operator: "Anthropic";
    readonly purpose: "search";
    readonly note: "Indexes pages for Claude's search results. Blocking it reduces visibility in Claude answers.";
    readonly docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler";
}, {
    readonly agent: "Claude-User";
    readonly operator: "Anthropic";
    readonly purpose: "user";
    readonly note: "Fetches a page when a Claude user asks. Blocking it stops Claude retrieving the page for users.";
    readonly docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler";
}, {
    readonly agent: "ClaudeBot";
    readonly operator: "Anthropic";
    readonly purpose: "training";
    readonly note: "Collects pages that may train Anthropic's models.";
    readonly docs: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler";
}, {
    readonly agent: "PerplexityBot";
    readonly operator: "Perplexity";
    readonly purpose: "search";
    readonly note: "Indexes and links the site in Perplexity answers. Not used for training foundation models.";
    readonly docs: "https://docs.perplexity.ai/guides/bots";
}, {
    readonly agent: "Perplexity-User";
    readonly operator: "Perplexity";
    readonly purpose: "user";
    readonly note: "Fetches a page when a Perplexity user asks. Perplexity says it generally ignores robots.txt.";
    readonly docs: "https://docs.perplexity.ai/guides/bots";
}, {
    readonly agent: "Google-Extended";
    readonly operator: "Google";
    readonly purpose: "training";
    readonly note: "Gemini model training and grounding in Gemini Apps and Vertex AI. Does not affect Google Search or AI Overviews (Googlebot).";
    readonly docs: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers";
}, {
    readonly agent: "Applebot-Extended";
    readonly operator: "Apple";
    readonly purpose: "training";
    readonly note: "Apple foundation-model training. It crawls nothing itself; Applebot search (Siri, Spotlight, Safari) is unaffected.";
    readonly docs: "https://support.apple.com/en-us/119829";
}, {
    readonly agent: "CCBot";
    readonly operator: "Common Crawl";
    readonly purpose: "training";
    readonly note: "Common Crawl's open web archive, which many model training sets are built from.";
    readonly docs: "https://commoncrawl.org/ccbot";
}];
type AiCrawlerAgent = (typeof AI_CRAWLERS)[number]["agent"];
/**
 * - "allow-all" (default): search, user and training crawlers may all read the public pages.
 *   A landing page is marketing copy meant to be repeated, and Google-Extended also gates
 *   grounding in Gemini Apps.
 * - "search-only": answer engines may find, fetch and cite the site; training crawlers are refused.
 * - "block-all": every listed AI crawler is refused. Google Search and AI Overviews still use Googlebot.
 */
type AiCrawlerPreset = "allow-all" | "search-only" | "block-all";
type AiCrawlerPolicy = AiCrawlerPreset | ({
    preset?: AiCrawlerPreset;
} & Partial<Record<AiCrawlerAgent, CrawlRule>>);
/** The rule each listed AI crawler gets under a policy. */
declare function resolveAiCrawlers(policy?: AiCrawlerPolicy): Record<AiCrawlerAgent, CrawlRule>;
interface CrawlPage {
    /** Path from the site root ("/", "/pricing") or an absolute URL on the site. */
    path: string;
    title: string;
    /** One sentence for llms.txt: what a reader or model will find on the page. */
    description?: string;
    /** Last real content change: a Date or "YYYY-MM-DD" / ISO 8601. Omit rather than guess. */
    lastmod?: Date | string;
    /** llms.txt section heading. Default "Pages". */
    section?: string;
    /** List under llms.txt's "## Optional" section, which agents may skip for a short context. */
    optional?: boolean;
    /** A clean Markdown copy of the page (llmstxt.org suggests `page.md`); llms.txt links it instead. */
    markdown?: string;
    /** Leave out of sitemap.xml and llms.txt (e.g. a thank-you page). */
    noindex?: boolean;
}
interface BuildCrawlFilesOptions {
    /** The site's origin and base, e.g. "https://tidy.example". */
    site: string;
    pages: CrawlPage[];
    /** Stance per AI crawler. Default "allow-all". */
    aiCrawlers?: AiCrawlerPolicy;
    /** Paths no crawler should fetch, e.g. ["/admin/", "/api/"]. Repeated in every group. */
    disallow?: string[];
    /** Where sitemap.xml will be served. Default "/sitemap.xml". */
    sitemapPath?: string;
    /** llms.txt header: H1 name, blockquote summary, optional details paragraph. */
    llms: {
        title: string;
        summary: string;
        details?: string;
    };
}
interface CrawlFiles {
    "robots.txt": string;
    "sitemap.xml": string;
    "llms.txt": string;
}
/**
 * robots.txt. Each listed AI crawler gets its own group with a comment saying what it does,
 * because a crawler obeys only the most specific group that names it and ignores `*`: site-wide
 * `disallow` paths are therefore repeated in every allowed group.
 */
declare function robotsTxt({ site, aiCrawlers, disallow, sitemapPath }: Pick<BuildCrawlFilesOptions, "site" | "aiCrawlers" | "disallow" | "sitemapPath">): string;
/** W3C datetime for <lastmod>: a Date becomes YYYY-MM-DD (UTC); a string must already be one. */
declare function formatLastmod(d: Date | string): string;
/**
 * sitemap.xml with <loc> and <lastmod> only. Google ignores <priority> and <changefreq>, and uses
 * <lastmod> only while it stays accurate, so set it from real content changes.
 */
declare function sitemapXml({ site, pages }: Pick<BuildCrawlFilesOptions, "site" | "pages">): string;
/**
 * llms.txt per llmstxt.org: an H1 name, a blockquote summary, optional details, then H2 sections
 * of `- [name](url): notes` links, with "Optional" last for links an agent can skip.
 */
declare function llmsTxt({ site, pages, llms }: Pick<BuildCrawlFilesOptions, "site" | "pages" | "llms">): string;
/** robots.txt, sitemap.xml and llms.txt for one site, keyed by file name. */
declare function buildCrawlFiles(o: BuildCrawlFilesOptions): CrawlFiles;

export { AI_CRAWLERS, type AiCrawler, type AiCrawlerAgent, type AiCrawlerPolicy, type AiCrawlerPreset, type ArticleOptions, Aurora, type AuroraProps, BackgroundFrame, type BackgroundFrameProps, BeamLines, type BeamLinesProps, Body, type BodyProps, type BreadcrumbItem, type BuildCrawlFilesOptions, type CrawlFiles, type CrawlPage, type CrawlRule, type CrawlerPurpose, CtaButton, type CtaButtonProps, DEFAULT_STAR_VALUES, DEFAULT_TIMING, DISPLAY_FROM_STEP, type DemoAction, type DemoFrame, DemoPlayer, type DemoPlayerProps, type DemoStep, type DemoTiming, DotGrid, DriftingGutters, type DriftingGuttersProps, EMPHASIS, Eyebrow, FAQ, type FAQProps, type FaqItem, type Feature, FeatureGrid, type FeatureGridProps, type FontPreloadOptions, GRID_COLUMNS, GlassNav, type GlassNavLink, type GlassNavProps, GrainOverlay, type GrainOverlayProps, Grid, type GridBackgroundProps, GridItem, type GridItemProps, type GridProps, type HeadTag, HeadTags, type HeadTagsProps, Heading, type HeadingProps, type InViewOptions, JsonLd, type JsonLdDocument, type JsonLdNode, type JsonLdProps, LineGrid, MagneticButton, type MagneticButtonProps, Marquee, type MarqueeProps, MaskedStar, type MaskedStarProps, NoiseLayer, NumberTicker, type NumberTickerProps, type OfferOptions, type OrganizationOptions, type PageMetaOptions, type PaintTransitionOptions, type ProductOptions, type RatingOptions, Reveal, type RevealProps, RevealText, type RevealTextProps, RhymeIcon, type RhymeIconProps, SMOOTH_SCROLL_ATTR, SMOOTH_SCROLL_PREVENT_ATTR, SPACE, ScrollTransform, type ScrollTransformProps, Section, type SectionProps, SmoothScroll, type SmoothScrollController, type SmoothScrollHandle, type SmoothScrollOptions, type SmoothScrollProps, type SmoothScrollTarget, type SmoothScrollToOptions, type SoftwareApplicationOptions, SpotlightCard, type SpotlightCardProps, StarChart, type StarChartProps, StarHero, type StarHeroProps, Subhead, TYPE_BASE_PX, TYPE_FACES, TYPE_RATIO, TYPE_STEPS, TextScramble, type TextScrambleProps, TiltCard, type TiltCardProps, type TypeRole, type TypeStep, WEB_FONT_FILES, WHEEL_LINE_PX, WHEEL_PAGE_FRACTION, type WebFontFace, type WebSiteOptions, WebSurface, type WebSurfaceProps, type WheelLike, article, breadcrumbList, buildCrawlFiles, createSmoothScroll, curvePath, demoCycle, demoEnd, demoFrame, easeOutExpo, faqPage, followRate, followStep, fontPreloads, formatLastmod, headTagKey, headTagsToHtml, jsonLd, jsonLdTag, llmsTxt, normalizeWheel, offer, organization, pageMeta, product, ref, resolveAiCrawlers, robotsTxt, scrambleFrame, scrollProgressOf, serializeJsonLd, sitemapXml, slugify, smoothScrollTo, softwareApplication, stepStart, typeMetrics, typeRole, typeScale, useFinePointer, useHead, useInView, useScrollProgress, useSmoothScroll, webSite, withPaintTransition, withViewTransition };
