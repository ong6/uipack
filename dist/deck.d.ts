import * as react from 'react';
import { ReactNode, ElementType, CSSProperties, ReactElement } from 'react';
import { S as SpeechGuide } from './types-CMN3hTzQ.js';

/**
 * The content layer for decks: what each slide is for, proven storylines for the decks an engineer
 * gives inside a company, and a linter for the argument (not the pixels).
 *
 * Plain data and pure functions: no React, no DOM, no runtime imports. Everything here serialises
 * to JSON, so a CLI, an editor panel or the player's speaker view can all read it.
 *
 * Practice it encodes: answer first (Minto's pyramid), SCQA for decisions, action titles that
 * read as claims, the ghost-deck test (the titles alone tell the argument), one idea per slide,
 * numbers that carry a source, and a closing ask with a decision, an owner and a date.
 */

/**
 * The job a slide does in the argument. Thirteen roles cover every beat of the six storylines
 * below; each maps to one question a listener silently asks. `cover` and `appendix` frame the
 * talk; the other eleven carry it.
 */
type SlideRole = "cover" | "answer" | "context" | "problem" | "evidence" | "mechanism" | "option" | "recommendation" | "plan" | "risk" | "ask" | "demo" | "appendix";
interface SlideRoleInfo {
    label: string;
    /** The listener's question this slide answers. */
    question: string;
    /** What a slide in this role must do. */
    job: string;
}
declare const SLIDE_ROLES: Readonly<Record<SlideRole, SlideRoleInfo>>;
/** Roles that may sit next to themselves: stacked findings, a zoom through parts, demo steps, backup. */
declare const REPEATABLE_ROLES: readonly SlideRole[];
/** How a beat should arrive in the deck player. `advance` unless the story needs the other two. */
type StoryMove = "advance" | "morph" | "zoom";
interface StoryBeat {
    role: SlideRole;
    /** What this beat must achieve. */
    purpose: string;
    /** The action-title shape, with `<placeholders>`. */
    titlePattern: string;
    /** A filled title for a generic engineering project. Illustrative, not real data. */
    example: string;
    /** How to write it well, and the common mistake. */
    guidance: string;
    /** Suggested arrival. Omitted means `advance`. */
    move?: StoryMove;
    /** The beat can be dropped in a short version. */
    optional?: boolean;
    /** The beat can expand into several consecutive slides. */
    repeatable?: boolean;
}
type StorylineTemplateId = "project-update" | "decision-request" | "deep-dive" | "launch-demo" | "postmortem" | "review-highlights";
interface StorylineTemplate {
    id: StorylineTemplateId;
    name: string;
    /** When to reach for it. */
    use: string;
    /** Presented slides, appendix excluded. */
    slides: {
        min: number;
        max: number;
    };
    /** Speaking time in minutes, discussion excluded. */
    minutes: {
        min: number;
        max: number;
    };
    /** Whether the answer or recommendation must land in the first three content slides. */
    answerFirst: boolean;
    beats: readonly StoryBeat[];
}
declare const STORYLINE_TEMPLATES: readonly StorylineTemplate[];
declare function getStorylineTemplate(id: StorylineTemplateId): StorylineTemplate;
/** A template's example titles as a scaffold deck: one slide per beat, ready to rewrite. */
declare function templateOutline(template: StorylineTemplate | StorylineTemplateId): StorySlide[];
/**
 * The minimal slide shape the linter reads. A `DeckSlide` already fits; add `role`, and
 * `headline` when the visible action title differs from the short overview `title`.
 */
interface StorySlide {
    id: string;
    /** Short name. Used as the action title when `headline` is absent. */
    title: string;
    role?: SlideRole;
    /** Talk track. A string is treated as `say`. */
    notes?: SpeechGuide | string;
    /** The action title shown on the slide. */
    headline?: string;
    /** On-slide source line for the slide's numbers. */
    source?: string;
}
type LintSeverity = "error" | "warn" | "tip";
type LintRule = "deck-empty" | "duplicate-id" | "title-present" | "title-claim" | "title-length" | "one-idea" | "notes-present" | "number-source" | "roles-missing" | "answer-first" | "closing-ask" | "ask-concrete" | "role-repeat" | "deck-length" | "talk-time";
interface LintFinding {
    slideId?: string;
    rule: LintRule;
    severity: LintSeverity;
    message: string;
}
interface LintOptions {
    /** Applies the template's answer-first setting and its slide and time ranges. */
    template?: StorylineTemplateId;
    /** Speaking time budget in minutes. */
    minutes?: number;
    /** Override the answer-first check. Defaults to the template's setting, else true. */
    answerFirst?: boolean;
}
/** The checklist, for docs and UI. `severity` is the strongest a rule reports. */
declare const LINT_RULES: Readonly<Record<LintRule, {
    severity: LintSeverity;
    check: string;
}>>;
declare const MAX_TITLE_WORDS = 14;
/** Matches `estimateSpeechSeconds` in the presentations module. */
declare const WORDS_PER_MINUTE = 135;
/**
 * Check a deck's argument: action titles, answer first, a concrete closing ask, role rhythm,
 * talk tracks, sources for numbers, and length against the time budget. Pure; no DOM.
 */
declare function lintDeck(slides: readonly StorySlide[], options?: LintOptions): LintFinding[];
/** Estimated speaking time of the presented slides' `say` text, in seconds. */
declare function talkSeconds(slides: readonly StorySlide[]): number;
interface StorylineEntry {
    /** 1-based slide number. */
    number: number;
    id: string;
    /** The action title (`headline`, else `title`). */
    title: string;
    role?: SlideRole;
    roleLabel?: string;
    appendix: boolean;
}
/** The ghost deck: titles in order with their roles. Read it alone; it should tell the argument. */
declare function storylineOf(slides: readonly StorySlide[]): StorylineEntry[];
/** The ghost deck as plain text, one line per slide, for copying into a doc or a review. */
declare function formatStoryline(slides: readonly StorySlide[]): string;

type DeckTheme = "light" | "dark";
/**
 * How a slide arrives. Going back plays the same transition in reverse.
 * - `advance` (default): the deck's one consistent move. The outgoing slide steps aside and
 *   the incoming slide's blocks settle in, in reading order.
 * - `morph`: elements wrapped in `<Morph id>` on both slides travel to their new place and size;
 *   everything else fades out and in. Keynote calls this Magic Move.
 * - `{ zoom: id }`: the camera flies into the `<Morph id>` element on the previous slide, and that
 *   element opens into this slide. Use it for "here is a part; now look inside it".
 * - `fade`: a plain crossfade. `none`: cut.
 */
type DeckTransition = "advance" | "morph" | "fade" | "none" | {
    zoom: string;
};
interface DeckRenderContext {
    /** Build step reached on this slide. `Infinity` means fully built. */
    step: number;
    /** False for the outgoing copy during a transition, thumbnails and the next-slide preview. */
    active: boolean;
    /** True in the overview grid and presenter previews. Render something cheap and still. */
    thumbnail: boolean;
    theme: DeckTheme;
    /** True when the viewer prefers reduced motion or `motion="none"` was passed. */
    reducedMotion: boolean;
}
interface DeckSlide {
    /** Stable ID, used in URLs and by the presenter sync. */
    id: string;
    /** Short name for the overview, the counter and screen readers. */
    title: string;
    /** The action title on the slide: one sentence that states the point. Read in order, the
     * headlines should tell the whole argument (the storyline view and `lintDeck` check this). */
    headline?: string;
    /** What job the slide does in the argument. See `SLIDE_ROLES`. */
    role?: SlideRole;
    /** How this slide arrives. Defaults to the deck's `transition`, which defaults to `advance`. */
    transition?: DeckTransition;
    /** Background tone. The stage cross-fades between tones. */
    tone?: "paper" | "ink" | "accent";
    /** Talk track for the presenter view. A string is treated as `say`. */
    notes?: SpeechGuide | string;
    render: (context: DeckRenderContext) => ReactNode;
}
interface DeckPosition {
    index: number;
    step: number;
}

interface DeckPlayerProps {
    slides: DeckSlide[];
    /** Stable deck ID. Windows showing the same ID stay in step (audience and speaker view). */
    id: string;
    /** Accessible name of the deck. */
    title: string;
    theme?: DeckTheme;
    /** Default transition for slides that do not set one. */
    transition?: DeckTransition;
    motion?: "auto" | "none";
    /** `presenter` shows the current slide, the next slide, the talk track and a clock. */
    mode?: "audience" | "presenter";
    /** Slide ID or index to open on, and the build step. */
    initial?: {
        slide?: string | number;
        step?: number;
    };
    onPositionChange?: (position: DeckPosition & {
        id: string;
    }) => void;
    /** Where the Speaker button opens. Defaults to this page with `presenter=1`. */
    presenterHref?: string;
    /** `focus`: keys work while the deck has focus. `global`: anywhere on the page. */
    keyboard?: "focus" | "global";
    /** `read` stacks every slide, fully built, with its talk track: for phones and for decks read alone. */
    view?: "present" | "read";
    /** Run the storyline checks and show findings in the overview's Storyline tab. For authoring, not for the audience. */
    lint?: boolean | LintOptions;
    className?: string;
}
/** A still, scaled copy of one slide, fully built. Used by the overview and the speaker view. */
declare function SlideThumbnail({ slide, index, count, theme, }: {
    slide: DeckSlide;
    index: number;
    count: number;
    theme?: DeckTheme;
}): react.JSX.Element;
/**
 * Plays a deck: one transition grammar, build steps, keyboard, touch and buttons, an overview,
 * full screen and a synced speaker view. Slides are authored on a 1920×1080 canvas.
 */
declare function DeckPlayer({ slides, id, title, theme, transition, motion, mode, initial, onPositionChange, presenterHref, keyboard, view: initialView, lint, className, }: DeckPlayerProps): react.JSX.Element;

interface DeckSlideState {
    step: number;
    active: boolean;
    thumbnail: boolean;
    index: number;
    count: number;
}
declare const DeckSlideContext: react.Context<DeckSlideState>;
declare const useDeckSlide: () => DeckSlideState;
/**
 * Marks an element that is "the same thing" across slides. A `morph` transition moves it from its
 * place on the previous slide to its place here; a `zoom` transition flies into it.
 */
declare function Morph({ id, as: Tag, fit, className, style, children, }: {
    id: string;
    as?: ElementType;
    /** `auto` scales similar shapes uniformly (text stays undistorted) and stretches the rest. */
    fit?: "auto" | "uniform" | "stretch";
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}): react.JSX.Element;
/** Reveals its children at build `step` (1-based). Next reveals builds before it changes slide. */
declare function Build({ step, as: Tag, className, style, children, }: {
    step: number;
    as?: ElementType;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}): react.JSX.Element;
/**
 * The standard slide frame: canvas padding, an optional eyebrow and a footer with the page.
 * Children are the slide's blocks; `advance` staggers them in reading order.
 */
declare function Slide({ eyebrow, footer, layout, className, children, }: {
    eyebrow?: ReactNode;
    footer?: ReactNode;
    /** `stack` flows top to bottom; `center` centres a statement; `split` is two columns. */
    layout?: "stack" | "center" | "split";
    className?: string;
    children?: ReactNode;
}): react.JSX.Element;

/** Slides are authored on one fixed canvas and scaled to fit, so sizes in slides are canvas pixels. */
declare const CANVAS_WIDTH = 1920;
declare const CANVAS_HEIGHT = 1080;
/** The deck's one clock. Every transition and build reads these, so a deck moves consistently. */
declare const deckMotion: {
    readonly quick: 160;
    readonly base: 320;
    readonly slow: 560;
    readonly morph: 760;
    readonly zoom: 1150;
    readonly stagger: 45;
    readonly settle: "cubic-bezier(0.2, 0.7, 0.2, 1)";
    readonly exit: "cubic-bezier(0.4, 0, 1, 1)";
    readonly travel: "cubic-bezier(0.55, 0, 0.15, 1)";
};
interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
type TransitionKind = "advance" | "morph" | "fade" | "none" | "zoom";
interface ResolvedTransition {
    kind: TransitionKind;
    zoom?: string;
}
/**
 * The transition between two positions. Adjacent moves use the later slide's transition, so going
 * back reverses the way you came in. Jumps (overview, Home/End) crossfade.
 */
declare function resolveTransition(from: number, to: number, transitionOf: (index: number) => DeckTransition | undefined, fallback?: DeckTransition): ResolvedTransition;
/**
 * A zoom into `target` (canvas coordinates) is a pure scale about one fixed point F, chosen so the
 * target ends centred and as large as the canvas allows. The outer slide scales by Z^p and the
 * inner slide by Z^(p-1) about the same point, so the inner slide stays locked inside the target
 * for the whole flight and the zoom feels even (exponential), not accelerating.
 */
declare function zoomFrame(target: Rect, width?: number, height?: number): {
    Z: number;
    fx: number;
    fy: number;
} | null;
interface ZoomSample {
    offset: number;
    outer: string;
    inner: string;
    clip: string;
    innerOpacity: number;
}
/** Sampled keyframes for a zoom. `forward` flies in; backwards plays the same path out. */
declare function zoomSamples(target: Rect, forward: boolean, samples?: number, width?: number, height?: number): ZoomSample[] | null;
/**
 * FLIP: the transform that puts an element laid out at `to` where it was at `from`.
 * `scale` converts screen pixels back to canvas pixels. Similar shapes scale uniformly so text
 * keeps its proportions; differently shaped boxes stretch.
 */
declare function flipFrom(from: Rect, to: Rect, scale: number, fit?: "auto" | "uniform" | "stretch", 
/** For text: the font-size ratio. Text may rewrap between slides, so its box shape is no guide. */
textScale?: number): {
    transform: string;
};
interface RunOptions {
    transition: ResolvedTransition;
    from: HTMLElement;
    to: HTMLElement;
    direction: 1 | -1;
    /** Screen pixels per canvas pixel. */
    scale: number;
    reducedMotion: boolean;
}
/** Start a transition between two mounted layers. Returns the animations so a caller can cancel them. */
declare function runTransition(opts: RunOptions): Animation[];

interface BentoCellProps {
    /** Stable ID: the tour refers to it, and a `{ zoom: id }` transition can fly into it. */
    id: string;
    /** Columns and rows on the bento's grid. */
    col?: number;
    row?: number;
    tone?: "surface" | "accent" | "ink";
    /** Shown at overview scale. Keep it to a number, a label and one line. */
    children?: ReactNode;
    /**
     * Shown in place of `children` while the camera is on this cell. Write it small: the camera
     * scales the cell up, so dense detail becomes readable without leaving the slide.
     */
    detail?: ReactNode;
    className?: string;
}
/** One container in a `Bento`. Its layout box never changes, so the camera can measure it. */
declare function BentoCell(_: BentoCellProps): ReactElement | null;
interface BentoProps {
    /** Grid columns and rows. Cells place themselves in order with `col` × `row` spans. */
    columns?: number;
    rows?: number;
    /**
     * Cell IDs to visit, one per press of Next. After the last stop the camera pulls back to the
     * whole grid, so going back into the slide lands on the overview.
     */
    tour?: string[];
    /** The largest the camera may scale a cell. */
    maxScale?: number;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}
/**
 * Where the camera rests for a focused cell: centred in the bento's own box (so the slide's
 * heading and footer stay put) and as large as fits with a small margin.
 */
declare function bentoCamera(cell: {
    x: number;
    y: number;
    w: number;
    h: number;
}, view: {
    w: number;
    h: number;
}, maxScale?: number, fill?: number): {
    s: number;
    tx: number;
    ty: number;
};
/** The tour stop for a build step: 0 is the overview, 1…n focus cells, n + 1 pulls back. */
declare const bentoFocusAt: (step: number, tour: readonly string[]) => string | null;
/**
 * Apple-style bento: a grid of containers, and a camera that moves between them on Next. Each
 * focused cell swaps its summary for denser detail that is readable at the camera's scale.
 * Steps count as builds, so the deck's Next and Back drive the tour.
 */
declare function Bento({ columns, rows, tour, maxScale, className, style, children }: BentoProps): react.JSX.Element;

interface TrackerProps {
    /** Section names, in deck order. */
    sections: readonly string[];
    /** The current section: its index or its name. */
    current: number | string;
}
/** Section breadcrumb across the top. The current section is marked by a filled square, weight and an underline, not colour alone. */
declare function Tracker({ sections, current }: TrackerProps): react.JSX.Element;
interface ConsultingSlideProps {
    /** Section breadcrumb. Pass `{ sections, current }`. */
    tracker?: TrackerProps;
    /** The action title: one full-sentence takeaway, at most two lines. Wrap a number in `Morph as="span"` to carry it between slides. */
    title: ReactNode;
    /** Unit and period: "Revenue, $M, FY22–FY25". */
    subtitle?: ReactNode;
    /** A stamp at the top right: "Illustrative", "Preliminary", "Draft". */
    sticker?: ReactNode;
    /** A "So what" strip under the body. For a column instead, put a `SoWhat` in the grid. */
    takeaway?: ReactNode;
    takeawayLabel?: ReactNode;
    /** Numbered footnotes. Reference them in the body with `<Ref n={1} />`. */
    notes?: readonly ReactNode[];
    /** The source line, without the "Source:" prefix. */
    source?: ReactNode;
    /** Short deck name in the footer, beside the page number. */
    label?: ReactNode;
    /** Grid rows of the 12-column body, as `grid-template-rows`. Defaults to one row that fills the slide. */
    rows?: string;
    className?: string;
    children?: ReactNode;
}
/**
 * The dense consulting frame on the 1920×1080 canvas: tracker, action title, subtitle, a 12-column
 * body grid of `Panel`s, an optional "So what", a sticker, and a footer with numbered notes, the
 * source and the page number.
 */
declare function ConsultingSlide({ tracker, title, subtitle, sticker, takeaway, takeawayLabel, notes, source, label, rows, className, children, }: ConsultingSlideProps): react.JSX.Element;
/** A footnote marker, matching a numbered note in the slide footer. */
declare function Ref({ n }: {
    n: number;
}): react.JSX.Element;
interface GridPlacement {
    /** Columns of the 12-column grid this spans. Default 12. */
    cols?: number;
    /** Rows this spans. Default 1. */
    rows?: number;
    /** Explicit start column (1–12). Default: next free cell. */
    col?: number;
    /** Explicit start row. */
    row?: number;
}
interface PanelProps extends GridPlacement {
    /** What the panel shows, as a short claim or label. */
    title: ReactNode;
    /** Unit and period line under the title: "$ per order, FY25". */
    unit?: ReactNode;
    /** A short highlighted note at the top right: "Top 2 = 61% of excess". */
    callout?: ReactNode;
    /** Makes the panel a `Morph`, so a `{ zoom: morphId }` slide can open out of it. */
    morphId?: string;
    /** `accent` draws the edge in the accent: the panel the slide is about. */
    emphasis?: boolean;
    className?: string;
    children?: ReactNode;
}
/** A titled container for one chart or table in the slide's 12-column grid. */
declare function Panel({ title, unit, callout, morphId, emphasis, className, children, ...grid }: PanelProps): react.JSX.Element;
interface SoWhatProps extends GridPlacement {
    title?: ReactNode;
    children?: ReactNode;
}
/** The "So what" panel: the one conclusion a reader should take from the slide, placed in the grid. */
declare function SoWhat({ title, children, ...grid }: SoWhatProps): react.JSX.Element;

/** Canvas-pixel type sizes. Nothing on a consulting slide is smaller than `min` (≈14px at 1366 wide). */
declare const CX_TYPE: {
    readonly min: 20;
    readonly tick: 20;
    readonly label: 22;
    readonly value: 22;
    readonly callout: 22;
    readonly quadrant: 20;
};
/** The smallest text allowed on a slide, in canvas pixels. */
declare const MIN_TEXT_PX: 20;
interface LinearScale {
    (value: number): number;
    domain: [number, number];
    range: [number, number];
    invert: (px: number) => number;
}
/** Maps `domain` onto `range` linearly. A zero-width domain maps everything to the range start. */
declare function linearScale(domain: [number, number], range: [number, number]): LinearScale;
/** A "nice" step (1, 2, 2.5 or 5 × 10^n) that splits `span` into about `count` parts. */
declare function niceStep(span: number, count?: number): number;
/** Round numbers that cover `[min, max]`: the extended domain and its ticks. */
declare function niceTicks(min: number, max: number, count?: number): {
    domain: [number, number];
    ticks: number[];
};
/** Domain that always includes zero (bars grow from a zero baseline). */
declare function zeroBasedDomain(values: number[]): [number, number];
interface Band {
    index: number;
    /** Start of the band slot. */
    start: number;
    /** Width of the whole slot. */
    size: number;
    /** Start of the mark centred in the slot. */
    markStart: number;
    /** Mark thickness: a share of the slot, capped. */
    mark: number;
    centre: number;
}
/**
 * Splits `length` into `count` equal slots and centres a mark of `fill` × slot in each, capped at
 * `maxMark` so bars never fill their slot (the leftover is air).
 */
declare function bandLayout(count: number, start: number, length: number, fill?: number, maxMark?: number): Band[];
interface WaterfallInput {
    label: string;
    /** A delta, or for a total the level itself. Omit on a total to close at the running level. */
    value?: number;
    total?: boolean;
}
interface WaterfallBar {
    label: string;
    kind: "total" | "up" | "down";
    /** The value shown: the level for totals, the signed delta otherwise. */
    value: number;
    /** Level before and after this bar. For totals, `from` is 0. */
    from: number;
    to: number;
}
/** Turns start → deltas → end into floating bars. Totals reset the running level. */
declare function waterfallBars(steps: WaterfallInput[]): WaterfallBar[];
interface StackSegment {
    series: number;
    value: number;
    /** Cumulative start and end along the value axis (shares in percent mode). */
    from: number;
    to: number;
    /** Share of the category total, 0–1. */
    share: number;
}
/** Stacks one category's values. `percent` rescales the stack to 0–100. Negative values count as 0. */
declare function stackSegments(values: number[], percent?: boolean): StackSegment[];
/**
 * The filled wedge of a Harvey ball: `level` quarters of a circle of radius `r` centred on (cx, cy),
 * clockwise from 12 o'clock. Returns "" for 0 and a full circle path for 4.
 */
declare function harveyWedge(level: number, cx: number, cy: number, r: number): string;
/** Bubble radius with area proportional to `size`. */
declare function bubbleRadius(size: number, maxSize: number, maxRadius: number, minRadius?: number): number;
/**
 * A bar with a 4px-style rounded data end and a square baseline end. Horizontal bars run from x0
 * to x1 (either direction); vertical bars from y0 (baseline) to y1.
 */
declare function barPath(orientation: "horizontal" | "vertical", base: number, end: number, crossStart: number, thickness: number, radius?: number): string;
/**
 * Estimated rendered width of `text` at `size` in a UI sans. Errs wide, so labels placed with it
 * do not collide. Used only for layout; nothing is clipped to it.
 */
declare function textWidth(text: string, size: number, weight?: 400 | 600): number;
/** Greedy word wrap to `maxWidth`, at most `maxLines` lines (the last line keeps the overflow). */
declare function wrapText(text: string, size: number, maxWidth: number, maxLines?: number): string[];
/**
 * Spreads labels that want to sit at `ys` (in order of any kind) so neighbours are at least `gap`
 * apart, staying inside [min, max]. Returns the placed positions in the input order.
 */
declare function spreadLabels(ys: number[], gap: number, min?: number, max?: number): number[];
interface FormatOptions {
    decimals?: number;
    prefix?: string;
    suffix?: string;
    /** Always show a sign: "+1.2", "−0.4". Uses the true minus sign. */
    sign?: boolean;
    /** Compact thousands and millions: 1.2K, 3.4M. */
    compact?: boolean;
}
/** Formats a number for a slide: fixed decimals, thousands separators, a real minus sign. */
declare function formatValue(value: number, options?: FormatOptions): string;
/** A formatter bound to options, for chart props. */
declare const formatter: (options?: FormatOptions) => (v: number) => string;

type Format = (value: number) => string;
/** Fixed size for tests or static use; otherwise a chart fills its panel. */
interface ChartSize {
    width?: number;
    height?: number;
}
interface CalloutGeometry {
    lines: string[];
    box: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    /** Leader from the box edge (x1, y1) to the data point (x2, y2). */
    leader: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
}
/**
 * Where a callout's text and leader go. The text block's top-left (or top-right with
 * `align: "end"`) sits at (tx, ty); the leader leaves the nearest edge of the block and ends on
 * the data point (x, y).
 */
declare function calloutGeometry(point: {
    x: number;
    y: number;
}, at: {
    x: number;
    y: number;
}, text: string, maxWidth?: number, align?: "start" | "end", size?: number): CalloutGeometry;
interface CalloutProps {
    /** The data point the leader ends on. */
    x: number;
    y: number;
    /** Top-left of the text (top-right with `align="end"`). */
    tx: number;
    ty: number;
    text: string;
    /** Wrap width in canvas pixels. */
    width?: number;
    align?: "start" | "end";
}
/** An annotation inside a chart's SVG: wrapped text, and a leader line that ends on the data point it explains. */
declare function Callout({ x, y, tx, ty, text, width, align }: CalloutProps): react.JSX.Element;
/** Where to annotate a chart: offsets of the text block from the data point. */
interface ChartCallout {
    text: string;
    /** Text block offset from the point, in canvas px. */
    dx: number;
    dy: number;
    width?: number;
    align?: "start" | "end";
}
interface BarDatum {
    label: string;
    value: number;
    /** Draws this bar in the accent and the rest in context grey. */
    highlight?: boolean;
}
interface BarChartProps extends ChartSize {
    data: readonly BarDatum[];
    /** `horizontal` ranks with labels on the left; `vertical` columns with labels below. */
    orientation?: "horizontal" | "vertical";
    /** Default: `desc` for horizontal, `none` for vertical. */
    sort?: "desc" | "asc" | "none";
    format?: Format;
    /** Value-axis domain. Default: zero to the largest value. */
    domain?: [number, number];
    /** A reference line, such as an average or a target. */
    reference?: {
        value: number;
        label: string;
    };
    /** Annotate one bar (by label). */
    callout?: ChartCallout & {
        label: string;
    };
    /** Accessible summary. Defaults to the labels and values. */
    ariaLabel?: string;
}
/** Ranked horizontal bars or vertical columns, value at the tip, one optional highlight. */
declare function BarChart({ data, orientation, sort, format, domain, reference, callout, ariaLabel, width, height, }: BarChartProps): react.JSX.Element;
interface WaterfallProps extends ChartSize {
    /** Start total → deltas → end total. A total without `value` closes at the running level. */
    steps: readonly WaterfallInput[];
    format?: Format;
    /** Which direction is good: `up` for margin or revenue, `down` for cost. Colours follow it; signs and arrows show direction. */
    goodDirection?: "up" | "down";
    /** Value-axis domain. A start above zero truncates the totals, marked with a break. */
    domain?: [number, number];
    callout?: ChartCallout & {
        label: string;
    };
    ariaLabel?: string;
}
/** A bridge from a start total through signed deltas to an end total. */
declare function Waterfall({ steps, format, goodDirection, domain, callout, ariaLabel, width, height }: WaterfallProps): react.JSX.Element;
interface StackedBarProps extends ChartSize {
    /** One entry per bar; `values` follow `series` order. */
    categories: readonly {
        label: string;
        values: readonly number[];
        highlight?: boolean;
    }[];
    /** Up to four series; fold the rest into "Other". */
    series: readonly string[];
    /** `percent` draws each bar as 100%. */
    mode?: "absolute" | "percent";
    orientation?: "vertical" | "horizontal";
    format?: Format;
    /** Format for values inside segments. Default: `format`. Percent mode shows shares. */
    segmentFormat?: Format;
    /** Show the total above each bar (absolute mode). Default true. */
    totals?: boolean;
    ariaLabel?: string;
}
/** Stacked bars (or 100% bars) with a legend, segment values where they fit and totals on top. */
declare function StackedBar({ categories, series, mode, orientation, format, segmentFormat, totals, ariaLabel, width, height, }: StackedBarProps): react.JSX.Element;
interface LineSeries {
    name: string;
    values: readonly (number | null)[];
    /** Draws this series in the accent and the others in grey. */
    highlight?: boolean;
}
interface LineChartProps extends ChartSize {
    /** Category labels along x (periods). */
    x: readonly string[];
    /** One to four series. */
    series: readonly LineSeries[];
    format?: Format;
    /** Tick format; defaults to `format`. */
    tickFormat?: Format;
    domain?: [number, number];
    /** A reference line, such as the index base or a target. */
    reference?: {
        value: number;
        label: string;
    };
    /** One annotated point: series (name or index), the x index, and where the text goes. */
    annotate?: ChartCallout & {
        series: string | number;
        index: number;
    };
    ariaLabel?: string;
}
/** One to four lines over periods, with end labels, a reference line and one annotated point. */
declare function LineChart({ x: periods, series, format, tickFormat, domain, reference, annotate, ariaLabel, width, height, }: LineChartProps): react.JSX.Element;
/** A 2px trend line in the de-emphasis grey, with the latest point in the accent. */
declare function Sparkline({ values, width, height }: {
    values: readonly number[];
    width?: number;
    height?: number;
}): react.JSX.Element | null;
interface KpiDelta {
    /** Signed text, as shown: "+22%", "−3.1 pts". */
    text: string;
    direction: "up" | "down" | "flat";
    /** Whether the move is good news. Sets the colour; the arrow and sign carry the direction. */
    sentiment?: "good" | "bad" | "neutral";
    /** Comparison period: "vs FY22". */
    period?: string;
}
interface KpiItem {
    label: string;
    value: string;
    /** Small unit after the value: "pts", "M". */
    unit?: string;
    delta?: KpiDelta;
    /** A muted line under the value when there is no delta: "Fit-out and site exits". */
    note?: string;
    /** About 6–12 points, oldest first. */
    trend?: readonly number[];
    /** Wraps the value in `Morph as="span"`, so a morph can carry it into the next slide's title. */
    morphId?: string;
    highlight?: boolean;
}
/** A row of stat tiles: label, value, a signed delta with an arrow, and a sparkline. */
declare function KpiTiles({ items, columns }: {
    items: readonly KpiItem[]; /** Tiles per row. Default: all in one row. */
    columns?: number;
}): react.JSX.Element;
interface MatrixAxis {
    label: string;
    domain: [number, number];
    /** Where the quadrants split. Default: the middle of the domain. */
    split?: number;
    format?: Format;
}
interface MatrixPoint {
    label: string;
    x: number;
    y: number;
    /** Bubble area is proportional to size. */
    size?: number;
    highlight?: boolean;
    /** Which side of the bubble the label sits. Default right. */
    labelAt?: "right" | "left" | "top" | "bottom";
}
interface Matrix2x2Props extends ChartSize {
    x: MatrixAxis;
    y: MatrixAxis;
    points: readonly MatrixPoint[];
    /** Quadrant names: top-left, top-right, bottom-left, bottom-right. */
    quadrants?: [string, string, string, string];
    /** The quadrant the slide is about, tinted. */
    focus?: "tl" | "tr" | "bl" | "br";
    /** Largest bubble radius in canvas px. */
    maxRadius?: number;
    callout?: ChartCallout & {
        label: string;
    };
    ariaLabel?: string;
}
/** A 2×2: labelled axes, quadrant names, sized bubbles and direct labels. */
declare function Matrix2x2({ x: xa, y: ya, points, quadrants, focus, maxRadius, callout, ariaLabel, width, height }: Matrix2x2Props): react.JSX.Element;

/** A Harvey ball: 0 (empty) to 4 (full) quarters. Its level is also in the accessible name. */
declare function HarveyBall({ level, size, label }: {
    level: number;
    size?: number;
    label?: string;
}): react.JSX.Element;
interface HarveyColumn {
    key: string;
    label: ReactNode;
    /** `harvey` cells take 0–4; `text` cells take any node. Default `harvey`. */
    kind?: "harvey" | "text";
    /** CSS width, e.g. "14%". */
    width?: string;
}
interface HarveyRow {
    label: ReactNode;
    /** A short line under the row label. */
    detail?: ReactNode;
    cells: Record<string, number | ReactNode>;
    /** The recommended row: marked with a tag and an accent bar, not colour alone. */
    highlight?: boolean;
    /** Tag text on a highlighted row. Default "Recommended". */
    tag?: ReactNode;
}
interface HarveyTableProps {
    columns: readonly HarveyColumn[];
    rows: readonly HarveyRow[];
    /** Header of the row-label column. */
    corner?: ReactNode;
    /** Show the 0–4 key under the table. Default true. */
    showKey?: boolean;
    /** What a full ball means: "Full ball = best". */
    keyNote?: ReactNode;
}
/** Options × criteria: Harvey balls (0–4) and text cells, with one row marked as the recommendation. */
declare function HarveyTable({ columns, rows, corner, showKey, keyNote }: HarveyTableProps): react.JSX.Element;

export { type Band, BarChart, type BarChartProps, type BarDatum, Bento, BentoCell, type BentoCellProps, type BentoProps, Build, CANVAS_HEIGHT, CANVAS_WIDTH, CX_TYPE, Callout, type CalloutGeometry, type CalloutProps, type ChartCallout, type ChartSize, ConsultingSlide, type ConsultingSlideProps, DeckPlayer, type DeckPlayerProps, type DeckPosition, type DeckRenderContext, type DeckSlide, DeckSlideContext, type DeckSlideState, type DeckTheme, type DeckTransition, type FormatOptions, type GridPlacement, HarveyBall, type HarveyColumn, type HarveyRow, HarveyTable, type HarveyTableProps, type KpiDelta, type KpiItem, KpiTiles, LINT_RULES, LineChart, type LineChartProps, type LineSeries, type LinearScale, type LintFinding, type LintOptions, type LintRule, type LintSeverity, MAX_TITLE_WORDS, MIN_TEXT_PX, Matrix2x2, type Matrix2x2Props, type MatrixAxis, type MatrixPoint, Morph, Panel, type PanelProps, REPEATABLE_ROLES, type Rect, Ref, type ResolvedTransition, SLIDE_ROLES, STORYLINE_TEMPLATES, Slide, type SlideRole, type SlideRoleInfo, SlideThumbnail, SoWhat, type SoWhatProps, Sparkline, type StackSegment, StackedBar, type StackedBarProps, type StoryBeat, type StoryMove, type StorySlide, type StorylineEntry, type StorylineTemplate, type StorylineTemplateId, Tracker, type TrackerProps, type TransitionKind, WORDS_PER_MINUTE, Waterfall, type WaterfallBar, type WaterfallInput, type WaterfallProps, bandLayout, barPath, bentoCamera, bentoFocusAt, bubbleRadius, calloutGeometry, deckMotion, flipFrom, formatStoryline, formatValue, formatter, getStorylineTemplate, harveyWedge, linearScale, lintDeck, niceStep, niceTicks, resolveTransition, runTransition, spreadLabels, stackSegments, storylineOf, talkSeconds, templateOutline, textWidth, useDeckSlide, waterfallBars, wrapText, zeroBasedDomain, zoomFrame, zoomSamples };
