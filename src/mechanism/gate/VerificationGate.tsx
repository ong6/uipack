import * as React from "react";
import { usePrefersReducedMotion } from "../../env";
import type { Point3, SolidPaths } from "../kit/iso-kit";
import { Dots, Line, Solid } from "../kit/draw";
import { follow, spring, type Spring } from "../kit/live";
import {
  BASE_ART,
  CHUTE_BACK,
  CHUTE_FRONT,
  CONVEYOR_BACK,
  CONVEYOR_FRONT,
  CONVEYOR_MID,
  DIVERTER,
  GAUGE_BACK,
  GAUGE_FRONT,
  HOPPER_BACK,
  HOPPER_FRONT,
  ORIGIN,
  PLUNGER,
  TRAY_BACK,
  TRAY_FRONT,
  armOf,
  armPointerOf,
  dragOf,
  needleOf,
  slatsOf,
  tokenOf,
  type TokenPaths,
} from "./geometry";
import { LIMIT, SCALE } from "./model";
import { RUN_LONG, clamp, contactOver, sceneAt, stillScene, STILL_AT, type GatePose, type Layer, type Scene } from "./motion";
import { ASSEMBLIES, GX, HEIGHT, MOVES, WIDTH, at, move, type Assembly } from "./view";
import { MechanismFrame } from "../MechanismFrame";

export type { GatePose } from "./motion";

export interface GateMachineProps {
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

export interface VerificationGateProps extends GateMachineProps {
  /** false renders the bare machine with no card, for a slide that places it itself. */
  frame?: boolean;
  /** Top-left corner, as Figure's `number`: "Fig 1". */
  number?: string;
  title?: string;
  hint?: React.ReactNode;
  caption?: React.ReactNode;
}

const LAYERS: Layer[] = ["belt", "chute", "tray"];
const SLOTS = 8;
const LABEL =
  "A verification gate on a bench. Proposal tokens, machined pucks of different heights, leave a hopper on a short conveyor belt and stop under a dial indicator on a bridge. Its plunger rides up onto each token and the needle reads the token's height against a limit mark at 6. A token at or under the limit rides on and drops into the result tray. A taller one is pushed off the belt by a swinging arm into a chute that slides it back to a return tray beside the hopper, to be revised and fed again.";

export const GATE_CAPTION =
  "Illustrative, not data from a real system. A dial indicator measures every proposal before it can become a result: tokens at or under the limit (6.0) ride on to the result tray, taller ones are swung into the return chute and slide back to the hopper's tray, to be revised and tried again.";

const HINTS: Record<GatePose, string> = {
  idle: "Tap or Space to pause",
  pass: "Tap or Space to run again",
  return: "Tap or Space to run again",
  apart: "Tap or Space to reassemble",
};

interface Slot {
  key: string | null;
  value: number;
  pos: Point3;
  layer: Layer;
  alpha: number;
  lit: boolean;
}

interface Display {
  slots: Slot[];
  tip: Spring;
  arm: Spring;
  drag: number;
  beltV: number;
  phase: number;
  shares: Record<Assembly, Spring>;
}

const fine = (value: number) => Math.round(value * 100) / 100;
const sharesAt = (value: number) =>
  Object.fromEntries(ASSEMBLIES.map((name) => [name, { at: value, rate: 0 }])) as Record<Assembly, Spring>;

function contactOf(slots: Slot[]) {
  let top = 0;
  for (const slot of slots) {
    if (!slot.key || slot.layer !== "belt" || slot.alpha < 0.5) continue;
    top = Math.max(top, contactOver(Math.hypot(slot.pos[0] - GX, slot.pos[1]), slot.value));
  }
  return top;
}

/** Snap a display to a scene (first render, still frames, reduced motion). */
function displayOf(scene: Scene, shares = scene.apart ? 1 : 0): Display {
  const slots: Slot[] = Array.from({ length: SLOTS }, () => ({
    key: null,
    value: 5,
    pos: [0, 0, 0] as Point3,
    layer: "belt" as Layer,
    alpha: 0,
    lit: false,
  }));
  scene.tokens.slice(0, SLOTS).forEach((token, index) => {
    slots[index] = {
      key: token.key,
      value: token.check.value,
      pos: [...token.pos] as Point3,
      layer: token.layer,
      alpha: token.alpha,
      lit: token.lit,
    };
  });
  const tip = Math.max(scene.lift, contactOf(slots));
  return {
    slots,
    tip: { at: tip, rate: 0 },
    arm: { at: scene.arm, rate: 0 },
    drag: scene.drag,
    beltV: 0,
    phase: 0,
    shares: sharesAt(shares),
  };
}

/** Follow a scene for `dt` seconds. Returns true while anything still moves. */
function step(display: Display, scene: Scene, dt: number, calm: boolean, targets: Record<Assembly, number>) {
  let moving = false;
  const wanted = new Map(scene.tokens.map((token) => [token.key, token]));
  for (const slot of display.slots) {
    if (!slot.key || wanted.has(slot.key)) continue;
    slot.alpha = follow(slot.alpha, 0, dt, 0.16, calm);
    slot.lit = false;
    if (slot.alpha < 0.01) slot.key = null;
    else moving = true;
  }
  for (const token of scene.tokens) {
    let slot = display.slots.find((candidate) => candidate.key === token.key);
    if (!slot) {
      slot = display.slots.find((candidate) => !candidate.key) ?? [...display.slots].sort((a, b) => a.alpha - b.alpha)[0]!;
      Object.assign(slot, {
        key: token.key,
        value: token.check.value,
        pos: [...token.pos],
        layer: token.layer,
        alpha: calm ? token.alpha : 0,
        lit: token.lit,
      });
      moving = true;
      continue;
    }
    slot.layer = token.layer;
    slot.lit = token.lit;
    for (let axis = 0; axis < 3; axis++) {
      slot.pos[axis] = follow(slot.pos[axis]!, token.pos[axis]!, dt, 0.05, calm);
      if (slot.pos[axis] !== token.pos[axis]) moving = true;
    }
    slot.alpha = follow(slot.alpha, token.alpha, dt, 0.12, calm);
    if (slot.alpha !== token.alpha) moving = true;
  }
  const tipWant = Math.max(scene.lift, contactOf(display.slots));
  if (!spring(display.tip, tipWant, dt, 320, 30, calm)) moving = true;
  if (!spring(display.arm, scene.arm, dt, 140, 22, calm)) moving = true;
  display.drag = follow(display.drag, scene.drag, dt, 0.28, calm);
  if (display.drag !== scene.drag) moving = true;
  display.beltV = follow(display.beltV, scene.belt, dt, 0.08, calm);
  if (Math.abs(display.beltV) < 0.05 && scene.belt === 0) display.beltV = 0;
  display.phase += display.beltV * dt;
  if (display.beltV !== 0 || scene.belt !== 0) moving = true;
  for (const name of ASSEMBLIES) {
    if (!spring(display.shares[name], targets[name], dt, 64, 14.2, calm)) moving = true;
  }
  return moving;
}

const tokenMove = (pos: Point3) => {
  const [x, y] = at(pos);
  return `translate(${fine(x - ORIGIN[0])} ${fine(y - ORIGIN[1])})`;
};
const shareMove = (name: Assembly, share: number) => {
  if (share === 0) return "";
  const [x, y, z] = MOVES[name];
  return move([x * share, y * share, z * share]);
};
const readingOf = (display: Display) => clamp(display.tip.at, 0, SCALE);

function TokenArt({ paths }: { paths: TokenPaths }) {
  const { solid } = paths;
  return (
    <>
      <path className="iso-fill" d={solid.fill} />
      {solid.shades.map((d, shade) => (
        <path key={shade} className="iso-shade" data-shade={shade} d={d} />
      ))}
      <path className="iso-top" d={solid.top} />
      <path className="iso-line iso-crease" data-tone="lo" d={solid.crease} />
      <path className="iso-line iso-bevel" data-tone="faint" d={solid.bevel ?? ""} />
      <path className="iso-line um-token-face" data-tone="lo" d={paths.face} />
      <path className="iso-line iso-edge" data-tone="hi" d={solid.outline} />
      <circle className="um-token-mark" cx={fine(paths.mark[0])} cy={fine(paths.mark[1])} r={0.7} />
    </>
  );
}

function writeSolid(group: Element | null, solid: SolidPaths) {
  if (!group) return;
  group.querySelector(":scope > .iso-fill")?.setAttribute("d", solid.fill);
  group.querySelectorAll(":scope > .iso-shade").forEach((node, shade) => node.setAttribute("d", solid.shades[shade] ?? ""));
  group.querySelector(":scope > .iso-top")?.setAttribute("d", solid.top);
  group.querySelector(":scope > .iso-crease")?.setAttribute("d", solid.crease);
  group.querySelector(":scope > .iso-bevel")?.setAttribute("d", solid.bevel ?? "");
  group.querySelector(":scope > .iso-edge")?.setAttribute("d", solid.outline);
}

function writeToken(group: Element, paths: TokenPaths) {
  writeSolid(group, paths.solid);
  group.querySelector(":scope > .um-token-face")?.setAttribute("d", paths.face);
  const mark = group.querySelector(":scope > .um-token-mark");
  mark?.setAttribute("cx", `${fine(paths.mark[0])}`);
  mark?.setAttribute("cy", `${fine(paths.mark[1])}`);
}

const tokenCache = new Map<number, TokenPaths>();
const tokenPaths = (value: number) => {
  const key = Math.round(value * 10);
  let paths = tokenCache.get(key);
  if (!paths) tokenCache.set(key, (paths = tokenOf(key / 10)));
  return paths;
};

function setAttr(node: Element | null | undefined, name: string, value: string) {
  if (!node) return;
  if (value === "") {
    if (node.hasAttribute(name)) node.removeAttribute(name);
  } else if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}

function useId() {
  const id = React.useId();
  return `um${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** The verification gate without its card. */
/** `bare` (internal): the machine is its own styled root; VerificationGate passes false inside its card, which carries the theme. */
export function GateMachine({
  pose = "idle",
  theme,
  motion = "auto",
  interactive = true,
  alt = LABEL,
  onReadout,
  className,
  bare = true,
}: GateMachineProps & { bare?: boolean }) {
  const uid = useId();
  const root = React.useRef<HTMLDivElement>(null);
  const live = React.useRef<HTMLSpanElement>(null);
  const animated = interactive && motion === "auto";
  // The viewer's setting, read once per change rather than through matchMedia on every frame.
  const reduced = usePrefersReducedMotion();
  const stillness = React.useRef(reduced);
  stillness.current = reduced;
  // Mirrors state.current.paused for the visible Pause control's label.
  const [paused, setPaused] = React.useState(false);

  // First frame: the pose's still for thumbnails and stillness; otherwise the start of the pose.
  const start = React.useRef<{ display: Display; scene: Scene; t: number } | null>(null);
  if (!start.current || !interactive) {
    const calm = !animated || reduced;
    const t = calm || pose === "idle" ? STILL_AT[pose] : 0;
    const scene = calm ? stillScene(pose) : sceneAt(pose, t);
    start.current = { display: displayOf(scene, calm && pose === "apart" ? 1 : 0), scene, t: calm ? STILL_AT[pose] : t };
  }
  const first = start.current;
  const shown = first.display;

  const state = React.useRef({
    display: first.display,
    t: first.t,
    round: 0,
    paused: false,
    visible: false,
    frame: 0,
    last: 0,
    targets: Object.fromEntries(ASSEMBLIES.map((name) => [name, first.display.shares[name].at])) as Record<Assembly, number>,
    timers: [] as number[],
    readout: "",
    phase: "",
    heights: [] as number[],
  });
  const poseRef = React.useRef(pose);
  const readoutRef = React.useRef(onReadout);
  readoutRef.current = onReadout;

  const sceneNow = React.useCallback((): Scene => {
    const s = state.current;
    const calm = stillness.current || motion === "none";
    const scene = calm ? stillScene(poseRef.current) : sceneAt(poseRef.current, s.t, s.round);
    if (s.paused && poseRef.current === "idle")
      return { ...scene, belt: 0, readout: `${scene.readout} · paused`, phase: "paused" };
    return scene;
  }, [motion]);

  const draw = React.useCallback((scene: Scene) => {
    const node = root.current;
    if (!node) return;
    const s = state.current;
    const display = s.display;
    const svg = node.querySelector("svg");
    if (!svg) return;
    display.slots.forEach((slot, index) => {
      const value = Math.round(slot.value * 10);
      const rebuild = s.heights[index] !== value;
      s.heights[index] = value;
      for (const layer of LAYERS) {
        const group = svg.querySelector(`[data-slot="${index}"][data-layer="${layer}"]`);
        if (!group) continue;
        const on = slot.key !== null && slot.layer === layer && slot.alpha > 0.005;
        if (rebuild) writeToken(group, tokenPaths(slot.value));
        setAttr(group, "display", on ? "" : "none");
        if (!on) continue;
        setAttr(group, "transform", tokenMove(slot.pos));
        setAttr(group, "opacity", slot.alpha >= 0.995 ? "" : slot.alpha.toFixed(2));
        if (slot.lit) group.setAttribute("data-lit", "");
        else group.removeAttribute("data-lit");
      }
    });
    setAttr(svg.querySelector("[data-part=slats]"), "d", slatsOf(display.phase));
    setAttr(svg.querySelector("[data-part=plunger]"), "transform", move([0, 0, display.tip.at]));
    setAttr(svg.querySelector("[data-part=needle]"), "d", needleOf(readingOf(display)));
    setAttr(svg.querySelector("[data-part=drag]"), "d", dragOf(clamp(display.drag, 0, SCALE)));
    writeSolid(svg.querySelector("[data-part=arm]"), armOf(clamp(display.arm.at, -0.05, 1.05)));
    setAttr(svg.querySelector("[data-part=pointer]"), "d", armPointerOf(clamp(display.arm.at, -0.05, 1.05)));
    for (const name of ASSEMBLIES) {
      const transform = shareMove(name, Math.abs(display.shares[name].at) < 1e-4 ? 0 : display.shares[name].at);
      svg.querySelectorAll(`[data-assembly="${name}"]`).forEach((group) => setAttr(group, "transform", transform));
    }
    let text = scene.readout;
    if (poseRef.current === "apart" && ASSEMBLIES.some((name) => Math.abs(display.shares[name].at - 1) > 0.01))
      text = "taking apart";
    else if (poseRef.current !== "apart" && ASSEMBLIES.some((name) => display.shares[name].at > 0.01)) text = "closing up";
    if (text !== s.readout) {
      s.readout = text;
      const slot = node.closest(".um-frame")?.querySelector("[data-readout]");
      if (slot && slot.textContent !== text) slot.textContent = text;
      readoutRef.current?.(text);
    }
    if (scene.phase !== s.phase && live.current) {
      s.phase = scene.phase;
      if (document.activeElement === node) live.current.textContent = scene.phase;
    }
  }, []);

  const run = React.useCallback(() => {
    const s = state.current;
    if (s.frame || !s.visible) return;
    s.last = 0;
    const tick = (now: number) => {
      const dt = s.last ? Math.min((now - s.last) / 1000, 1 / 30) : 1 / 60;
      s.last = now;
      const calm = stillness.current || motion === "none";
      const current = poseRef.current;
      if (!s.paused && !calm) s.t += dt;
      const scene = sceneNow();
      const moving = step(s.display, scene, dt, calm, s.targets);
      draw(scene);
      const scripted =
        !calm &&
        !s.paused &&
        (current === "idle" || ((current === "pass" || current === "return") && s.t < RUN_LONG[current] + 0.2));
      const pending = s.timers.length > 0;
      s.frame = s.visible && (moving || scripted || pending) ? requestAnimationFrame(tick) : 0;
    };
    s.frame = requestAnimationFrame(tick);
  }, [draw, motion, sceneNow]);

  const stop = React.useCallback(() => {
    const s = state.current;
    cancelAnimationFrame(s.frame);
    s.frame = 0;
  }, []);

  /** Aim the explode springs: open in stagger order, close in reverse. */
  const aim = React.useCallback((apart: boolean, calm: boolean) => {
    const s = state.current;
    s.timers.forEach((timer) => window.clearTimeout(timer));
    s.timers = [];
    const order = apart ? [...ASSEMBLIES] : [...ASSEMBLIES].reverse();
    const changing = order.filter((name) => s.targets[name] !== (apart ? 1 : 0));
    changing.forEach((name, index) => {
      if (calm || index === 0) {
        s.targets[name] = apart ? 1 : 0;
        return;
      }
      const timer = window.setTimeout(() => {
        s.targets[name] = apart ? 1 : 0;
        s.timers = s.timers.filter((other) => other !== timer);
      }, index * 70);
      s.timers.push(timer);
    });
  }, []);

  // A pose change: restart the pose's clock and move there from wherever the parts are.
  React.useEffect(() => {
    if (!interactive) return;
    const s = state.current;
    const changed = poseRef.current !== pose;
    poseRef.current = pose;
    const calm = stillness.current || motion === "none";
    if (changed) {
      s.t = calm ? STILL_AT[pose] : 0;
      s.round++;
      s.paused = false;
      setPaused(false);
    }
    aim(pose === "apart", calm);
    if (calm) {
      const scene = sceneNow();
      step(s.display, scene, 1, true, s.targets);
      draw(scene);
      return;
    }
    run();
  }, [pose, interactive, motion, aim, draw, run, sceneNow]);

  // Run only while on screen.
  React.useEffect(() => {
    if (!interactive) return;
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      state.current.visible = true;
      run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = Boolean(entries[entries.length - 1]?.isIntersecting);
        state.current.visible = visible;
        if (visible) run();
        else stop();
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    const s = state.current;
    return () => {
      observer.disconnect();
      stop();
      s.timers.forEach((timer) => window.clearTimeout(timer));
      s.timers = [];
    };
  }, [interactive, run, stop]);

  // Reduced motion switched on mid-flight: settle on the still frame. Switched off: run again.
  const wasReduced = React.useRef(reduced);
  React.useEffect(() => {
    if (wasReduced.current === reduced) return;
    wasReduced.current = reduced;
    if (!interactive) return;
    const s = state.current;
    if (reduced) {
      stop();
      s.t = STILL_AT[poseRef.current];
      aim(poseRef.current === "apart", true);
      const scene = sceneNow();
      step(s.display, scene, 1, true, s.targets);
      draw(scene);
    } else run();
  }, [reduced, interactive, aim, draw, run, sceneNow, stop]);

  const act = () => {
    const s = state.current;
    const current = poseRef.current;
    const calm = stillness.current || motion === "none";
    if (current === "idle") {
      s.paused = !s.paused;
      setPaused(s.paused);
    } else if (current === "apart") {
      const open = ASSEMBLIES.every((name) => s.targets[name] === 1);
      aim(!open, calm);
    } else {
      s.round++;
      s.t = calm ? STILL_AT[current] : 0;
    }
    if (calm) {
      const scene = sceneNow();
      step(s.display, scene, 1, true, s.targets);
      draw(scene);
    }
    run();
    if (live.current)
      live.current.textContent =
        current === "idle"
          ? s.paused
            ? "paused"
            : "running"
          : current === "apart"
            ? "reassembling or taking apart"
            : "running again";
  };

  const reading = readingOf(shown);
  const arm = armOf(shown.arm.at);
  const hint = HINTS[pose];

  const art = (
    <svg className="iso-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={alt} focusable="false">
      <title id={`${uid}-title`}>Verification gate</title>
      <g data-part="base">
        <path className="iso-halo" d={BASE_ART.halo} />
        {BASE_ART.feet.map((parts, index) => (
          <g key={index}>
            {parts.map((paths, part) => (
              <Solid key={part} paths={paths} tone={part ? "mid" : "lo"} />
            ))}
          </g>
        ))}
        <Solid paths={BASE_ART.slab} tone="mid" />
        <Line d={BASE_ART.groove} tone="lo" />
        <Line d={BASE_ART.screwRings} tone="lo" />
        <Dots points={BASE_ART.screws} size={0.5} tone="mid" />
        <Solid paths={BASE_ART.strip} tone="lo" crease="none" />
        <Line d={BASE_ART.stripMinor} tone="lo" />
        <Line d={BASE_ART.stripMajor} tone="mid" />
        <Dots points={BASE_ART.stripScrews} size={0.45} tone="mid" />
        <Solid paths={BASE_ART.label} tone="lo" crease="none" />
        <Line d={BASE_ART.labelLine} tone="faint" />
        <Line d={BASE_ART.labelRule} tone="lo" free />
        <Dots points={BASE_ART.labelScrews} size={0.45} tone="mid" />
      </g>

      <g data-assembly="conveyor" transform={shareMove("conveyor", shown.shares.conveyor.at) || undefined}>
        {CONVEYOR_BACK.legs.map((leg, index) => (
          <g key={index}>
            <Solid paths={leg.foot} tone="lo" />
            <Dots points={leg.screws} size={0.45} tone="mid" />
            <Solid paths={leg.post} tone="mid" />
          </g>
        ))}
        {CONVEYOR_BACK.stretchers.map((paths, index) => (
          <Solid key={index} paths={paths} tone="mid" />
        ))}
        <Solid paths={CONVEYOR_BACK.backRail} tone="mid" />
        <Solid paths={CONVEYOR_BACK.backLip} tone="mid" />
        <Dots points={CONVEYOR_BACK.backScrews} size={0.45} tone="mid" />
      </g>
      <g data-assembly="gauge" transform={shareMove("gauge", shown.shares.gauge.at) || undefined}>
        <Solid paths={GAUGE_BACK.foot} tone="lo" />
        <Dots points={GAUGE_BACK.screws} size={0.45} tone="mid" />
        <Solid paths={GAUGE_BACK.post} tone="mid" />
      </g>
      <g data-assembly="diverter" transform={shareMove("diverter", shown.shares.diverter.at) || undefined}>
        <Solid paths={DIVERTER.bracket} tone="mid" />
        <Dots points={DIVERTER.bracketScrews} size={0.45} tone="mid" />
        <Solid paths={DIVERTER.post} tone="mid" crease="none" />
        <Solid paths={DIVERTER.hub} tone="mid" />
        <Solid paths={DIVERTER.head} tone="mid" />
        <Line d={DIVERTER.headKnurl} tone="lo" />
        <Dots points={DIVERTER.stops} size={0.45} tone="hi" />
        <path data-part="pointer" className="iso-line" data-tone="hi" d={armPointerOf(shown.arm.at)} />
      </g>
      <g data-assembly="conveyor" transform={shareMove("conveyor", shown.shares.conveyor.at) || undefined}>
        {CONVEYOR_MID.drums.map((paths, index) => (
          <Solid key={index} paths={paths} tone="mid" />
        ))}
        <Solid paths={CONVEYOR_MID.belt} tone="mid" crease="faint" />
        <path data-part="slats" className="iso-line" data-tone="faint" d={slatsOf(shown.phase)} />
      </g>
      <g data-assembly="hopper" transform={shareMove("hopper", shown.shares.hopper.at) || undefined}>
        <Solid paths={HOPPER_BACK.backCheek} tone="mid" />
        <Solid paths={HOPPER_BACK.tube} tone="mid" inner={<Line d={HOPPER_BACK.seams} tone="faint" />} />
        <path className="um-cavity" d={HOPPER_BACK.windowFill} />
        <Line d={HOPPER_BACK.stack} tone="mid" />
        <Line d={HOPPER_BACK.window} tone="lo" />
        <Solid paths={HOPPER_BACK.collar} tone="mid" />
        <path className="um-cavity" d={HOPPER_BACK.mouthFill} />
        <Line d={HOPPER_BACK.mouth} tone="lo" />
        <Dots points={HOPPER_BACK.collarScrews} size={0.45} tone="mid" />
        <Solid paths={HOPPER_BACK.gate} tone="mid" />
        <Dots points={HOPPER_BACK.gateScrews} size={0.45} tone="mid" />
      </g>
      <g data-assembly="diverter" transform={shareMove("diverter", shown.shares.diverter.at) || undefined}>
        <g data-part="arm" className="iso-solid">
          <path className="iso-fill" d={arm.fill} />
          {arm.shades.map((d, shade) => (
            <path key={shade} className="iso-shade" data-shade={shade} d={d} />
          ))}
          <path className="iso-top" d={arm.top} />
          <path className="iso-line iso-crease" data-tone="faint" d={arm.crease} />
          <path className="iso-line iso-bevel" data-tone="faint" d={arm.bevel ?? ""} />
          <path className="iso-line iso-edge" data-tone="mid" d={arm.outline} />
        </g>
        <g data-assembly="conveyor" transform={shareMove("conveyor", shown.shares.conveyor.at) || undefined}>
          <Tokens layer="belt" slots={shown.slots} />
        </g>
        <g data-assembly="conveyor" transform={shareMove("conveyor", shown.shares.conveyor.at) || undefined}>
          <Solid paths={CONVEYOR_FRONT.rail} tone="mid" inner={<Line d={CONVEYOR_FRONT.railSeam} tone="faint" />} />
          <Dots points={CONVEYOR_FRONT.railScrews} size={0.45} tone="mid" />
          {CONVEYOR_FRONT.lips.map((paths, index) => (
            <Solid key={index} paths={paths} tone="mid" />
          ))}
          <Line d={CONVEYOR_FRONT.lipMinor} tone="lo" />
          <Line d={CONVEYOR_FRONT.lipMajor} tone="mid" />
          <Line d={CONVEYOR_FRONT.zero} tone="hi" />
          <Solid paths={CONVEYOR_FRONT.bearing} tone="mid" />
          <Line d={CONVEYOR_FRONT.bearingBore} tone="lo" />
          <Dots points={CONVEYOR_FRONT.bearingScrews} size={0.45} tone="mid" />
          <Solid paths={CONVEYOR_FRONT.motor} tone="mid" inner={<Line d={CONVEYOR_FRONT.motorBands} tone="faint" />} />
          <Line d={CONVEYOR_FRONT.motorCap} tone="lo" />
          <Dots points={CONVEYOR_FRONT.motorBolts} size={0.45} tone="mid" />
          <Dots points={[CONVEYOR_FRONT.motorShaft]} size={0.8} tone="hi" />
          <Solid paths={CONVEYOR_FRONT.box} tone="mid" />
          <Line d={CONVEYOR_FRONT.boxLine} tone="faint" />
          <Dots points={CONVEYOR_FRONT.boxScrews} size={0.4} tone="mid" />
        </g>
        <g data-assembly="hopper" transform={shareMove("hopper", shown.shares.hopper.at) || undefined}>
          <Solid paths={HOPPER_FRONT.cheek} tone="mid" />
          <Dots points={HOPPER_FRONT.cheekScrews} size={0.45} tone="mid" />
        </g>
      </g>
      <g data-assembly="gauge" transform={shareMove("gauge", shown.shares.gauge.at) || undefined}>
        <g data-part="plunger" transform={move([0, 0, shown.tip.at])}>
          <Solid paths={PLUNGER.tip} tone="hi" />
          <Solid paths={PLUNGER.rod} tone="hi" crease="none" inner={<Line d={PLUNGER.rodMarks} tone="lo" />} />
        </g>
        <Solid paths={GAUGE_FRONT.guide} tone="mid" />
        <Solid paths={GAUGE_FRONT.front.foot} tone="lo" />
        <Dots points={GAUGE_FRONT.front.screws} size={0.45} tone="mid" />
        <Solid paths={GAUGE_FRONT.front.post} tone="mid" />
        <Solid paths={GAUGE_FRONT.beam} tone="mid" />
        <Line d={GAUGE_FRONT.beamLine} tone="faint" />
        <Dots points={GAUGE_FRONT.beamScrews} size={0.5} tone="mid" />
        <Solid paths={GAUGE_FRONT.neck} tone="mid" />
        <Solid paths={GAUGE_FRONT.crown} tone="mid" />
        <Solid paths={GAUGE_FRONT.crownCap} tone="mid" inner={<Line d={GAUGE_FRONT.crownKnurl} tone="lo" />} />
        <Solid paths={GAUGE_FRONT.puck} tone="hi" crease="lo" inner={<Line d={GAUGE_FRONT.band} tone="faint" />} />
        <Line d={GAUGE_FRONT.knurl} tone="lo" />
        <Line d={GAUGE_FRONT.bezel} tone="lo" />
        <Line d={GAUGE_FRONT.minor} tone="lo" />
        <Line d={GAUGE_FRONT.major} tone="mid" />
        <Line d={GAUGE_FRONT.band0} tone="mid" />
        <path className="iso-line um-limit" d={GAUGE_FRONT.limit} />
        <path data-part="drag" className="iso-line um-drag" d={dragOf(clamp(shown.drag, 0, SCALE))} />
        <path data-part="needle" className="iso-line um-needle" d={needleOf(reading)} />
        <Line d={GAUGE_FRONT.hub} tone="mid" />
      </g>
      <g data-assembly="chute" transform={shareMove("chute", shown.shares.chute.at) || undefined}>
        {CHUTE_BACK.supports.map((support, index) => (
          <g key={index}>
            <Solid paths={support.foot} tone="lo" />
            <Solid paths={support.post} tone="mid" />
          </g>
        ))}
        <Solid paths={CHUTE_BACK.apronFoot} tone="lo" />
        <Solid paths={CHUTE_BACK.apronPost} tone="mid" />
        <Solid paths={CHUTE_BACK.trayFloor} tone="lo" />
        <Solid paths={CHUTE_BACK.trayBack} tone="mid" />
        <Solid paths={CHUTE_BACK.trayLeft} tone="mid" />
        <Solid paths={CHUTE_BACK.backWall} tone="mid" />
        <Solid paths={CHUTE_BACK.floor} tone="mid" inner={<Line d={CHUTE_BACK.floorLines} tone="lo" />} />
        <Solid paths={CHUTE_BACK.apron} tone="mid" inner={<Line d={CHUTE_BACK.apronLines} tone="lo" />} />
        <Tokens layer="chute" slots={shown.slots} />
        <Solid paths={CHUTE_FRONT.frontWall} tone="mid" />
        <Dots points={CHUTE_FRONT.wallScrews} size={0.45} tone="mid" />
        <Solid paths={CHUTE_FRONT.apronWall} tone="mid" />
        <Solid paths={CHUTE_FRONT.endWall} tone="mid" />
        <Solid paths={CHUTE_FRONT.trayRight} tone="mid" />
        <Solid paths={CHUTE_FRONT.trayFront} tone="mid" />
      </g>
      <g data-assembly="tray" transform={shareMove("tray", shown.shares.tray.at) || undefined}>
        <Solid paths={TRAY_BACK.floor} tone="lo" />
        <Line d={TRAY_BACK.floorGrid} tone="faint" />
        <Solid paths={TRAY_BACK.back} tone="mid" />
        <Solid paths={TRAY_BACK.left} tone="mid" />
        <Tokens layer="tray" slots={shown.slots} />
        <Solid paths={TRAY_FRONT.right} tone="mid" />
        <Solid paths={TRAY_FRONT.front} tone="mid" />
        <Dots points={TRAY_FRONT.screws} size={0.45} tone="mid" />
      </g>
    </svg>
  );

  const machine = (
    <div
      ref={root}
      className={`um-machine${bare ? " uipack-mechanism" : ""}${className ? ` ${className}` : ""}`}
      data-theme={bare ? theme : undefined}
      data-pose={pose}
      data-interactive={interactive ? "" : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Verification gate, ${pose} pose. ${hint}.` : undefined}
      aria-describedby={interactive ? `${uid}-title` : undefined}
      onClick={interactive ? act : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                if (!event.repeat) act();
              }
            }
          : undefined
      }
    >
      {art}
      {interactive ? <span ref={live} className="um-hidden" aria-live="polite" /> : null}
    </div>
  );
  // The idle tour loops for as long as it is on screen, so it carries a visible Pause control
  // (WCAG 2.2.2), beside the machine rather than inside it: the machine is a button already.
  if (!animated || reduced || pose !== "idle") return machine;
  const control = (
    <button type="button" className="um-motion" onClick={act}>
      {paused ? "Resume motion" : "Pause motion"}
    </button>
  );
  return bare ? (
    <div className="uipack-mechanism um-live" data-theme={theme}>
      {machine}
      {control}
    </div>
  ) : (
    <>
      {machine}
      {control}
    </>
  );
}

function Tokens({ layer, slots }: { layer: Layer; slots: Slot[] }) {
  return (
    <>
      {slots.map((slot, index) => {
        const on = slot.key !== null && slot.layer === layer && slot.alpha > 0.005;
        return (
          <g
            key={index}
            className="iso-solid um-token"
            data-slot={index}
            data-layer={layer}
            data-lit={on && slot.lit ? "" : undefined}
            display={on ? undefined : "none"}
            transform={tokenMove(slot.pos)}
            opacity={on && slot.alpha < 0.995 ? slot.alpha.toFixed(2) : undefined}
          >
            <TokenArt paths={tokenPaths(slot.value)} />
          </g>
        );
      })}
    </>
  );
}

/**
 * The verification gate for an agent-harness talk: proposals leave a hopper,
 * a dial indicator measures each against a limit, passing ones reach the
 * result tray and failing ones are swung into a chute back to the hopper.
 */
export function VerificationGate({
  frame = true,
  number = "Fig 1",
  title = "Verification gate",
  hint,
  caption = GATE_CAPTION,
  theme,
  ...machine
}: VerificationGateProps) {
  const pose = machine.pose ?? "idle";
  if (!frame) return <GateMachine {...machine} theme={theme} />;
  const interactive = machine.interactive ?? true;
  const shownHint = hint ?? (interactive ? HINTS[pose] : undefined);
  return (
    <MechanismFrame
      number={number}
      title={title}
      hint={shownHint}
      readout={stillScene(pose).readout}
      caption={caption}
      theme={theme}
    >
      <GateMachine {...machine} bare={false} />
    </MechanismFrame>
  );
}

export const GATE_LIMIT = LIMIT;
