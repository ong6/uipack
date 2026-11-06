/**
 * The site spec: every value the tier-1 grader holds a page to, in one JSON-shaped object, so the
 * same checks grade the UiPack playground, junxiong.dev or the blog. A spec file is JSON with any
 * subset of these fields; `resolveSpec` fills the rest from `DEFAULT_SPEC`. docs/grading/site-spec.md
 * documents the shape and where each default comes from.
 *
 * Plain data and pure functions: no DOM, no browser.
 */
interface Viewport {
    /** Names the view in reports and file names ("1440", "390"). */
    name: string;
    width: number;
    height: number;
    /** A phone: touch, a coarse pointer and the coarse tap-target minimum. */
    touch?: boolean;
}
interface ThemeSetup {
    /** Emulated `prefers-color-scheme`. */
    colorScheme: "light" | "dark";
    /** Query parameters added to the URL (the playground reads `?theme=dark`). */
    query?: Record<string, string>;
    /** Attributes set on <html> before any script runs (`{"data-theme": "dark"}`). */
    htmlAttributes?: Record<string, string>;
    /** localStorage entries set before any script runs (a site that remembers the theme there). */
    localStorage?: Record<string, string>;
}
interface SiteSpec {
    /** Names the site in reports. */
    name: string;
    /**
     * Font families text may render in: the first family of every text element's stack must be one
     * of these, and every platform font Chromium actually used for letters must start with one.
     * `null` turns the face checks off (an external page whose faces are not ours to set).
     */
    faces: string[] | null;
    /** CSS custom properties on <body> whose first family is also allowed (`--ui-font-text`). */
    faceVars: string[];
    /** Platform fonts allowed to draw symbols the site faces lack (arrows, ⌘, emoji): warned, not failed. */
    symbolFaces: string[];
    /** The smallest rendered text, in CSS px. */
    minTextPx: number;
    /** Smaller floors inside some regions (`{"selector": "svg", "px": 11}`): the first match wins. */
    textFloors: {
        selector: string;
        px: number;
        why?: string;
    }[];
    /** Smallest tap target, in CSS px: `coarse` on touch views, `fine` on the others. */
    tapTargetPx: {
        coarse: number;
        fine: number;
    };
    /** WCAG contrast minimums: normal text, and large text (24px, or 18.66px at 700 and up). */
    contrast: {
        normal: number;
        large: number;
    };
    /** Allowed height difference, in px, for cards sharing a row and for paired boxes. */
    rowTolerancePx: {
        cards: number;
        paired: number;
    };
    /** Boxes shorter than this are not cards (a chip, a tag). */
    cardMinHeightPx: number;
    viewports: Viewport[];
    themes: {
        light: ThemeSetup;
        dark: ThemeSetup;
    };
    /**
     * The page is ready when `selector` is visible and `gone` (a loading line) has left. Fonts and
     * a scroll to the bottom and back (so lazy sections mount) always follow.
     */
    ready: {
        selector?: string;
        gone?: string;
        settleMs: number;
    };
    /** The region checked: elements outside it are not graded (the default is the whole body). */
    scope: string;
    /** Elements no check reads (a third-party embed, a 3D canvas). */
    ignore: string[];
    /** Elements one check skips, by check id: `{"contrast": [".hero-video *"]}`. */
    ignoreByCheck: Partial<Record<CheckId, string[]>>;
    /** Checks to skip entirely, with the reason recorded in the report. */
    skip: Partial<Record<CheckId, string>>;
    /** Most failing elements a check lists per view (the count is always exact). */
    maxFindings: number;
    /** Most screenshot crops a check saves per view. */
    maxCrops: number;
    /** Most Tab presses the focus walk makes per view. */
    maxTabs: number;
}
/** Every tier-1 check, in the order the report lists them. */
declare const CHECK_IDS: readonly ["overflow-x", "text-clip", "text-overlap", "row-heights", "tap-targets", "contrast", "font-faces", "text-size", "img-alt", "heading-order", "one-h1", "focus-visible", "reduced-motion"];
type CheckId = (typeof CHECK_IDS)[number];
/** What each check proves, one line, for the Markdown summary and the docs. */
declare const CHECK_TITLES: Record<CheckId, string>;
/**
 * The defaults: the UiPack documented values, each with its source. A site spec overrides any of them.
 * - 44px coarse target: docs/web-principles.md (menu "44px touch target"), docs/article.md, docs/charts.md.
 * - 24px fine target: WCAG 2.2 2.5.8; docs/charts.md ("the links in an opened row are 24px and 44px").
 * - 4.5 / 3 contrast: docs/web-principles.md rule 10, docs/design-direction.md.
 * - 12px text: docs/design-direction.md ("Mono captions and secondary text stay at 12px or more").
 * - 11px in figures and charts: e2e/geometry.spec.ts ("the 11px text floor"), docs/charts.md, docs/mechanism.md.
 * - 1px / 2px row tolerance and 80px / 40px card heights: e2e/page-audit.ts checkAlignment and checkPairedBoxes.
 */
declare const DEFAULT_SPEC: SiteSpec;
/**
 * The UiPack playground and any page built on uipack/web: Technical's faces and the documented floors.
 * The CLI reads the faces from docs/specs/technical.md when it can find it; these are the fallback.
 */
declare const UIPACK_SPEC: Partial<SiteSpec>;
/** `base` with `over` laid on top: objects merge key by key, arrays and values replace. */
declare function mergeSpec<T>(base: T, over: unknown): T;
/** Problems with a spec file's contents, as readable lines; empty when it is usable. */
declare function validateSpec(input: unknown): string[];
/**
 * A full spec from a grade config's contents: `extends: "uipack"` starts from the UiPack values,
 * anything else from the defaults. `styleSpec` (a path) is read by the CLI's loadSpec, which lays
 * the style spec's faces under the config's own fields. Throws with every problem listed when the input is invalid.
 */
declare function resolveSpec(input?: unknown): SiteSpec;

/** WCAG colour math on plain [r, g, b, a] values (0–255, alpha 0–1). No DOM. */
type RGBA = readonly [number, number, number, number];
/** `fg` painted over an opaque `bg` (source-over). */
declare function over(fg: RGBA, bg: RGBA): RGBA;
/** Lays translucent layers (top first) over an opaque base; the first opaque layer ends the stack. */
declare function flatten(layers: readonly RGBA[], base?: RGBA): RGBA;
/** WCAG 2 relative luminance of an opaque colour. */
declare function luminance([r, g, b]: RGBA): number;
/** WCAG contrast ratio of `fg` (composited over `bg`, which must be opaque) against `bg`. */
declare function contrastRatio(fg: RGBA, bg: RGBA): number;
/** WCAG large text: 18pt (24px), or 14pt (18.66px) bold. */
declare function isLargeText(px: number, weight: number): boolean;
/** Parses `rgb()` / `rgba()` (comma or space syntax) and `#rgb[a]` / `#rrggbb[aa]`; null otherwise. */
declare function parseColor(input: string): RGBA | null;

/**
 * What the tier-1 grader reads from a rendered page. Each function here runs INSIDE the page (via
 * `page.evaluate`), so it is self-contained: no imports, no outer variables, only its argument.
 * They measure; they do not judge. rules.ts turns these measurements into pass/fail against a
 * site spec, which keeps every threshold testable without a browser.
 *
 * Generalised from e2e/page-audit.ts (cardRows, pairedBoxRows, controlRows, outline, checkTextFaces,
 * checkFocusRingsNotClipped, checkNoOverflow) and e2e/geometry.spec.ts (the SVG text floor), so a
 * page outside the playground is held to the same rules. Boxes are in document coordinates (CSS px
 * from the page's top-left), ready for a full-page screenshot clip.
 */

interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}
/** One element a check points at. */
interface Spot {
    selector: string;
    text: string;
    box: Box;
}
interface TextSample extends Spot {
    px: number;
    weight: number;
    family: string;
    /** Text colour with every ancestor's opacity folded into its alpha; null when not a flat colour. */
    color: RGBA | null;
    /** Backgrounds from the element outwards, until an opaque one; null when an image or gradient is behind. */
    layers: RGBA[] | null;
    /** The page base under every layer (the canvas colour). */
    base: RGBA;
    /** Index into spec.textFloors of the first floor whose selector matches, or -1. */
    floor: number;
    inSvg: boolean;
    disabled: boolean;
    /** Whether the contrast check reads this sample (spec ignore lists applied in the page). */
    contrastable: boolean;
    /**
     * When `layers` is null: the darkest and lightest background behind the text, read from a
     * screenshot with the text hidden (10th and 90th percentile of luminance, so an underline or a
     * stray pixel does not decide it).
     */
    sampled?: RGBA[];
}
interface ClipSample extends Spot {
    /** The clipping box: the element itself or the ancestor that hides the overflow. */
    clipBy: string;
    overflowPx: number;
}
interface RowSample {
    kind: "cards" | "paired" | "controls";
    where: string;
    heights: number[];
    /** Top of each card's last action (link or button), or null when a card has none. */
    actions: (number | null)[] | null;
    boxes: Box[];
}
interface TargetSample extends Spot {
    inline: boolean;
}
interface Measurements {
    url: string;
    title: string;
    viewport: {
        width: number;
        height: number;
    };
    scrollWidth: number;
    docHeight: number;
    /** Elements that start the horizontal overflow (their right edge is past the viewport, their parent's is not). */
    overflowers: Spot[];
    clipped: ClipSample[];
    texts: TextSample[];
    /** Each text node's line boxes, for the overlap check; `owner` indexes `texts`. */
    lines: {
        owner: number;
        rects: Box[];
    }[];
    rows: RowSample[];
    targets: TargetSample[];
    images: (Spot & {
        issue: string;
    })[];
    headings: (Spot & {
        level: number;
    })[];
    /** Platform-font sample: elements marked with data-uipack-grade-font for the CDP pass. */
    fontSamples: number;
    bodyBackground: string;
}
interface MeasureOptions {
    scope: string;
    ignore: string[];
    ignoreByCheck: Record<string, string[] | undefined>;
    floors: string[];
    cardMinHeight: number;
    maxFontSamples: number;
}
/** Measures one rendered page. Runs in the browser. */
declare function measurePage(opt: MeasureOptions): Measurements;
/** One step of the keyboard walk: the focused element, its focus styles, and whether a box clips its ring. Runs in the browser. */
interface FocusSample extends Spot {
    /** Whether any drawn property differs between focused and unfocused, or a ring is drawn. */
    indicator: boolean;
    /** Why the indicator reads as visible ("outline 2px", "box-shadow", "background"…), or empty. */
    how: string;
    /** Set when the ring reaches past a box that clips or scrolls. */
    clippedBy: string | null;
    /** A crop taken while the element held focus (run.ts), relative to the report. */
    crop?: string;
}
declare function measureFocus(ignore: string): FocusSample | null;
/** Animations still running at rest, and SVG animations not paused. Runs in the browser. */
interface MotionSample extends Spot {
    what: string;
}
declare function measureMotion(ignore: string): MotionSample[];

type Status = "pass" | "fail" | "warn" | "skip";
interface Finding {
    selector: string;
    text: string;
    detail: string;
    severity: "fail" | "warn";
    box?: Box;
    /** Path of the screenshot crop, relative to the report. */
    crop?: string;
}
interface CheckResult {
    id: CheckId;
    status: Status;
    /** How many things the check read (texts, targets, rows…): a pass over nothing says so. */
    checked: number;
    /** Exact number of failures (findings may be capped by spec.maxFindings). */
    failures: number;
    findings: Finding[];
    note?: string;
}
/** A platform font Chromium used to draw an element's text (CDP CSS.getPlatformFontsForNode). */
interface PlatformFontUse {
    selector: string;
    text: string;
    box: Box;
    fonts: {
        familyName: string;
        postScriptName?: string;
        glyphCount: number;
    }[];
}
/** What the browser-driven passes add to the page measurements. */
interface Extras {
    /** Platform fonts per sampled element; null when the browser cannot report them (not Chromium). */
    platformFonts: PlatformFontUse[] | null;
    focus: FocusSample[];
    /** Number of Tab presses that reached nothing (focus left the page or stayed on body). */
    focusMisses: number;
    motion: MotionSample[];
    /** Where two frames 1s apart under reduced motion differ, or null when they match. */
    frameDiff: {
        box: Box;
        changedPixels: number;
    } | null;
    touch: boolean;
    /** Overlap pairs a reader sees (both texts change the pixels where they meet); all count when absent. */
    visibleOverlaps?: [number, number][];
}
declare function checkOverflow(m: Measurements, spec: SiteSpec): CheckResult;
declare function checkTextClip(m: Measurements, spec: SiteSpec): CheckResult;
/**
 * Pairs of line boxes from different elements that cover each other: the shared area is at least
 * `share` of the smaller box. Tight leading makes lines of one paragraph touch (about a fifth of a
 * line), so the default share of 0.4 leaves that alone. Each pair comes with the shared box.
 */
declare function findOverlaps(lines: {
    owner: number;
    rects: Box[];
}[], share?: number): [number, number, Box][];
declare function checkTextOverlap(m: Measurements, spec: SiteSpec, visible?: [number, number][]): CheckResult;
declare function checkRows(m: Measurements, spec: SiteSpec): CheckResult;
declare function checkTargets(m: Measurements, spec: SiteSpec, touch: boolean): CheckResult;
/** The ratio a text sample reaches, or null when its background is an image or gradient. */
declare function sampleContrast(t: TextSample): number | null;
declare function checkContrast(m: Measurements, spec: SiteSpec): CheckResult;
/** The first family of a CSS font-family stack, unquoted. */
declare const firstFamily: (stack: string) => string;
/** Whether a platform font is one of the allowed faces (by family name or PostScript name). */
declare function faceAllowed(font: {
    familyName: string;
    postScriptName?: string;
}, faces: string[]): boolean;
declare function checkFaces(m: Measurements, spec: SiteSpec, platform: PlatformFontUse[] | null, varFaces: string[]): CheckResult;
declare function checkTextSize(m: Measurements, spec: SiteSpec): CheckResult;
declare function checkImages(m: Measurements, spec: SiteSpec): CheckResult;
declare function checkHeadingOrder(headings: {
    level: number;
    selector: string;
    text: string;
    box?: Box;
}[], spec: SiteSpec): CheckResult;
declare function checkOneH1(headings: {
    level: number;
    selector: string;
    text: string;
    box?: Box;
}[], spec: SiteSpec): CheckResult;
declare function checkFocus(samples: FocusSample[], misses: number, spec: SiteSpec): CheckResult;
declare function checkMotion(motion: MotionSample[], frameDiff: Extras["frameDiff"], spec: SiteSpec): CheckResult;
/** Every check for one view, in report order; a check the spec skips is listed with its reason. */
declare function evaluateView(m: Measurements, x: Extras, spec: SiteSpec, varFaces: string[]): CheckResult[];

/** The tier-1 report: one JSON shape for CI and agents, and a short Markdown summary for people. */

declare const REPORT_VERSION = 1;
interface ViewReport {
    /** "1440-light", "390-dark". */
    view: string;
    viewport: {
        width: number;
        height: number;
        touch: boolean;
    };
    theme: "light" | "dark";
    /** False when the dark view rendered with the light view's page colour: the theme switch did nothing. */
    themeApplied: boolean;
    bodyBackground: string;
    /** Full-page screenshot, relative to the report. */
    screenshot?: string;
    checks: CheckResult[];
    errors: string[];
}
interface GradeReport {
    tool: "uipack-grade";
    reportVersion: number;
    url: string;
    title: string;
    spec: string;
    startedAt: string;
    durationMs: number;
    /** True when no check failed in any view: the gate. */
    passed: boolean;
    /** Per check, across views: the worst status and the views that failed. */
    summary: Record<CheckId, {
        status: Status;
        failures: number;
        failedViews: string[];
    }>;
    views: ViewReport[];
}
declare function summarise(views: ViewReport[]): Pick<GradeReport, "passed" | "summary">;
/** The Markdown summary: the verdict, a check-by-view table, then the top findings of each failing check. */
declare function toMarkdown(report: GradeReport, topPerCheck?: number): string;

interface Bitmap {
    width: number;
    height: number;
    /** RGBA, 4 bytes per pixel, row by row. */
    data: Uint8Array;
}
declare function decodePng(buf: Uint8Array): Bitmap;
/**
 * Where two same-sized bitmaps differ: the bounding box of changed pixels and their count, or null
 * when every pixel matches within `tolerance` (per channel, 0–255).
 */
declare function diffBitmaps(a: Bitmap, b: Bitmap, tolerance?: number): {
    box: Box;
    changedPixels: number;
} | null;

interface PwPage {
    goto(url: string, o?: object): Promise<unknown>;
    evaluate<T>(fn: string): Promise<T>;
    addInitScript(script: string): Promise<void>;
    waitForTimeout(ms: number): Promise<void>;
    waitForSelector(sel: string, o?: object): Promise<unknown>;
    screenshot(o?: object): Promise<Buffer>;
    keyboard: {
        press(key: string): Promise<void>;
    };
    mouse: {
        move(x: number, y: number): Promise<void>;
    };
    on(event: "pageerror", fn: (e: Error) => void): void;
}
interface PwSession {
    send<T = unknown>(method: string, params?: object): Promise<T>;
}
interface PwContext {
    newPage(): Promise<PwPage>;
    newCDPSession(page: PwPage): Promise<PwSession>;
    close(): Promise<void>;
}
interface PwBrowser {
    newContext(o: object): Promise<PwContext>;
    close(): Promise<void>;
}
interface Pw {
    chromium: {
        launch(o?: object): Promise<PwBrowser>;
    };
}
/** Imports Playwright from the consumer's node_modules; the specifier is a variable so bundlers leave it alone. */
declare function loadPlaywright(): Promise<Pw>;
declare function withQuery(url: string, query?: Record<string, string>): string;
interface GradeOptions {
    /** Where report.json, summary.md, shots/ and crops/ go; nothing is written when omitted. */
    outDir?: string;
    /** Themes to grade (default both). */
    themes?: ("light" | "dark")[];
    /** Viewport names to grade (default every spec viewport). */
    views?: string[];
    /** Full-page screenshots per view (default true when outDir is set). */
    screenshots?: boolean;
    /** Progress lines (default silent). */
    log?: (line: string) => void;
}
/** Grades one URL against a resolved spec. Resolves with the report; never throws for a failing page. */
declare function gradeUrl(url: string, spec: SiteSpec, opts?: GradeOptions): Promise<GradeReport>;

/**
 * Tier-2 tally: turns blinded judge verdicts back into "B vs A" results with the packet key.
 * Pairwise first: the preference is the result; scores matter only as paired deltas (same judge,
 * same rubric, same sitting) and relative to the calibration anchor. Pure functions.
 */
/** Which source each label stood for in one judge's packet. */
interface PacketKey {
    packets: Record<string, {
        A: "a" | "b";
        B: "a" | "b";
    }>;
    sources: {
        a: string;
        b: string;
        anchor?: string;
    };
    rubric: {
        file: string;
        version: string;
        sha256: string;
    };
    brief: {
        file: string;
        sha256: string;
    };
    createdAt: string;
}
/** What a judge returns (docs/grading/protocol.md, "Judge output"). */
interface JudgeVerdict {
    packet: string;
    rubric: string;
    rubricVersion: string;
    criteria: {
        id: string;
        A: number;
        B: number;
        R?: number;
        evidence?: unknown;
    }[];
    overall: {
        A: number;
        B: number;
        R?: number;
    };
    preference: "A" | "B" | "tie";
    margin?: "slight" | "clear" | "decisive";
    defects?: unknown;
}
interface Tally {
    judges: number;
    /** Share of judges preferring b (ties count half). */
    winRateB: number;
    /** b minus a, overall, per judge, then the mean. */
    overallDeltas: number[];
    meanOverallDelta: number;
    /** b minus a per criterion, mean across judges. */
    criterionDeltas: Record<string, number>;
    /** Mean scores of a, b and the anchor: read a target relative to the anchor, never alone. */
    mean: {
        a: number;
        b: number;
        anchor: number | null;
    };
    /** a and b minus the anchor's score (null without an anchor). */
    relativeToAnchor: {
        a: number;
        b: number;
    } | null;
    /** How many judges preferred whichever side they saw as A: all of them hints at position bias. */
    preferredFirstShown: number;
    /** Two judges' overall deltas differ by 2 or more, or their preferences point opposite ways. */
    disagreement: boolean;
    needsThirdJudge: boolean;
    problems: string[];
}
declare function tallyJudges(key: PacketKey, verdicts: JudgeVerdict[]): Tally;
declare function formatTally(t: Tally): string;

/** The capture every candidate gets: full page, reduced motion, settled, 2x on the phone views. */
declare const PACKET_VIEWS: readonly [{
    readonly name: "1440-light";
    readonly width: 1440;
    readonly height: 900;
    readonly scale: 1;
    readonly theme: "light";
}, {
    readonly name: "1440-dark";
    readonly width: 1440;
    readonly height: 900;
    readonly scale: 1;
    readonly theme: "dark";
}, {
    readonly name: "390-light";
    readonly width: 390;
    readonly height: 844;
    readonly scale: 2;
    readonly theme: "light";
}, {
    readonly name: "390-dark";
    readonly width: 390;
    readonly height: 844;
    readonly scale: 2;
    readonly theme: "dark";
}];
/**
 * Words that tell a judge which side is which, or that a side is the system under test. A brief or
 * a rubric containing one is rejected: the coordinator rewrites it.
 */
declare const HINT_PATTERNS: RegExp[];
/** Hint words found in a text, as the matched phrases. */
declare function findHints(text: string): string[];
/** A regression-set brief (docs/grading/regression/<type>/brief-<n>.v<N>.json). */
interface RegressionBrief {
    id: string;
    version: number;
    frozen: string;
    pageType: string;
    rubric: string;
    product: string;
    audience: string;
    task: string;
    facts: string[];
    mustInclude?: string[];
    outOfScope?: string[];
}
/** The brief as a judge and a builder read it: the task, the audience and the frozen facts. */
declare function briefMarkdown(b: RegressionBrief): string;
/** The rubric's version from its frontmatter (`version: 1`); throws when missing. */
declare function rubricVersion(text: string): string;
/** A small seeded RNG (mulberry32) for reproducible orders in tests; crypto randomness otherwise. */
declare function seeded(seed: number): () => number;
/** The A/B assignment for each judge: judge-2 is judge-1 reversed, judge-3 is drawn fresh. */
declare function assignOrders(coin: () => boolean): PacketKey["packets"];
declare const JUDGE_PROMPT: (version: string, hasAnchor: boolean) => string;
interface PacketOptions {
    brief: string;
    rubric: string;
    a: string;
    b: string;
    anchor?: string;
    outDir: string;
    keyFile: string;
    seed?: number;
}
declare function buildPacket(o: PacketOptions): Promise<{
    packets: string[];
    keyFile: string;
}>;

/**
 * Tier-3 fix ledger: one JSON line per claimed fix (docs/grading/fix-ledger.md). A fix counts only
 * when it lives somewhere a producer reads, the next producer is shown to have used it, and someone
 * other than the improver checked that. Pure validation.
 */
interface LedgerEntry {
    id: string;
    /** The defect it answers: the judge packet and the words (`"judge-2 r3: hero is an empty box"`). */
    defect: string;
    /** What was changed, in one sentence. */
    claimedFix: string;
    /** Where the fix lives: a repo, a path and the commit that holds it. */
    livesAt: {
        repo: string;
        path: string;
        commit: string;
    };
    /** Who made the fix (an agent id or a person). */
    improver: string;
    /** Proof the next producer used it: the run, and the evidence (a transcript line, an import, a version string). */
    proof?: {
        producerRun: string;
        evidence: string;
    };
    /** Who checked the proof; never the improver. */
    checkedBy?: string;
    status: "claimed" | "verified" | "failed";
    /** The regression-set brief ids the fix was measured on. */
    measuredOn?: string[];
}
/** Problems in a ledger, one line each, prefixed with the entry's line number and id. */
declare function validateLedger(entries: unknown[]): string[];

/**
 * A spec from `default`, `uipack`, a style spec (`docs/specs/<id>.md`, a site's `STYLE.md`) or a
 * grade config (JSON; its `styleSpec` path, relative to the config, supplies the faces).
 */
declare function loadSpec(arg: string | true | undefined): SiteSpec;
declare function main(argv: string[]): Promise<number>;

/** Faces named in a style spec: the first family of each `--ui-font-*` role, else the Type table's faces. */
declare function facesFromStyleSpec(text: string): string[];
/** The site-spec fields a style spec supplies: its id as the name, and its faces. */
declare function specFromStyleDoc(text: string): Partial<SiteSpec>;

export { CHECK_IDS, CHECK_TITLES, type CheckId, type CheckResult, type ClipSample, DEFAULT_SPEC, type Extras, type Finding, type FocusSample, type Box as GradeBox, type GradeOptions, type GradeReport, HINT_PATTERNS, JUDGE_PROMPT, type JudgeVerdict, type LedgerEntry, type Measurements, type MotionSample, PACKET_VIEWS, type PacketKey, type PacketOptions, type PlatformFontUse, REPORT_VERSION, type RGBA, type RegressionBrief, type RowSample, type SiteSpec, type Spot, type Status, type Tally, type TargetSample, type TextSample, type ThemeSetup, UIPACK_SPEC, type ViewReport, type Viewport, assignOrders, briefMarkdown, buildPacket, checkContrast, checkFaces, checkFocus, checkHeadingOrder, checkImages, checkMotion, checkOneH1, checkOverflow, checkRows, checkTargets, checkTextClip, checkTextOverlap, checkTextSize, contrastRatio, decodePng, diffBitmaps, evaluateView, faceAllowed, facesFromStyleSpec, findHints, findOverlaps, firstFamily, flatten, formatTally, gradeUrl, isLargeText, loadPlaywright, loadSpec, luminance, main, measureFocus, measureMotion, measurePage, mergeSpec, over, parseColor, resolveSpec, rubricVersion, sampleContrast, seeded, specFromStyleDoc, summarise, tallyJudges, toMarkdown, validateLedger, validateSpec, withQuery };
