import * as react from 'react';
import { ReactNode, ElementType, CSSProperties } from 'react';
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

export { Build, CANVAS_HEIGHT, CANVAS_WIDTH, DeckPlayer, type DeckPlayerProps, type DeckPosition, type DeckRenderContext, type DeckSlide, DeckSlideContext, type DeckSlideState, type DeckTheme, type DeckTransition, LINT_RULES, type LintFinding, type LintOptions, type LintRule, type LintSeverity, MAX_TITLE_WORDS, Morph, REPEATABLE_ROLES, type Rect, type ResolvedTransition, SLIDE_ROLES, STORYLINE_TEMPLATES, Slide, type SlideRole, type SlideRoleInfo, SlideThumbnail, type StoryBeat, type StoryMove, type StorySlide, type StorylineEntry, type StorylineTemplate, type StorylineTemplateId, type TransitionKind, WORDS_PER_MINUTE, deckMotion, flipFrom, formatStoryline, getStorylineTemplate, lintDeck, resolveTransition, runTransition, storylineOf, talkSeconds, templateOutline, useDeckSlide, zoomFrame, zoomSamples };
