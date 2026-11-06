export { F as Figure, a as FigureProps } from './Figure-BF4fCFY_.cjs';
export { S as StyleBootOptions, a as StyleBootPlugin, U as UiStyleId, b as UiStyleMeta, i as isUiStyle, r as readStyle, s as sectionOrder, c as sharedSectionOrder, d as styleBootPlugin, e as styleBootScript, u as uiStyles } from './style-oR-5TVuD.cjs';
import { T as TokenKind, a as TokenShape, L as LegendItem } from './Legend-n6GikDm_.cjs';
export { b as Legend, c as LegendProps, d as TOKEN_SHAPE, e as Token, f as TokenProps, t as tokenColor } from './Legend-n6GikDm_.cjs';
import * as react from 'react';
import { ReactNode } from 'react';
import { I as IconName } from './index-BCiSvaJI.cjs';
export { i as icons } from './index-BCiSvaJI.cjs';
export { F as FigureChrome, a as FigureChromeContext, b as FigureMotion, c as FigureMotionContext, u as useFigureMotion } from './context-Baoq0bBr.cjs';
export { Z as ZoomFrame, R as ZoomRect, a as ZoomSample, b as ZoomSampleOptions, i as innerClipStart, z as zoomFrame, c as zoomSamples } from './zoom-math-DJBPrdGD.cjs';
export { e as easeInOutCubic, s as smoothstep } from './math-DL8QKXOl.cjs';

type Flow = string | string[];
interface FigureHover {
    /** Flow name under the pointer, or null. */
    flow: string | null;
    /** Legend kind under the pointer, or null. */
    kind: string | null;
    setFlow: (flow: string | null) => void;
    setKind: (kind: string | null) => void;
}
declare const FigureHoverContext: react.Context<FigureHover>;
declare function useFigureHover(): FigureHover;
declare const flowList: (flow?: Flow) => string[];
/**
 * Data attributes for an element that takes part in hover highlighting.
 * `data-state` is "hit" when the element shares the hovered flow or kind,
 * "dim" when something else is hovered, absent when nothing is.
 */
declare function hoverAttrs(flow: Flow | undefined, kind: string | undefined, hover: FigureHover): Record<string, string>;
/** Ignore touch so a tap does not leave a figure stuck in hover state. */
declare const isPointer: (e: {
    pointerType?: string;
}) => boolean;

interface LaneProps {
    /** Left edge and width of the column the header sits over. */
    x: number;
    w: number;
    y: number;
    title: string;
    /** Draw a faint vertical rule down to `h`. */
    h?: number;
    size?: number;
    /** Flow names of the column; the header fades with the rest when another flow is hovered. */
    flow?: Flow;
}
/** Mono uppercase column header (CLIENTS / PLATFORM / STORAGE). */
declare function Lane({ x, w, y, title, h, size: size0, flow }: LaneProps): react.JSX.Element;

interface GroupProps {
    x: number;
    y: number;
    w: number;
    h: number;
    title?: string;
    /** "solid" draws a boxed region with a centred title (a service); "dashed" an environment or boundary. */
    variant?: "solid" | "dashed";
    accent?: boolean;
    /** Flow names for hover highlighting. */
    flow?: Flow;
    titleSize?: number;
    /** One short sentence on what the region is. Makes the group selectable inside a Figure. */
    hint?: string;
    children?: ReactNode;
}
declare function Group({ x, y, w, h, title, variant, accent, flow, titleSize, hint, children }: GroupProps): react.JSX.Element;

interface NodeProps {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    /** Mono second line: a role, a count, a path. */
    sub?: string;
    /** An icon name from uipack/icons or any SVG fragment drawn in a 16×16 box. */
    icon?: IconName | ReactNode;
    /** Centre the text instead of left-aligning it after the icon. */
    align?: "left" | "center";
    /** Accent border and title. */
    accent?: boolean;
    dashed?: boolean;
    /** Flow names this node takes part in; hovering it highlights the flow. */
    flow?: Flow;
    /** One short sentence on what the box does. Inside a Figure, selecting the node shows it in a note beside the box; elsewhere it is a native tooltip. */
    hint?: string;
    /** Makes the node a link with a focus ring. */
    href?: string;
    size?: number;
    subSize?: number;
    id?: string;
    /** Drawn inside the box, above its fill and under the icon and text (a drill-down preview). */
    inlay?: ReactNode;
}
declare function Node({ x, y, w, h, label, sub, icon, align, accent, dashed, flow, hint, href, size: size0, subSize: subSize0, id, inlay, }: NodeProps): react.JSX.Element;

interface ChipProps {
    x: number;
    y: number;
    w: number;
    h?: number;
    label?: string;
    /** Empty slot. */
    dashed?: boolean;
    /** Filled with a token hue (a busy slot, an overloaded flag). */
    kind?: "request" | "response" | "change" | "accent";
    /** Flow names for hover highlighting. */
    flow?: Flow;
    size?: number;
    /** One short sentence on what the chip stands for. Makes it selectable inside a Figure. */
    hint?: string;
    /** "pill" (default) for a slot or flag; "tag" is a small-radius box for a symbol, a key or a call (`PARSE()`). */
    shape?: "pill" | "tag";
    /** A lighter wash of `kind`: the older or unchanged one beside a full-tint chip. */
    soft?: boolean;
}
/** Pill: a connection slot, a request in a queue, a status flag. */
declare function Chip({ x, y, w, h, label, dashed, kind, flow, size: size0, hint, shape, soft }: ChipProps): react.JSX.Element;

type Point = [number, number];
type Side = "top" | "right" | "bottom" | "left";
interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}
/** A point on a box edge. `t` slides along the edge, 0..1, default centre. */
declare function anchor(box: Box, side: Side, t?: number): Point;
/**
 * Orthogonal route between two points. `via` picks the elbow: "h" goes
 * horizontal first, "v" vertical first, a number is an absolute x (for "h")
 * or y (for "v") where the turn happens. Straight lines get no elbow.
 */
declare function route(from: Point, to: Point, via?: "h" | "v" | number, axis?: "h" | "v"): Point[];
/** SVG path data through the points with rounded corners of `radius`. */
declare function pathFromPoints(points: Point[], radius?: number): string;
/** Total length of a polyline and the point `t` (0..1) of the way along it. */
declare function pointAlong(points: Point[], t: number): Point;
/** Length of a polyline in user units. */
declare function polylineLength(points: Point[]): number;
/**
 * Shorten a polyline by `start` units at its first point and `end` units at
 * its last, walking along the segments. Used so an arrowhead stops short of a
 * node border and a packet stops short of the arrowhead. Never inverts: if the
 * trims meet, the polyline collapses to its midpoint.
 */
declare function trim(points: Point[], start?: number, end?: number): Point[];
/**
 * The figure grid, in viewBox units: the spacing every hand-drawn figure and preset sits on, and
 * the width below which a figure shows its authored narrow drawing (theme.css). The layout docs
 * state these through `npm run docs:sync`.
 */
declare const FIGURE_GRID: {
    readonly step: 8;
    readonly margin: 40;
    readonly flowGap: 40;
    readonly minFlowGap: 32;
    readonly groupGap: 64;
    readonly groupPadding: 24;
    readonly nodeHeight: 56;
    readonly nodeHeightWithSub: 72;
    readonly narrowBelow: 720;
};
/** Snap a value to the 8px grid. */
declare const grid: (v: number, step?: number) => number;

type ConnectorKind = "request" | "response" | "change" | "accent";
interface ConnectorProps {
    /** Polyline in user units; use `route()` to build an orthogonal one. */
    points: Point[];
    /** Marker prefix from `<Defs id>`; required for an arrowhead. */
    defs?: string;
    /**
     * One arrowhead at the last point. A request/response pair is one connector
     * drawn in the request direction; the response packet rides it `reverse`.
     */
    arrow?: boolean;
    dashed?: boolean;
    /** Colour the stroke and head by token kind. */
    kind?: ConnectorKind;
    /** Flow names for hover highlighting. */
    flow?: Flow;
    /** Id for tests or `<use>`. */
    id?: string;
    radius?: number;
    strokeWidth?: number;
    /**
     * Units the path stops short of its first and last point, so the line and
     * its head never touch a node border. Default 2 at both ends; the head end
     * gets 2 more so the tip sits clear.
     */
    inset?: number | [number, number];
}
declare function connectorStroke(kind?: ConnectorKind): string;
declare function Connector({ points, defs, arrow, dashed, kind, flow, id, radius, strokeWidth, inset, }: ConnectorProps): react.JSX.Element;

interface BusStub {
    /** Position along the trunk (y for a vertical bus, x for a horizontal one). */
    at: number;
    /** Where the stub ends: the node edge's x (vertical bus) or y (horizontal). */
    to: number;
    flow?: Flow;
    /** Arrowhead at the node end: only for a stub that enters a node, never one that leaves it. */
    arrow?: boolean;
}
interface BusProps {
    axis?: "v" | "h";
    /** Trunk position: x for vertical, y for horizontal. */
    at: number;
    /** Trunk extent along its axis. */
    from: number;
    to: number;
    stubs: BusStub[];
    kind?: ConnectorKind;
    flow?: Flow;
    /** Marker prefix from `<Defs id>`, needed by any stub with `arrow`. */
    defs?: string;
    /** Draw a junction dot where each stub meets the trunk. Default true. */
    dots?: boolean;
    id?: string;
}
/** Points of one stub, trunk junction first, node edge last. */
declare function busStub(props: Pick<BusProps, "axis" | "at">, stub: BusStub): Point[];
/** Points of every stub, in order, for packets to ride. */
declare function busStubs(props: Pick<BusProps, "axis" | "at" | "stubs">): Point[][];
/**
 * A trunk with stubs and a junction dot at each join. Stubs carry no
 * arrowhead unless they enter a node; direction comes from the packets.
 */
declare function Bus({ axis, at, from, to, stubs, kind, flow, defs, dots, id }: BusProps): react.JSX.Element;

interface PacketProps {
    /** Same points as the Connector it rides. */
    points: Point[];
    kind?: TokenKind;
    shape?: TokenShape;
    /** Seconds for one trip. */
    dur?: number;
    /** Seconds before the first trip; negative starts mid-path. */
    delay?: number;
    /**
     * Where the static token sits under reduced motion or before mount, 0..1
     * along the trip. Default spreads packets that share a path by their
     * `delay`: `(0.5 + delay / dur) mod 1`.
     */
    at?: number;
    r?: number;
    /** Ride the path backwards (a response). */
    reverse?: boolean;
    radius?: number;
    /** Flow names for hover highlighting. */
    flow?: Flow;
    /**
     * Units the trip stops short of the connector's source end and its
     * arrowhead end (in the connector's own direction, whatever `reverse`
     * says), so the token never sits on a node border or an arrowhead.
     * Default `r + 2` and 12.
     */
    trim?: [number, number];
    /**
     * Pop out at the start of each trip and shrink away at the end, as if the
     * token leaves one box and is drawn into the next. Default true; false
     * keeps a constant size.
     */
    emerge?: boolean;
    id?: string;
}
/** Seconds of the pop at the start of a trip and of the shrink at its end. */
declare const PACKET_POP = 0.28;
declare const PACKET_SINK = 0.32;
/**
 * The scale keyframes of one trip, as SMIL attributes: 0 to a slight
 * overshoot and back to 1 (ease out), a hold, then an accelerating shrink to
 * 0. The pop and the shrink last the same seconds whatever the trip's length,
 * capped at a fifth of the trip each so a short hop still travels.
 */
declare function packetScaleKeys(dur: number): {
    values: string;
    keyTimes: string;
    keySplines: string;
};
/**
 * A token moving along a polyline with SMIL `animateMotion`. It pops out as
 * it leaves and shrinks away as it arrives (`emerge`), on the same clock as
 * the motion. Under
 * prefers-reduced-motion it renders once at `at` and never moves. Pause and
 * Replay come from the enclosing Figure, which drives the SVG timeline
 * (pauseAnimations, setCurrentTime), so offsets survive a replay.
 */
declare function Packet({ points, kind, shape, dur, delay, at, r, reverse, radius, flow, trim: t, emerge, id, }: PacketProps): react.JSX.Element;

interface BadgeProps {
    cx: number;
    cy: number;
    text: string;
    accent?: boolean;
    r?: number;
    size?: number;
}
/** A circled step number on a node corner or a connector. */
declare function Badge({ cx, cy, text, accent, r, size: size0 }: BadgeProps): react.JSX.Element;

interface WallProps {
    /** Position across the wall's axis: x for a standing wall, y for a lying one. */
    at: number;
    /** Start and end along the wall's axis. */
    from: number;
    to: number;
    /** Centres along the axis where something passes; each opens a gap. */
    holes?: number[];
    /** "v" stands up (x = at), "h" lies across (y = at). Default "v". */
    axis?: "v" | "h";
    /** Slab thickness in user units. Default 16. */
    thickness?: number;
    /** Half the opening at each hole. Default 9. */
    gap?: number;
    /** Flow names for hover highlighting. */
    flow?: Flow;
}
/** The solid runs of a wall between its holes, as [start, end] pairs along the axis. */
declare function wallSegments(from: number, to: number, holes?: readonly number[], gap?: number): [number, number][];
/**
 * A wall: solid slabs with a gap wherever an item passes. One layer of a
 * defence-in-depth figure, a filter, a boundary that lets some lines through.
 * Lines that stop at it end short of the slab; lines that pass go through a hole.
 */
declare function Wall({ at, from, to, holes, axis, thickness: t, gap, flow }: WallProps): react.JSX.Element;

interface CrossProps {
    /** Centre of the mark. */
    x: number;
    y: number;
    /** Half the mark's width in user units. Default 5. */
    r?: number;
    /** Colour by token kind; default the ink. */
    kind?: ConnectorKind;
}
/**
 * A ✕ where something stops: a lost message at the end of a dashed Connector
 * with `arrow={false}`, a dropped item, a refused call. End the connector
 * `r + 6` units short of where the line would have arrived.
 */
declare function Cross({ x, y, r, kind }: CrossProps): react.JSX.Element;

interface TreeRailProps {
    /** The trunk's x. */
    x: number;
    /** Where the trunk starts (under the parent's mark). */
    y: number;
    /** One y per child row; the trunk runs to the last. */
    rows: number[];
    /** Where each branch ends: one x for every row, or one per row. */
    to: number | number[];
}
/** A trunk with a square elbow to every child row and a junction dot at each join, as on a Bus. */
declare function TreeRail({ x, y, rows, to }: TreeRailProps): react.JSX.Element | null;
interface TreeMarkProps {
    /** Left edge of the mark. */
    x: number;
    /** Vertical centre of the row. */
    y: number;
    /** Width; the height follows. Default 22 for a folder, 16 for a file. */
    size?: number;
    /** Fill with the accent wash instead of the surface. */
    tint?: boolean;
}
/** A folder outline with a tab. */
declare function FolderMark({ x, y, size, tint }: TreeMarkProps): react.JSX.Element;
/** A page with a folded corner. */
declare function FileMark({ x, y, size, tint }: TreeMarkProps): react.JSX.Element;
interface SheetProps {
    x: number;
    y: number;
    w: number;
    h: number;
    /** The file's name: a path, an ID, a hash. Drawn as the sheet's tracked mono eyebrow. */
    name?: string;
    /** Sans title under the name. */
    title?: string;
    /** Muted note after the title. */
    note?: string;
    /** Where the title row starts, from the sheet's left edge. Default 20. */
    titleX?: number;
    /** Header height (eyebrow and title row); the rule under it is drawn when the sheet has children. Default 76 with a name, 52 without. */
    head?: number;
    /** Accent outline and eyebrow: the sheet the figure is about. */
    accent?: boolean;
    /** Drawn inside, under the header (rows, chips). */
    children?: ReactNode;
    size?: number;
    /** Flow names this file takes part in; hovering it highlights the flow, as a Node does. */
    flow?: Flow;
    /** One short sentence on what the file holds. Makes the sheet selectable inside a Figure. */
    hint?: string;
}
/**
 * A file as a card in the Technical box language: 6px corners like a Node,
 * the file's name as a tracked mono eyebrow (as a dashed Group or a Figure
 * labels itself), a title and note under it, and its contents below a rule.
 */
declare function Sheet({ x, y, w, h, name, title, note, titleX, head: head0, accent, children, size: size0, flow, hint, }: SheetProps): react.JSX.Element;

type CurvePoint = [number, number];
interface CurveNote {
    /** Where on the curve, 0..1 along the x axis. */
    at: number;
    label: string;
    /** Height of the pin's stem above the point. Default 24. */
    dy?: number;
    /** Negative puts the label left of the stem (it also flips by itself at the plot's right edge). */
    dx?: number;
    /** The figure's one highlighted point: an accent dot and accent text. */
    accent?: boolean;
}
interface CurveMeasure {
    /** Where, 0..1 along the x axis. */
    at: number;
    label: string;
}
interface CurvePlotProps {
    /** Plot box: the axes' origin is its bottom-left corner. */
    x: number;
    y: number;
    w: number;
    h: number;
    /** Data in 0..1 on both axes, x increasing. Drawn as a smooth curve through every point. */
    points: CurvePoint[];
    xTitle?: string;
    yTitle?: string;
    /** Labels under the two ends of the x axis, e.g. ["None", "All"]. */
    xEnds?: [string, string];
    notes?: CurveNote[];
    measure?: CurveMeasure;
    size?: number;
}
/**
 * Monotone cubic (Fritsch–Carlson) through the points as cubic Bézier
 * segments: it never overshoots a plateau or dips past a level stretch, so a
 * flat run stays flat.
 */
declare function curveSegments(pts: CurvePoint[]): [CurvePoint, CurvePoint, CurvePoint, CurvePoint][];
/** The curve's y (0..1) at x (0..1). The control points sit at thirds, so x is linear in t. */
declare function curveAt(pts: CurvePoint[], x: number): number;
declare function CurvePlot({ x, y, w, h, points, xTitle, yTitle, xEnds, notes, measure, size: size0 }: CurvePlotProps): react.JSX.Element;

interface LabelProps {
    x: number;
    y: number;
    text: string;
    anchor?: "start" | "middle" | "end";
    accent?: boolean;
    size?: number;
    /** Mono is the default; sans for a sentence. */
    font?: "mono" | "sans";
}
/** Text with a page-coloured underlay so it can sit on a connector. */
declare function Label({ x, y, text, anchor, accent, size: size0, font }: LabelProps): react.JSX.Element;

interface DefsProps {
    /** Prefix for marker ids; keep unique per SVG on the page. */
    id: string;
}
/** Arrowhead markers. `url(#<id>-head)` and `url(#<id>-head-accent)`. */
declare function Defs({ id }: DefsProps): react.JSX.Element;

declare const marks: {
    uipack: react.JSX.Element;
    groundplane: react.JSX.Element;
    jobforge: react.JSX.Element;
    skillsmith: react.JSX.Element;
    deckforge: react.JSX.Element;
    proofpack: react.JSX.Element;
    fieldpack: react.JSX.Element;
    skillpack: react.JSX.Element;
};
type MarkName = keyof typeof marks;
/** The uipack wordmark: the mark plus the name in mono. */
declare function Wordmark({ size }: {
    size?: number;
}): react.JSX.Element;

/**
 * Text floor for one drawing. `floor` is in user units: the smallest font size
 * that still renders at `minFont` CSS pixels once the SVG is scaled from its
 * viewBox width to the width it is shown at.
 */
interface FigureScale {
    floor: number;
}
/** Width a figure is assumed to render at before it is measured (the prose breakout on junxiong.dev). */
declare const DEFAULT_RENDER_WIDTH = 1088;
/** User-unit floor for a drawing `vbWidth` wide shown at `renderWidth` CSS px. */
declare function fontFloor(vbWidth: number, renderWidth: number, minFont: number): number;
/** Wrap a drawing that is rendered outside a Figure (static export, tests). */
declare function FigureScaleProvider({ floor, children }: {
    floor: number;
    children: ReactNode;
}): react.JSX.Element;
/** Clamp a font size to the enclosing figure's floor. Outside a Figure the size is returned as is. */
declare function useFontFloor(size: number): number;

/**
 * True when the viewer asks for reduced motion, and re-renders when that changes. The one
 * subscription every part shares. The server render and hydration say false, so they match; the
 * real value follows straight after.
 */
declare function usePrefersReducedMotion(): boolean;

/** What a level's `render` receives. */
interface DrillRenderContext {
    /** Prefix for every SVG id in this drawing (`<Defs id={ctx.id}>`). Unique while mounted, ghosts included. */
    id: string;
    /** Which drawing is being rendered: the wide one, or the authored narrow one below 720px. */
    variant: "wide" | "narrow";
    /** True when the drawing is the faint preview inside a drillable node of the level above. */
    ghost: boolean;
    level: DrillLevel;
}
/** One figure in a drill-down stack. */
interface DrillLevel {
    /** Stable id; `DrillNode drill="<id>"` opens it and the path is a list of these. */
    id: string;
    /** Short name: the breadcrumb, the drillable node's accessible name, the announcement. */
    label: string;
    /** Heading while the level is open. Defaults to `label`. */
    title?: string;
    caption?: string;
    /** Accessible description of the drawing. */
    alt: string;
    legend?: LegendItem[];
    /** "3 parts inside". Read in the drillable node's name; counted from the drawing when omitted. */
    summary?: string;
    /** This level's viewBox. Defaults to the figure's; a different aspect is fitted (letterboxed). */
    viewBox?: string;
    narrowViewBox?: string;
    /** The wide drawing. */
    render: (ctx: DrillRenderContext) => ReactNode;
    /** Optional narrow drawing shown below 720px. Give every level one, or none. */
    narrow?: (ctx: DrillRenderContext) => ReactNode;
}
type DrillPath = readonly string[];
type DrillAction = {
    type: "open";
    id: string;
} | {
    type: "up";
} | {
    type: "to";
    depth: number;
} | {
    type: "set";
    path: DrillPath;
};
/**
 * Keep the valid prefix of `path`: it starts at the root, names known levels,
 * and never revisits one. Anything after the first bad entry is dropped.
 */
declare function normalizePath(path: DrillPath | undefined, ids: ReadonlySet<string> | readonly string[], root: string): string[];
/** The path stack. Pure: same input, same output; unchanged input returns the same array. */
declare function drillReducer(path: DrillPath, action: DrillAction, ids: ReadonlySet<string> | readonly string[], root?: string): DrillPath;
type DrillMove = "none" | "in" | "out" | "jump";
/** One level down is "in", one level up is "out"; anything else crossfades. */
declare function drillMove(from: DrillPath, to: DrillPath): DrillMove;
type DrillFocus = {
    kind: "heading";
} | {
    kind: "node";
    drill: string;
};
/**
 * Where focus goes once a move settles. Going down lands on the new level's
 * heading. Going up returns to the node in the now-open level that leads back
 * toward where you were, so Enter takes you straight back in.
 */
declare function drillFocusTarget(from: DrillPath, to: DrillPath): DrillFocus;
/** Polite announcement for a move. */
declare function drillAnnouncement(from: DrillPath, to: DrillPath, labelOf: (id: string) => string): string;
/** Size step for drillable nodes: grow the box about its centre, `grow` units taller. */
declare function drillBox<B extends {
    x: number;
    y: number;
    w: number;
    h: number;
}>(box: B, grow?: number): B;
/** Default height step of a drillable node, in user units (56 → 64, +14%). */
declare const DRILL_GROW = 8;

/** The shape `renderStatic` takes (mirrors `StaticFigure` in uipack/static). */
interface DrillStaticFigure {
    children: React.ReactNode;
    viewBox: string;
    legend?: LegendItem[];
    number?: string;
    eyebrow?: string;
    title?: string;
    caption?: string;
    alt?: string;
    background?: "dots" | "plain" | "ruled";
}
/**
 * One level of a DrillFigure as a static figure: the level at `path` (default
 * the figure's `path`, else `defaultPath`, else the root), its drillable nodes
 * drawn with their glow, preview and marker but no button. The eyebrow carries
 * the breadcrumb below the root. `renderStatic(<DrillFigure …/>)` calls this.
 */
declare function drillStatic(props: DrillFigureProps, path?: DrillPath): DrillStaticFigure;

interface DrillFigureProps {
    /** Every level, flat. The first is the root unless `root` says otherwise. */
    levels: DrillLevel[];
    root?: string;
    /** The stage frame every level is drawn into (and the default level viewBox). */
    viewBox: string;
    /** Stage frame below 720px, when levels have narrow drawings. */
    narrowViewBox?: string;
    /** Controlled path of level ids from the root, e.g. ["harness", "checks"]. */
    path?: DrillPath;
    /** Starting path when uncontrolled. */
    defaultPath?: DrillPath;
    /** Called with the next path on every drill, back or breadcrumb jump. */
    onPathChange?: (path: string[]) => void;
    number?: string;
    /** Short mono topic after the number. */
    eyebrow?: string;
    headingLevel?: 2 | 3 | 4 | 5;
    /** Allow opening a zoomable canvas of the current level. */
    expandable?: boolean;
    /** Show Pause and Replay. Hidden automatically under reduced motion. */
    controls?: boolean;
    theme?: "light" | "dark";
    background?: "dots" | "plain" | "ruled";
    /** Smallest rendered text size in CSS px, as on Figure. Default 11. */
    minFont?: number;
    /** Zoom duration in ms. Default 1000. Reduced motion always crossfades in 160ms. */
    duration?: number;
    className?: string;
    id?: string;
}
/**
 * A stack of figures in the Figure style. A `DrillNode` inside a level opens
 * its child level: the parent zooms into the node while the child opens from a
 * clip shaped like the node box, and Back reverses the same path. The header
 * carries a breadcrumb, a Back control, Open canvas and the motion controls.
 */
declare function DrillFigureRoot({ levels, root, viewBox, narrowViewBox, path, defaultPath, onPathChange, number, eyebrow, headingLevel, expandable, controls, theme, background, minFont, duration, className, id, }: DrillFigureProps): react.JSX.Element | null;
/**
 * A stack of figures in the Figure style; see `DrillFigureRoot`.
 * `renderStatic(<DrillFigure …/>)` draws the level at the figure's path. `toStatic` is attached
 * through a pure `Object.assign`, not a top-level property write, so bundlers can drop an unused figure.
 */
declare const DrillFigure: typeof DrillFigureRoot & {
    displayName: string;
    toStatic: (props: DrillFigureProps) => DrillStaticFigure;
};

interface DrillNodeProps extends Omit<NodeProps, "label" | "href" | "inlay"> {
    /** Id of the level this node opens. */
    drill: string;
    /** Visible label. Defaults to the child level's label. */
    label?: string;
    /** Height step in user units, added about the centre (default 8: a 56 box draws 64). 0 keeps the box as given. */
    grow?: number;
    /** Show the faint miniature of the child level inside the box. Default true. */
    preview?: boolean;
}
/**
 * A Node that opens another level of a DrillFigure. It draws one size step
 * larger, with a soft accent glow and a faint miniature of the level inside,
 * so it reads as "there's more in here" before anyone clicks. Outside a
 * DrillFigure (or in a ghost preview) it is a plain Node.
 */
declare function DrillNode({ drill, label, grow, preview, ...node }: DrillNodeProps): react.JSX.Element;

/** The drill-down clock. */
declare const drillMotion: {
    readonly zoom: 1000;
    readonly fade: 320;
    readonly reduced: 160;
};

export { Badge, type BadgeProps, type Box, Bus, type BusProps, type BusStub, Chip, type ChipProps, Connector, type ConnectorKind, type ConnectorProps, Cross, type CrossProps, type CurveMeasure, type CurveNote, CurvePlot, type CurvePlotProps, type CurvePoint, DEFAULT_RENDER_WIDTH, DRILL_GROW, Defs, type DefsProps, type DrillAction, DrillFigure, type DrillFigureProps, type DrillFocus, type DrillLevel, type DrillMove, DrillNode, type DrillNodeProps, type DrillPath, type DrillRenderContext, type DrillStaticFigure, FIGURE_GRID, type FigureHover, FigureHoverContext, type FigureScale, FigureScaleProvider, FileMark, type Flow, FolderMark, Group, type GroupProps, IconName, Label, type LabelProps, Lane, type LaneProps, LegendItem, type MarkName, Node, type NodeProps, PACKET_POP, PACKET_SINK, Packet, type PacketProps, type Point, Sheet, type SheetProps, type Side, TokenKind, TokenShape, type TreeMarkProps, TreeRail, type TreeRailProps, Wall, type WallProps, Wordmark, anchor, busStub, busStubs, connectorStroke, curveAt, curveSegments, drillAnnouncement, drillBox, drillFocusTarget, drillMotion, drillMove, drillReducer, drillStatic, flowList, fontFloor, grid, hoverAttrs, isPointer, marks, normalizePath as normalizeDrillPath, packetScaleKeys, pathFromPoints, pointAlong, polylineLength, route, trim, useFigureHover, useFontFloor, usePrefersReducedMotion, wallSegments };
