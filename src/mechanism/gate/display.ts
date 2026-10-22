// The gate's display model: where every token, the plunger, the arm and the exploded assemblies are
// right now, how they follow a scene frame by frame, and how that is written onto the drawn SVG.
// No React: GateMachine renders the first frame from it, and its loop (useGateLoop) moves it.
import type { Point3, SolidPaths } from "../kit/iso-kit";
import { follow, spring, type Spring } from "../kit/live";
import { armOf, armPointerOf, dragOf, needleOf, ORIGIN, slatsOf, tokenOf, type TokenPaths } from "./geometry";
import { SCALE } from "./model";
import { clamp } from "../../math";
import { contactOver, type GatePose, type Layer, type Scene } from "./motion";
import { ASSEMBLIES, GX, MOVES, at, move, type Assembly } from "./view";

const LAYERS: Layer[] = ["belt", "chute", "tray"];
const SLOTS = 8;

export interface Slot {
  key: string | null;
  value: number;
  pos: Point3;
  layer: Layer;
  alpha: number;
  lit: boolean;
}

export interface Display {
  slots: Slot[];
  tip: Spring;
  arm: Spring;
  drag: number;
  beltV: number;
  phase: number;
  shares: Record<Assembly, Spring>;
}

export const fine = (value: number) => Math.round(value * 100) / 100;
export const sharesAt = (value: number) =>
  Object.fromEntries(ASSEMBLIES.map((name) => [name, { at: value, rate: 0 }])) as Record<Assembly, Spring>;

export function contactOf(slots: Slot[]) {
  let top = 0;
  for (const slot of slots) {
    if (!slot.key || slot.layer !== "belt" || slot.alpha < 0.5) continue;
    top = Math.max(top, contactOver(Math.hypot(slot.pos[0] - GX, slot.pos[1]), slot.value));
  }
  return top;
}

/** Snap a display to a scene (first render, still frames, reduced motion). */
export function displayOf(scene: Scene, shares = scene.apart ? 1 : 0): Display {
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
export function step(display: Display, scene: Scene, dt: number, calm: boolean, targets: Record<Assembly, number>) {
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

export const tokenMove = (pos: Point3) => {
  const [x, y] = at(pos);
  return `translate(${fine(x - ORIGIN[0])} ${fine(y - ORIGIN[1])})`;
};
export const shareMove = (name: Assembly, share: number) => {
  if (share === 0) return "";
  const [x, y, z] = MOVES[name];
  return move([x * share, y * share, z * share]);
};
export const readingOf = (display: Display) => clamp(display.tip.at, 0, SCALE);

export function writeSolid(group: Element | null, solid: SolidPaths) {
  if (!group) return;
  group.querySelector(":scope > .iso-fill")?.setAttribute("d", solid.fill);
  group.querySelectorAll(":scope > .iso-shade").forEach((node, shade) => node.setAttribute("d", solid.shades[shade] ?? ""));
  group.querySelector(":scope > .iso-top")?.setAttribute("d", solid.top);
  group.querySelector(":scope > .iso-crease")?.setAttribute("d", solid.crease);
  group.querySelector(":scope > .iso-bevel")?.setAttribute("d", solid.bevel ?? "");
  group.querySelector(":scope > .iso-edge")?.setAttribute("d", solid.outline);
}

export function writeToken(group: Element, paths: TokenPaths) {
  writeSolid(group, paths.solid);
  group.querySelector(":scope > .um-token-face")?.setAttribute("d", paths.face);
  const mark = group.querySelector(":scope > .um-token-mark");
  mark?.setAttribute("cx", `${fine(paths.mark[0])}`);
  mark?.setAttribute("cy", `${fine(paths.mark[1])}`);
}

const tokenCache = new Map<number, TokenPaths>();
export const tokenPaths = (value: number) => {
  const key = Math.round(value * 10);
  let paths = tokenCache.get(key);
  if (!paths) tokenCache.set(key, (paths = tokenOf(key / 10)));
  return paths;
};

export function setAttr(node: Element | null | undefined, name: string, value: string) {
  if (!node) return;
  if (value === "") {
    if (node.hasAttribute(name)) node.removeAttribute(name);
  } else if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}

/** Write a display onto the machine's SVG. `heights` remembers each slot's drawn token, so a token is rebuilt only when it changes. */
export function paintDisplay(svg: SVGSVGElement, display: Display, heights: number[]) {
  display.slots.forEach((slot, index) => {
    const value = Math.round(slot.value * 10);
    const rebuild = heights[index] !== value;
    heights[index] = value;
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
}

/** The readout line: the scene's own, or what the assemblies are doing while they part or close. */
export function readoutOf(pose: GatePose, display: Display, scene: Scene): string {
  if (pose === "apart" && ASSEMBLIES.some((name) => Math.abs(display.shares[name].at - 1) > 0.01)) return "taking apart";
  if (pose !== "apart" && ASSEMBLIES.some((name) => display.shares[name].at > 0.01)) return "closing up";
  return scene.readout;
}
