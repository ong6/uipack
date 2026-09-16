export { F as Figure, a as FigureProps } from './Figure-DxRjhYG8.cjs';
import { T as TokenKind, a as TokenShape } from './Legend-S2FQoAxv.cjs';
export { L as Legend, b as LegendItem, c as LegendProps, d as TOKEN_SHAPE, e as Token, f as TokenProps, t as tokenColor } from './Legend-S2FQoAxv.cjs';
import * as react from 'react';
import { ReactNode } from 'react';
import { I as IconName } from './index-DwRqkLtz.cjs';
export { i as icons } from './index-DwRqkLtz.cjs';

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
    children?: ReactNode;
}
declare function Group({ x, y, w, h, title, variant, accent, flow, titleSize, children }: GroupProps): react.JSX.Element;

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
    /** Native tooltip. */
    hint?: string;
    /** Makes the node a link with a focus ring. */
    href?: string;
    size?: number;
    subSize?: number;
    id?: string;
}
declare function Node({ x, y, w, h, label, sub, icon, align, accent, dashed, flow, hint, href, size, subSize, id, }: NodeProps): react.JSX.Element;

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
}
/** Pill: a connection slot, a request in a queue, a status flag. */
declare function Chip({ x, y, w, h, label, dashed, kind, flow, size }: ChipProps): react.JSX.Element;

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
declare function Connector({ points, defs, arrow, dashed, kind, flow, id, radius, strokeWidth, inset }: ConnectorProps): react.JSX.Element;

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
    /** Where the static token sits under reduced motion, 0..1. */
    at?: number;
    r?: number;
    /** Ride the path backwards (a response). */
    reverse?: boolean;
    radius?: number;
    /** Flow names for hover highlighting. */
    flow?: Flow;
    /**
     * Units the trip stops short of its first and last point, so the token
     * never sits on the arrowhead or the node border. Default 2 and 12.
     */
    trim?: [number, number];
    id?: string;
}
/**
 * A token moving along a polyline with SMIL `animateMotion`. Under
 * prefers-reduced-motion it renders once at `at` and never moves. Pause and
 * Replay come from the enclosing Figure, which drives the SVG timeline
 * (pauseAnimations, setCurrentTime), so offsets survive a replay.
 */
declare function Packet({ points, kind, shape, dur, delay, at, r, reverse, radius, flow, trim: t, id }: PacketProps): react.JSX.Element;

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

declare const marks: {
    uipack: react.JSX.Element;
    groundplane: react.JSX.Element;
    jobforge: react.JSX.Element;
    skillforge: react.JSX.Element;
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

interface FigureMotion {
    /** False after Pause, or always false under prefers-reduced-motion. */
    playing: boolean;
    /** True when the viewer asked for reduced motion; packets render static. */
    reduced: boolean;
    /** Increments on Replay so animated children can restart. */
    cycle: number;
    /** Emit SMIL on the server render (static export); the client waits for mount. */
    prerender?: boolean;
    toggle: () => void;
    replay: () => void;
}
declare const FigureMotionContext: react.Context<FigureMotion>;
/** Motion state of the enclosing Figure. Outside a Figure it plays forever. */
declare function useFigureMotion(): FigureMotion;
/** True when the OS asks for reduced motion. Server render says false. */
declare function usePrefersReducedMotion(): boolean;

export { Badge, type BadgeProps, type Box, Bus, type BusProps, type BusStub, Chip, type ChipProps, Connector, type ConnectorKind, type ConnectorProps, Defs, type DefsProps, type FigureHover, FigureHoverContext, type FigureMotion, FigureMotionContext, type Flow, Group, type GroupProps, IconName, Label, type LabelProps, Lane, type LaneProps, type MarkName, Node, type NodeProps, Packet, type PacketProps, type Point, type Side, TokenKind, TokenShape, Wordmark, anchor, busStub, busStubs, connectorStroke, flowList, grid, hoverAttrs, marks, pathFromPoints, pointAlong, polylineLength, route, trim, useFigureHover, useFigureMotion, usePrefersReducedMotion };
