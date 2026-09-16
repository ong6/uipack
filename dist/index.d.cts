import * as react from 'react';
import { CSSProperties, ReactNode } from 'react';

type TokenKind = "request" | "response" | "change" | "accent" | "neutral";
type TokenShape = "square" | "circle" | "diamond";
declare const TOKEN_SHAPE: Record<TokenKind, TokenShape>;
declare function tokenColor(kind: TokenKind): string;
interface TokenProps {
    shape?: TokenShape;
    kind?: TokenKind;
    /** Half the token's width in user units. */
    r?: number;
    cx?: number;
    cy?: number;
    style?: CSSProperties;
}
/** The small shape that rides a connector or sits in a legend. */
declare function Token({ shape, kind, r, cx, cy, style }: TokenProps): react.JSX.Element;

interface LegendItem {
    label: string;
    kind?: TokenKind;
    shape?: TokenShape;
}
interface LegendProps {
    items: LegendItem[];
}
/** Shape-coded key rendered in the Figure header. */
declare function Legend({ items }: LegendProps): react.JSX.Element | null;

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
    id?: string;
}
declare function Figure({ number, eyebrow, title, headingLevel, caption, legend, controls, viewBox, children, narrow, narrowViewBox, alt, className, theme, id, }: FigureProps): react.JSX.Element;

interface LaneProps {
    /** Left edge and width of the column the header sits over. */
    x: number;
    w: number;
    y: number;
    title: string;
    /** Draw a faint vertical rule down to `h`. */
    h?: number;
    size?: number;
}
/** Mono uppercase column header, the way the OpenAI figures label CLIENTS / PLATFORM / STORAGE. */
declare function Lane({ x, w, y, title, h, size }: LaneProps): react.JSX.Element;

interface GroupProps {
    x: number;
    y: number;
    w: number;
    h: number;
    title?: string;
    /** "solid" draws a boxed region with a centred title (a service); "dashed" an environment or boundary. */
    variant?: "solid" | "dashed";
    accent?: boolean;
    titleSize?: number;
    children?: ReactNode;
}
declare function Group({ x, y, w, h, title, variant, accent, titleSize, children }: GroupProps): react.JSX.Element;

declare const icons: {
    db: react.JSX.Element;
    cache: react.JSX.Element;
    queue: react.JSX.Element;
    service: react.JSX.Element;
    client: react.JSX.Element;
    blob: react.JSX.Element;
    agent: react.JSX.Element;
    doc: react.JSX.Element;
    more: react.JSX.Element;
};
type IconName = keyof typeof icons;

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
    size?: number;
    subSize?: number;
    id?: string;
}
declare function Node({ x, y, w, h, label, sub, icon, align, accent, dashed, size, subSize, id, }: NodeProps): react.JSX.Element;

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
    size?: number;
}
/** Pill: a connection slot, a request in a queue, a status flag. */
declare function Chip({ x, y, w, h, label, dashed, kind, size }: ChipProps): react.JSX.Element;

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

interface ConnectorProps {
    /** Polyline in user units; use `route()` to build an orthogonal one. */
    points: Point[];
    /** Marker prefix from `<Defs id>`; required for arrowheads. */
    defs?: string;
    arrow?: boolean | "both";
    dashed?: boolean;
    /** Colour the stroke and head by token kind. */
    kind?: "request" | "response" | "change" | "accent";
    /** Id for `<Packet along>` to follow. */
    id?: string;
    radius?: number;
    strokeWidth?: number;
}
declare function connectorStroke(kind?: ConnectorProps["kind"]): string;
declare function Connector({ points, defs, arrow, dashed, kind, id, radius, strokeWidth }: ConnectorProps): react.JSX.Element;

interface PacketProps {
    /** Same points as the Connector it rides. */
    points: Point[];
    kind?: TokenKind;
    shape?: TokenShape;
    /** Seconds for one trip. */
    dur?: number;
    /** Seconds before the first trip; negative starts mid-path. */
    delay?: number;
    /** Where the static token sits under reduced motion, 0..1. */
    at?: number;
    r?: number;
    /** Ride the path backwards (a response). */
    reverse?: boolean;
    radius?: number;
    id?: string;
}
/**
 * A token moving along a polyline with SMIL `animateMotion`. Under
 * prefers-reduced-motion it renders once at `at` and never moves. Pause and
 * Replay come from the enclosing Figure, which drives the SVG timeline
 * (pauseAnimations, setCurrentTime), so offsets survive a replay.
 */
declare function Packet({ points, kind, shape, dur, delay, at, r, reverse, radius, id }: PacketProps): react.JSX.Element;

interface BadgeProps {
    cx: number;
    cy: number;
    text: string;
    accent?: boolean;
    r?: number;
}
/** A circled step number on a node corner or a connector. */
declare function Badge({ cx, cy, text, accent, r }: BadgeProps): react.JSX.Element;

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
declare function Label({ x, y, text, anchor, accent, size, font }: LabelProps): react.JSX.Element;

interface DefsProps {
    /** Prefix for marker ids; keep unique per SVG on the page. */
    id: string;
}
/** Arrowhead markers. `url(#<id>-head)` and `url(#<id>-head-accent)`. */
declare function Defs({ id }: DefsProps): react.JSX.Element;

interface FigureMotion {
    /** False after Pause, or always false under prefers-reduced-motion. */
    playing: boolean;
    /** True when the viewer asked for reduced motion; packets render static. */
    reduced: boolean;
    /** Increments on Replay so animated children can restart. */
    cycle: number;
    toggle: () => void;
    replay: () => void;
}
declare const FigureMotionContext: react.Context<FigureMotion>;
/** Motion state of the enclosing Figure. Outside a Figure it plays forever. */
declare function useFigureMotion(): FigureMotion;
/** True when the OS asks for reduced motion. Server render says false. */
declare function usePrefersReducedMotion(): boolean;

export { Badge, type BadgeProps, type Box, Chip, type ChipProps, Connector, type ConnectorProps, Defs, type DefsProps, Figure, type FigureMotion, FigureMotionContext, type FigureProps, Group, type GroupProps, type IconName, Label, type LabelProps, Lane, type LaneProps, Legend, type LegendItem, type LegendProps, Node, type NodeProps, Packet, type PacketProps, type Point, type Side, TOKEN_SHAPE, Token, type TokenKind, type TokenProps, type TokenShape, anchor, connectorStroke, icons, pathFromPoints, pointAlong, route, tokenColor, useFigureMotion, usePrefersReducedMotion };
