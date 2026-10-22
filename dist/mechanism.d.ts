import * as react from 'react';
import { ReactNode } from 'react';

type Flat = [number, number];
type Point3 = [number, number, number];
type Plane = [number, number];
interface Projection {
    origin: Flat;
    scale: number;
    azimuth?: number;
    elevation?: number;
}
interface Plan {
    x: number;
    y: number;
    w: number;
    d: number;
    r: number;
}
interface SolidPaths {
    fill: string;
    outline: string;
    crease: string;
    top: string;
    shades: string[];
    bevel?: string;
    seamless?: boolean;
}
type Tone = "hi" | "mid" | "lo" | "faint";
type LineTone = Tone | "lit" | "red" | "green" | "blue";
declare const AZIMUTH = 45;
declare const ELEVATION = 30;
declare const SHADES = 4;
interface Camera {
    sinA: number;
    cosA: number;
    sinE: number;
    cosE: number;
    k: number;
}
declare function cameraOf({ scale, azimuth, elevation }: Projection): Camera;
declare function iso([x, y, z]: Point3, projection: Projection): Flat;
declare function towardViewer(projection: Projection): Plane;
declare function depthOf([x, y, z]: Point3, projection: Projection): number;
declare function pathOf(points: Flat[], closed?: boolean): string;
declare const joinPaths: (paths: string[]) => string;
declare function roundedPlan({ x, y, w, d, r }: Plan, steps?: number): Plane[];
interface ExtrudeOptions {
    convex?: boolean;
    bevel?: number;
}
declare function extrude(ring: Plane[], z: number, height: number, projection: Projection, options?: ExtrudeOptions): SolidPaths;
declare const ringOf: (plan: Plan, steps?: number) => Plane[];
declare function slabOf(plan: Plan, z: number, height: number, projection: Projection, steps?: number, bevel?: number): SolidPaths;
declare function circleRing(cx: number, cy: number, radius: number, steps?: number): Plane[];
declare function cylinder(cx: number, cy: number, radius: number, z: number, height: number, projection: Projection, steps?: number, bevel?: number): SolidPaths;
declare const insetPlan: ({ x, y, w, d, r }: Plan, by: number) => Plan;
declare function onTop(points: Plane[], z: number, projection: Projection, closed?: boolean): string;
declare const planOutline: (plan: Plan, z: number, projection: Projection, steps?: number) => string;
declare const lineOnTop: (from: Plane, to: Plane, z: number, projection: Projection) => string;
declare const segment: (from: Point3, to: Point3, projection: Projection) => string;
declare const rise: (at: Plane, from: number, to: number, projection: Projection) => string;
declare const ring: (cx: number, cy: number, radius: number, z: number, projection: Projection, steps?: number) => string;
declare const pointsAt: (points: Point3[], projection: Projection) => Flat[];
declare function dotGrid(x: number, y: number, columns: number, rows: number, gap: number, z: number, projection: Projection): Flat[];
declare function corners({ x, y, w, d }: Plan, inset?: number): Plane[];
declare function boxCorners({ x, y, w, d }: Plan, z0: number, z1: number): Point3[];
declare function knurl(cx: number, cy: number, radius: number, z0: number, z1: number, count: number, projection: Projection, inset?: number): string;
declare function sideArc(cx: number, cy: number, radius: number, z: number, projection: Projection, steps?: number): string;
declare function ringSeam(ring: Plane[], z: number, projection: Projection): string;
declare const sideSeam: (plan: Plan, z: number, projection: Projection, steps?: number) => string;
declare function sideRing(center: Point3, radius: number, axis: "x" | "y", projection: Projection, steps?: number): string;
declare function coil(from: number, to: number, center: Plane, radius: number, turns: number, axis: "x" | "y", projection: Projection, perTurn?: number): {
    back: string;
    front: string;
};
interface Ticks {
    minor: string;
    major: string;
}
declare function topTicks(from: number, to: number, step: number, every: number, edge: number, z: number, lengths: [number, number], projection: Projection, axis?: "x" | "y"): Ticks;
declare function sideTicks(from: number, to: number, step: number, every: number, face: number, top: number, lengths: [number, number], projection: Projection, axis?: "x" | "y"): Ticks;
declare function radialTicks(cx: number, cy: number, radius: number, count: number, every: number, z: number, lengths: [number, number], projection: Projection, from?: number, span?: number): Ticks;
declare const haloOf: (plan: Plan, z: number, height: number, projection: Projection) => string;
declare function axisVector(projection: Projection, [dx, dy, dz]: Point3): Flat;
declare function translateAlong(projection: Projection, by: Point3): string;
declare function holdStill(element: Element, [dx, dy]: Flat): void;
declare function topMatrix(at: Plane, z: number, projection: Projection, along?: "x" | "y"): string;
declare function sideMatrix(at: Plane, z: number, projection: Projection, face: "left" | "right"): string;
declare function screenRise(height: number, projection: Projection): number;
interface FitOptions {
    pad?: number;
    headroom?: number;
    azimuth?: number;
    elevation?: number;
}
declare function fitProjection(points: Point3[], width: number, height: number, { pad, headroom, azimuth, elevation }?: FitOptions): Projection;
interface SolidStyle {
    tone?: Tone;
    crease?: Tone | "none";
    halo?: boolean;
    lit?: boolean;
    flat?: boolean;
    className?: string;
    inner?: string;
}
interface LineStyle {
    tone?: LineTone;
    dotted?: boolean;
    dashed?: boolean;
    flow?: boolean;
    className?: string;
    free?: boolean | "start" | "end";
}
type Faded = {
    d: string;
    alpha: number;
} | [string, number];
interface FadeLineStyle {
    fade?: number | [number, number];
    tone?: LineTone;
    className?: string;
    stops?: number;
}
interface WireStyle {
    via?: Flat[];
    tone?: LineTone;
    dotted?: boolean;
    dashed?: boolean;
    flow?: boolean;
    ends?: "both" | "from" | "to" | "none";
    size?: number;
}

/** The dial's full scale. */
declare const SCALE = 10;
type Verdict = "pass" | "return";
interface Check {
    /** 0-based position in the endless run. */
    index: number;
    /** Which proposal this is (a revised proposal keeps its id). */
    proposal: number;
    /** 1 for a first try, 2 for the revision of a returned proposal. */
    attempt: number;
    /** The measured value: the token's height under the gauge, 0–10. */
    value: number;
    verdict: Verdict;
}
declare const CYCLE_LENGTH: number;
declare const verdictOf: (value: number) => Verdict;
declare function checkAt(index: number): Check;
interface Tally {
    checked: number;
    passed: number;
    returned: number;
}
/** The counts after the first `count` checks of the run. */
declare function tallyOf(count: number): Tally;
declare const tallyText: ({ checked, passed, returned }: Tally) => string;
/** The first passing and the first returned check: the single runs the "pass" and "return" poses show. */
declare const PASS_CHECK: Check;
declare const RETURN_CHECK: Check;
declare function verdictText(check: Check): string;

type GatePose = "idle" | "pass" | "return" | "apart";
type Layer = "belt" | "chute" | "tray";
interface TokenTarget {
    key: string;
    check: Check;
    pos: Point3;
    layer: Layer;
    alpha: number;
    lit: boolean;
}
interface Scene {
    tokens: TokenTarget[];
    /** Plunger lift above the belt; 0 lets it rest on whatever is under it. */
    lift: number;
    /** 0 = arm along the back rail, 1 = across the belt, diverting. */
    arm: number;
    /** Belt surface speed, world units per second. */
    belt: number;
    apart: boolean;
    /** The last measured value, held by the dial's drag hand. */
    drag: number;
    readout: string;
    /** A short phase word for assistive technology, written only when it changes. */
    phase: string;
}
/** Seconds between proposals in the idle tour. */
declare const PERIOD = 5.4;
/** Where a token is `u` seconds after it leaves the hopper, given where it will end. */
declare function tokenAt(u: number, check: Check, slot: number): {
    pos: Point3;
    layer: Layer;
    alpha: number;
    done: boolean;
};
/** Seconds a token takes from the hopper to rest, by verdict. */
declare const RUN_LONG: {
    pass: number;
    return: number;
};
/** The scene for a pose at `t` seconds since it was set. */
declare function sceneAt(pose: GatePose, t: number, round?: number): Scene;
declare const stillScene: (pose: GatePose) => Scene;

interface GateMachineProps {
    /** What the machine shows. Controlled: change it per slide and the machine moves there smoothly. */
    pose?: GatePose;
    /** Sets the palette on the machine's own root; omit it to follow an ancestor's `data-theme`. */
    theme?: "light" | "dark";
    /** "none" holds each pose's still frame, as reduced motion does. */
    motion?: "auto" | "none";
    /** false renders one still frame of the pose: no loops, observers or handlers (deck thumbnails). */
    interactive?: boolean;
    /** The SVG's accessible description (as Figure's `alt`); a default describes the machine. */
    alt?: string;
    /** Called with the readout text whenever it changes. */
    onReadout?: (text: string) => void;
    className?: string;
}
interface VerificationGateProps extends GateMachineProps {
    /** false renders the bare machine with no card, for a slide that places it itself. */
    frame?: boolean;
    /** Top-left corner, as Figure's `number`: "Fig 1". */
    number?: string;
    title?: string;
    hint?: react.ReactNode;
    caption?: react.ReactNode;
}
declare const GATE_CAPTION = "Illustrative, not data from a real system. A dial indicator measures every proposal before it can become a result: tokens at or under the limit (6.0) ride on to the result tray, taller ones are swung into the return chute and slide back to the hopper's tray, to be revised and tried again.";
/** The verification gate without its card. */
/** `bare` (internal): the machine is its own styled root; VerificationGate passes false inside its card, which carries the theme. */
declare function GateMachine({ pose, theme, motion, interactive, alt, onReadout, className, bare, }: GateMachineProps & {
    bare?: boolean;
}): react.JSX.Element;
/**
 * The verification gate for an agent-harness talk: proposals leave a hopper,
 * a dial indicator measures each against a limit, passing ones reach the
 * result tray and failing ones are swung into a chute back to the hopper.
 */
declare function VerificationGate({ frame, number, title, hint, caption, theme, ...machine }: VerificationGateProps): react.JSX.Element;
declare const GATE_LIMIT = 6;

interface MechanismFrameProps {
    /** Top left, e.g. "Fig 3" (Figure's `number`). */
    number: string;
    /** Top right: a short title. */
    title?: string;
    /** Bottom left: how to interact. */
    hint?: ReactNode;
    /** Bottom right: the resting readout. A live machine inside rewrites it in place. */
    readout?: ReactNode;
    /** Under the card: a true caption. */
    caption?: ReactNode;
    theme?: "light" | "dark";
    className?: string;
    children: ReactNode;
}
/**
 * Anatomy's card in UI Pack's labelling language: figure number top left,
 * title top right, hint bottom left, live readout bottom right, caption
 * below. Any machine placed inside writes its readout into the corner.
 */
declare function MechanismFrame({ number, title, hint, readout, caption, theme, className, children }: MechanismFrameProps): react.JSX.Element;

interface SolidProps {
    paths: SolidPaths;
    tone?: Tone;
    crease?: Tone | "none";
    halo?: boolean;
    lit?: boolean;
    flat?: boolean;
    className?: string;
    inner?: react.ReactNode;
    children?: react.ReactNode;
}
declare function Solid({ paths, tone, crease, halo, lit, flat, className, inner, children }: SolidProps): react.JSX.Element;
interface LineProps {
    d: string;
    tone?: LineTone;
    dotted?: boolean;
    dashed?: boolean;
    flow?: boolean;
    className?: string;
    free?: boolean | "start" | "end";
}
declare function Line({ d, tone, dotted, dashed, flow, className, free }: LineProps): react.JSX.Element | null;
interface WireProps {
    from: Flat;
    to: Flat;
    via?: Flat[];
    tone?: LineTone;
    dotted?: boolean;
    dashed?: boolean;
    flow?: boolean;
    ends?: "both" | "from" | "to" | "none";
    size?: number;
}
declare function Wire({ from, to, via, tone, dotted, dashed, flow, ends, size }: WireProps): react.JSX.Element;
declare function Dots({ points, size, tone, pulse }: {
    points: Array<Flat | [number, number, number]>;
    size?: number;
    tone?: Tone;
    pulse?: boolean;
}): react.JSX.Element;
declare function FaceText({ transform, children, size, tone, anchor, }: {
    transform: string;
    children: react.ReactNode;
    size?: number;
    tone?: Tone;
    anchor?: "start" | "middle" | "end";
}): react.JSX.Element;

declare function follow(current: number, target: number, dt: number, seconds: number, calm?: boolean): number;
interface Spring {
    at: number;
    rate: number;
}
declare function spring(state: Spring, target: number, dt: number, stiffness: number, damping: number, calm?: boolean): boolean;

/** The direction toward the viewer, in world space (the gradient of `depthOf`). */
declare function viewOf(projection: Projection): Point3;
/**
 * A convex face (planar, any orientation, listed in order) swept along a
 * vector. Returns the same `SolidPaths` the kit's `Solid` draws.
 */
declare function prismOf(face: Point3[], along: Point3, projection: Projection): SolidPaths;
/** A circle in a vertical plane: across x (axis "y", the plane y = centre) or across y (axis "x"). */
declare function circleIn(centre: Point3, radius: number, axis: "x" | "y", steps?: number): Point3[];
/** A closed circle drawn on a vertical face (a bearing ring, a bore, a motor cap). */
declare function faceCircle(centre: Point3, radius: number, axis: "x" | "y", projection: Projection, steps?: number): string;

export { AZIMUTH, Dots, ELEVATION, type ExtrudeOptions, FaceText, type FadeLineStyle, type Faded, type FitOptions, type Flat, GATE_CAPTION, CYCLE_LENGTH as GATE_CYCLE_LENGTH, GATE_LIMIT, PASS_CHECK as GATE_PASS_CHECK, PERIOD as GATE_PERIOD, RETURN_CHECK as GATE_RETURN_CHECK, RUN_LONG as GATE_RUN_LONG, SCALE as GATE_SCALE, type Check as GateCheck, type Layer as GateLayer, GateMachine, type GateMachineProps, type GatePose, type Scene as GateScene, type Tally as GateTally, type TokenTarget as GateTokenTarget, type Verdict as GateVerdict, Line, type LineStyle, type LineTone, MechanismFrame, type MechanismFrameProps, type Plan, type Plane, type Point3, type Projection, SHADES, Solid, type SolidPaths, type SolidStyle, type Spring, type Ticks, type Tone, VerificationGate, type VerificationGateProps, Wire, type WireStyle, axisVector, boxCorners, cameraOf, circleIn, circleRing, coil, corners, cylinder, depthOf, dotGrid, extrude, faceCircle, fitProjection, follow, checkAt as gateCheckAt, sceneAt as gateSceneAt, stillScene as gateStillScene, tallyOf as gateTallyOf, tallyText as gateTallyText, tokenAt as gateTokenAt, verdictOf as gateVerdictOf, verdictText as gateVerdictText, haloOf, holdStill, insetPlan, iso, joinPaths, knurl, lineOnTop, onTop, pathOf, planOutline, pointsAt, prismOf, radialTicks, ring, ringOf, ringSeam, rise, roundedPlan, screenRise, segment, sideArc, sideMatrix, sideRing, sideSeam, sideTicks, slabOf, spring, topMatrix, topTicks, towardViewer, translateAlong, viewOf };
