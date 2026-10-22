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
declare function solidSvg(paths: SolidPaths, { tone, crease, halo, lit, flat, className, inner }?: SolidStyle): string;
interface LineStyle {
    tone?: LineTone;
    dotted?: boolean;
    dashed?: boolean;
    flow?: boolean;
    className?: string;
    free?: boolean | "start" | "end";
}
declare function lineSvg(d: string, { tone, dotted, dashed, flow, className, free }?: LineStyle): string;
declare function dotsSvg(points: Array<Flat | [number, number, number]>, { size, tone, pulse }?: {
    size?: number;
    tone?: Tone;
    pulse?: boolean;
}): string;
type Faded = {
    d: string;
    alpha: number;
} | [string, number];
declare function fadedSvg(list: Faded[], style?: LineStyle): string;
interface FadeLineStyle {
    fade?: number | [number, number];
    tone?: LineTone;
    className?: string;
    stops?: number;
}
declare function fadeLineSvg(points: Flat[], { fade, tone, className, stops }?: FadeLineStyle): string;
interface WireStyle {
    via?: Flat[];
    tone?: LineTone;
    dotted?: boolean;
    dashed?: boolean;
    flow?: boolean;
    ends?: "both" | "from" | "to" | "none";
    size?: number;
}
declare function wireSvg(from: Flat, to: Flat, { via, tone, dotted, dashed, flow, ends, size }?: WireStyle): string;
declare function faceTextSvg(transform: string, text: string, { size, tone, anchor }?: {
    size?: number;
    tone?: Tone;
    anchor?: "start" | "middle" | "end";
}): string;
declare function groupSvg(children: string | string[], extra?: Record<string, string | number | undefined | false>): string;
type Theme = "dark" | "light";
interface FigureOptions {
    width: number;
    height: number;
    label: string;
    body: string | string[];
    standalone?: Theme | false;
    className?: string;
}
declare function figureSvg({ width, height, label, body, standalone, className }: FigureOptions): string;
type KeyMark = "raised" | "flat" | "lit" | "edge" | "dim" | "dotted" | "dashed" | "red" | "green" | "blue";
interface LegendKey {
    mark: KeyMark;
    label: string;
}
interface PlateOptions {
    fig: string;
    title?: string;
    hint?: string;
    readout?: string;
    keys?: LegendKey[];
    caption?: string;
    body: string;
}
declare function plateHtml({ fig, title, hint, readout, keys, caption, body }: PlateOptions): string;
interface PageOptions {
    title: string;
    theme?: Theme;
    body: string;
    script?: string;
    width?: number;
}
declare function pageHtml({ title, theme, body, script, width }: PageOptions): string;
declare const ISO_CSS = "\n.iso{\n  --anatomy-page:#0b0b0b;--anatomy-card:#131313;--anatomy-text:#a3a3a3;--anatomy-strong:#e6e6e6;--anatomy-muted:#6e6e6e;\n  --anatomy-paper:#131313;--anatomy-face:#1b1b1b;--anatomy-top:#1c1c1c;\n  --anatomy-shade-0:#0f0f0f;--anatomy-shade-1:#121212;--anatomy-shade-2:#151515;--anatomy-shade-3:#181818;\n  --anatomy-lit-top:#262626;--anatomy-lit-shade:#1d1d1d;\n  --anatomy-hi:#d4d4d4;--anatomy-mid:#6a6a6a;--anatomy-lo:#3e3e3e;--anatomy-faint:#2a2a2a;--anatomy-lit:#ffffff;\n  --anatomy-halo:#050505;--anatomy-halo-opacity:.9;--anatomy-dot:#e6e6e6;\n  --anatomy-red:#ff6b6b;--anatomy-green:#6be0a0;--anatomy-blue:#6b9bff;\n  --anatomy-weight:.6px;--anatomy-ease:cubic-bezier(.32,.72,0,1);\n  --anatomy-mono:ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;\n  --anatomy-lift:inset 0 1px 0 0 #ffffff0a,inset 0 0 0 1px #ffffff06,0 0 0 1px #00000026,0 1px 1px -.5px #00000014,0 3px 3px -1.5px #00000014,0 6px 6px -3px #00000014,0 12px 12px -6px #00000014;\n}\n.iso[data-theme=\"light\"]{\n  --anatomy-page:#f2f2ef;--anatomy-card:#fbfbfa;--anatomy-text:#57575a;--anatomy-strong:#18181a;--anatomy-muted:#8c8c90;\n  --anatomy-paper:#fbfbfa;--anatomy-face:#ffffff;--anatomy-top:#ffffff;\n  --anatomy-shade-0:#dcdcd9;--anatomy-shade-1:#e5e5e2;--anatomy-shade-2:#ededea;--anatomy-shade-3:#f4f4f1;\n  --anatomy-lit-top:#ffffff;--anatomy-lit-shade:#eeeeeb;\n  --anatomy-hi:#26262a;--anatomy-mid:#8a8a8f;--anatomy-lo:#b4b4b8;--anatomy-faint:#d4d4d6;--anatomy-lit:#000000;\n  --anatomy-halo:#8a8a80;--anatomy-halo-opacity:.32;--anatomy-dot:#3a3a3e;\n  --anatomy-red:#e5484d;--anatomy-green:#30a46c;--anatomy-blue:#3e63dd;\n  --anatomy-lift:inset 0 1px 0 0 #ffffff,0 0 0 1px #0000000f,0 1px 1px -.5px #0000000a,0 3px 3px -1.5px #0000000a,0 6px 6px -3px #0000000a,0 12px 12px -6px #0000000a;\n}\n.iso-svg{display:block;width:100%;height:auto;overflow:visible}\n.iso-svg path,.iso-svg circle{vector-effect:non-scaling-stroke}\n.iso-fill{fill:var(--anatomy-paper);stroke:none}\n.iso-solid[data-lit]>.iso-fill{fill:var(--anatomy-face)}\n.iso-shade,.iso-top{stroke:none}\n.iso-shade[data-shade=\"0\"]{fill:var(--anatomy-shade-0)}\n.iso-shade[data-shade=\"1\"]{fill:var(--anatomy-shade-1)}\n.iso-shade[data-shade=\"2\"]{fill:var(--anatomy-shade-2)}\n.iso-shade[data-shade=\"3\"]{fill:var(--anatomy-shade-3)}\n.iso-top{fill:var(--anatomy-top)}\n.iso-solid[data-lit]>.iso-top{fill:var(--anatomy-lit-top)}\n.iso-solid[data-lit]>.iso-shade{fill:var(--anatomy-lit-shade)}\n.iso-solid[data-seamless]>.iso-shade,.iso-solid[data-seamless]>.iso-top{stroke-width:.4;stroke-linejoin:round}\n.iso-solid[data-seamless]>.iso-shade[data-shade=\"0\"]{stroke:var(--anatomy-shade-0)}\n.iso-solid[data-seamless]>.iso-shade[data-shade=\"1\"]{stroke:var(--anatomy-shade-1)}\n.iso-solid[data-seamless]>.iso-shade[data-shade=\"2\"]{stroke:var(--anatomy-shade-2)}\n.iso-solid[data-seamless]>.iso-shade[data-shade=\"3\"]{stroke:var(--anatomy-shade-3)}\n.iso-solid[data-seamless]>.iso-top{stroke:var(--anatomy-top)}\n.iso-solid[data-seamless][data-lit]>.iso-top{stroke:var(--anatomy-lit-top)}\n.iso-solid[data-seamless][data-lit]>.iso-shade{stroke:var(--anatomy-lit-shade)}\n.iso-solid[data-lit]>.iso-edge{stroke:var(--anatomy-lit)}\n.iso-halo{fill:var(--anatomy-halo);stroke:none;filter:blur(9px);opacity:var(--anatomy-halo-opacity);transform:translateY(3px)}\n.iso-line{fill:none;stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight);stroke-linecap:round;stroke-linejoin:round}\n.iso-line[data-tone=\"hi\"]{stroke:var(--anatomy-hi)}\n.iso-line[data-tone=\"mid\"]{stroke:var(--anatomy-mid)}\n.iso-line[data-tone=\"lo\"]{stroke:var(--anatomy-lo)}\n.iso-line[data-tone=\"faint\"]{stroke:var(--anatomy-faint)}\n.iso-line[data-tone=\"lit\"]{stroke:var(--anatomy-lit)}\n.iso-line[data-tone=\"red\"]{stroke:var(--anatomy-red)}\n.iso-line[data-tone=\"green\"]{stroke:var(--anatomy-green)}\n.iso-line[data-tone=\"blue\"]{stroke:var(--anatomy-blue)}\n.iso-line[data-dotted]{stroke-dasharray:.01 3.5;stroke-width:1}\n.iso-line[data-dashed]{stroke-dasharray:3 3}\n.iso-line[data-flow]{stroke-dasharray:2 6}\n.iso-wire-end{fill:var(--anatomy-paper);stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight)}\n.iso-wire[data-tone=\"hi\"] .iso-wire-end{stroke:var(--anatomy-hi)}\n.iso-wire[data-tone=\"mid\"] .iso-wire-end{stroke:var(--anatomy-mid)}\n.iso-wire[data-tone=\"faint\"] .iso-wire-end{stroke:var(--anatomy-faint)}\n.iso-wire[data-tone=\"lit\"] .iso-wire-end{stroke:var(--anatomy-lit)}\n.iso-dots circle{fill:var(--anatomy-dot);stroke:none;opacity:.32}\n.iso-dots[data-tone=\"hi\"] circle{opacity:.85}\n.iso-dots[data-tone=\"mid\"] circle{opacity:.45}\n.iso-dots[data-tone=\"lo\"] circle{opacity:.22}\n.iso-dots[data-tone=\"faint\"] circle{opacity:.12}\n.iso-face-text{fill:var(--anatomy-mid);font-family:var(--anatomy-mono);letter-spacing:.04em}\n.iso-face-text[data-tone=\"hi\"]{fill:var(--anatomy-hi)}\n.iso-face-text[data-tone=\"lo\"]{fill:var(--anatomy-lo)}\n.iso-face-text[data-tone=\"faint\"]{fill:var(--anatomy-faint)}\n.tb-body{fill:var(--anatomy-shade-2);stroke:none}\n.tb-shine{fill:var(--anatomy-top);stroke:none}\n.tb-shade{fill:var(--anatomy-shade-0);stroke:none}\n.tb-ring{fill:none;stroke:var(--anatomy-lo);stroke-width:.45;stroke-linecap:butt;stroke-linejoin:round}\n.tb-ring[data-tone=\"mid\"]{stroke:var(--anatomy-mid)}\n.tb-ring[data-tone=\"faint\"]{stroke:var(--anatomy-faint)}\n.tb-ring[data-tone=\"hi\"]{stroke:var(--anatomy-hi)}\n@keyframes iso-flow{to{stroke-dashoffset:-32}}\n@keyframes iso-pulse{0%,100%{opacity:.18}12%{opacity:1}40%{opacity:.18}}\n.iso-line[data-flow]{animation:iso-flow 1600ms linear infinite}\n.iso-dots circle[data-pulse]{animation:iso-pulse 1600ms steps(1,end) infinite;animation-delay:var(--pulse-at,0ms)}\n.iso-figure{margin:32px 0 36px}\n.iso-plate{position:relative;padding:52px 24px;border-radius:0;background:var(--anatomy-card);box-shadow:0 0 0 1px var(--anatomy-mid);--anatomy-paper:var(--anatomy-card)}\n.iso-plate-corners{position:absolute;inset:18px 20px;pointer-events:none}\n.iso-plate-corner{position:absolute;color:var(--anatomy-muted);font-family:var(--anatomy-mono);font-size:10.5px;line-height:1;letter-spacing:.04em;white-space:nowrap}\n.iso-plate-corner[data-corner=\"fig\"]{top:0;left:0;color:var(--anatomy-text)}\n.iso-plate-corner[data-corner=\"title\"]{top:0;right:0;text-transform:uppercase;letter-spacing:.1em}\n.iso-plate-corner[data-corner=\"hint\"]{bottom:0;left:0;text-transform:uppercase;letter-spacing:.1em}\n.iso-plate-corner[data-corner=\"readout\"]{right:0;bottom:0;color:var(--anatomy-text);font-variant-numeric:tabular-nums}\n.iso-plate .iso-svg{margin:0 auto}\n.iso-legend{display:grid;gap:8px;margin-top:12px;color:var(--anatomy-muted);font-size:13px;line-height:1.55}\n.iso-keys{display:flex;flex-wrap:wrap;gap:6px 18px}\n.iso-key{display:inline-flex;align-items:center;gap:7px}\n.iso-swatch{width:16px;height:10px;flex:none;overflow:visible}\n.iso-swatch path{fill:none;stroke:var(--anatomy-hi);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round}\n.iso-swatch[data-mark=\"raised\"] path,.iso-swatch[data-mark=\"flat\"] path{stroke:var(--anatomy-mid)}\n.iso-swatch[data-mark=\"lit\"] path{stroke:var(--anatomy-lit)}\n.iso-swatch[data-mark=\"dim\"] path{stroke:var(--anatomy-lo)}\n.iso-swatch[data-mark=\"dotted\"] path{stroke-dasharray:.01 3;stroke-width:1.4}\n.iso-swatch[data-mark=\"dashed\"] path{stroke-dasharray:3 2.5}\n.iso-swatch[data-mark=\"red\"] path{stroke:var(--anatomy-red)}\n.iso-swatch[data-mark=\"green\"] path{stroke:var(--anatomy-green)}\n.iso-swatch[data-mark=\"blue\"] path{stroke:var(--anatomy-blue)}\n.iso-swatch-crease{stroke:var(--anatomy-lo)!important}\n@media (max-width:560px){.iso-plate{padding:48px 12px 70px}.iso-plate-corner[data-corner=\"hint\"]{bottom:18px}}\n@media (prefers-reduced-motion:reduce){.iso-line[data-flow],.iso-dots circle[data-pulse]{animation:none}}\n";

/** The check's limit, in the dial's units (0 to 10). */
declare const LIMIT = 6;
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
    /** The SVG's accessible description; a default describes the machine. */
    label?: string;
    /** Called with the readout text whenever it changes. */
    onReadout?: (text: string) => void;
    className?: string;
}
interface VerificationGateProps extends GateMachineProps {
    /** false renders the bare machine with no card, for a slide that places it itself. */
    frame?: boolean;
    fig?: string;
    title?: string;
    hint?: react.ReactNode;
    caption?: react.ReactNode;
}
declare const GATE_CAPTION = "Illustrative, not data from a real system. A dial indicator measures every proposal before it can become a result: tokens at or under the limit (6.0) ride on to the result tray, taller ones are swung into the return chute and slide back to the hopper's tray, to be revised and tried again.";
/** The verification gate without its card. */
declare function GateMachine({ pose, theme, motion, interactive, label, onReadout, className, bare }: GateMachineProps & {
    bare?: boolean;
}): react.JSX.Element;
/**
 * The verification gate for an agent-harness talk: proposals leave a hopper,
 * a dial indicator measures each against a limit, passing ones reach the
 * result tray and failing ones are swung into a chute back to the hopper.
 */
declare function VerificationGate({ frame, fig, title, hint, caption, theme, ...machine }: VerificationGateProps): react.JSX.Element;
declare const GATE_LIMIT = 6;

interface MechanismFrameProps {
    /** Top left, e.g. "Fig 3". */
    fig: string;
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
declare function MechanismFrame({ fig, title, hint, readout, caption, theme, className, children }: MechanismFrameProps): react.JSX.Element;

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

declare const asksForStillness: () => boolean;
declare function useStillness(): boolean;
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

export { AZIMUTH, CYCLE_LENGTH, type Check, Dots, ELEVATION, type ExtrudeOptions, FaceText, type FadeLineStyle, type Faded, type FigureOptions, type FitOptions, type Flat, GATE_CAPTION, GATE_LIMIT, GateMachine, type GateMachineProps, type GatePose, ISO_CSS, type KeyMark, LIMIT, type Layer, type LegendKey, Line, type LineStyle, type LineTone, MechanismFrame, type MechanismFrameProps, PASS_CHECK, PERIOD, type PageOptions, type Plan, type Plane, type PlateOptions, type Point3, type Projection, RETURN_CHECK, RUN_LONG, SCALE, SHADES, type Scene, Solid, type SolidPaths, type SolidStyle, type Spring, type Tally, type Theme, type Ticks, type TokenTarget, type Tone, type Verdict, VerificationGate, type VerificationGateProps, Wire, type WireStyle, asksForStillness, axisVector, boxCorners, cameraOf, checkAt, circleIn, circleRing, coil, corners, cylinder, depthOf, dotGrid, dotsSvg, extrude, faceCircle, faceTextSvg, fadeLineSvg, fadedSvg, figureSvg, fitProjection, follow, groupSvg, haloOf, holdStill, insetPlan, iso, joinPaths, knurl, lineOnTop, lineSvg, onTop, pageHtml, pathOf, planOutline, plateHtml, pointsAt, prismOf, radialTicks, ring, ringOf, ringSeam, rise, roundedPlan, sceneAt, screenRise, segment, sideArc, sideMatrix, sideRing, sideSeam, sideTicks, slabOf, solidSvg, spring, stillScene, tallyOf, tallyText, tokenAt, topMatrix, topTicks, towardViewer, translateAlong, useStillness, verdictOf, verdictText, viewOf, wireSvg };
