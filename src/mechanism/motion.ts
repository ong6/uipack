/* Scripted scenes for the verification gate: pure functions of time that say
   where every token should be, whether the plunger is lifted, whether the arm
   diverts and what the readout says. The live component follows these targets
   with springs and exponential easing, so a pose change never jumps. */
import type { Point3 } from "./kit/iso-kit";
import { checkAt, tallyOf, tallyText, verdictText, PASS_CHECK, RETURN_CHECK, type Check } from "./gate";
import { ARM_SWING, ASSEMBLIES, BELT_X1, BT, CHUTE_MID, CHUTE_X0, CHUTE_X1, GX, LIFTED, PIVOT, RAIL_OUT, RESULT_TRAY, RETURN_TRAY, TOKEN_R, TRAY_FLOOR, APRON_TOP, chuteTop } from "./view";
import { smoothstep } from "../zoom-math";

export type GatePose = "idle" | "pass" | "return" | "apart";
export type Layer = "belt" | "chute" | "tray";

export interface TokenTarget {
  key: string;
  check: Check;
  pos: Point3;
  layer: Layer;
  alpha: number;
  lit: boolean;
}

export interface Scene {
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

/** Belt speed. */
export const SPEED = 52;
const X_IN = -104;
const X_SHOWN = -90;
/** Seconds from leaving the hopper to arriving under the gauge. */
export const ARRIVE = (GX - X_IN) / SPEED;
const LOWER = 0.35;
/** When the reading is taken (the drag hand and the tally update). */
export const MEASURED = ARRIVE + 0.6;
const RAISE_AT = ARRIVE + 1.0;
const RAISED = ARRIVE + 1.3;
const SWING_AT = ARRIVE + 0.7;
const SWUNG = ARRIVE + 1.2;
/** The arm's upstream face meets a token here (centre on the belt line). */
const ARM_DIR: [number, number] = [Math.cos((ARM_SWING * Math.PI) / 180), Math.sin((ARM_SWING * Math.PI) / 180)];
const CONTACT_X = PIVOT[0] + ARM_DIR[0] * (-PIVOT[1] / ARM_DIR[1]) - (TOKEN_R + 2) / ARM_DIR[1];
const TO_CONTACT = (CONTACT_X - GX) / SPEED;
const SLIDE_SPEED = 40;
const SLIDE_LONG = CHUTE_MID / ARM_DIR[1];
const SLIDE = SLIDE_LONG / SLIDE_SPEED;
const OFF_BELT = RAIL_OUT + TOKEN_R;
const CHUTE_RUN = 1.7;
const DROP = 0.4;
const TRAY_SLOTS: [number, number][] = [
  [RESULT_TRAY.x + 10, RESULT_TRAY.y + 12],
  [RESULT_TRAY.x + 27, RESULT_TRAY.y + 12],
  [RESULT_TRAY.x + 10, RESULT_TRAY.y + 29],
  [RESULT_TRAY.x + 27, RESULT_TRAY.y + 29],
];
const RETURN_AT: Point3 = [RETURN_TRAY.x + 13, RETURN_TRAY.y + RETURN_TRAY.d / 2, TRAY_FLOOR];
/** Seconds between proposals in the idle tour. */
export const PERIOD = 5.4;
/** The idle tour opens a few proposals in, so the trays already hold some. */
export const IDLE_START = 4 * PERIOD + 0.4;
const KEEP_RETURNED = 1.8;

/** `value` held within [low, high] (0..1 by default). */
export const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const smooth = (value: number) => smoothstep(0, 1, value);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Point3, b: Point3, t: number): Point3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Where a token is `u` seconds after it leaves the hopper, given where it will end. */
export function tokenAt(u: number, check: Check, slot: number): { pos: Point3; layer: Layer; alpha: number; done: boolean } {
  const onBelt = (x: number): Point3 => [x, 0, BT];
  if (u < ARRIVE) {
    const x = X_IN + SPEED * Math.max(0, u);
    return { pos: onBelt(x), layer: "belt", alpha: smooth((x - X_IN) / (X_SHOWN - X_IN)), done: false };
  }
  if (u < RAISED) return { pos: onBelt(GX), layer: "belt", alpha: 1, done: false };
  const v = u - RAISED;
  if (check.verdict === "pass") {
    const leave = (BELT_X1 + 4 - GX) / SPEED;
    if (v < leave) return { pos: onBelt(GX + SPEED * v), layer: "belt", alpha: 1, done: false };
    const [tx, ty] = TRAY_SLOTS[slot % TRAY_SLOTS.length]!;
    const fall = clamp((v - leave) / DROP);
    const from = onBelt(BELT_X1 + 4);
    const pos: Point3 = [lerp(from[0], tx, fall), lerp(0, ty, fall), BT - (BT - TRAY_FLOOR) * fall * fall];
    return { pos, layer: pos[0] > BELT_X1 + 6 ? "tray" : "belt", alpha: 1, done: fall >= 1 };
  }
  if (v < TO_CONTACT) return { pos: onBelt(GX + SPEED * v), layer: "belt", alpha: 1, done: false };
  const w = v - TO_CONTACT;
  if (w < SLIDE) {
    const along = SLIDE_SPEED * w;
    const y = ARM_DIR[1] * along;
    const drop = smooth((y - OFF_BELT) / 5) * (BT - APRON_TOP);
    return { pos: [CONTACT_X + ARM_DIR[0] * along, y, BT - drop], layer: y > 10 ? "chute" : "belt", alpha: 1, done: false };
  }
  const start: Point3 = [CONTACT_X + ARM_DIR[0] * SLIDE_LONG, CHUTE_MID, APRON_TOP];
  const r = w - SLIDE;
  if (r < CHUTE_RUN) {
    const t = clamp(r / CHUTE_RUN);
    const ease = t * t * (1.6 - 0.6 * t);
    const x = lerp(start[0], CHUTE_X0, ease);
    return { pos: [x, CHUTE_MID, x > CHUTE_X1 ? APRON_TOP : chuteTop(x)], layer: "chute", alpha: 1, done: false };
  }
  const fall = clamp((r - CHUTE_RUN) / DROP);
  const from: Point3 = [CHUTE_X0, CHUTE_MID, chuteTop(CHUTE_X0)];
  const pos = mix3(from, RETURN_AT, fall);
  pos[2] = from[2] - (from[2] - RETURN_AT[2]) * fall * fall;
  return { pos, layer: "chute", alpha: 1, done: fall >= 1 };
}

/** Seconds a token takes from the hopper to rest, by verdict. */
export const RUN_LONG = {
  pass: RAISED + (BELT_X1 + 4 - GX) / SPEED + DROP,
  return: RAISED + TO_CONTACT + SLIDE + CHUTE_RUN + DROP,
};

/** Plunger lift for one run, `u` seconds in. */
export function liftAt(u: number) {
  if (u < ARRIVE || u > RAISED) return LIFTED;
  if (u < ARRIVE + LOWER) return LIFTED * (1 - smooth((u - ARRIVE) / LOWER));
  if (u < RAISE_AT) return 0;
  return LIFTED * smooth((u - RAISE_AT) / (RAISED - RAISE_AT));
}

/** Diverter arm, 0–1, for one run. */
export function armAt(u: number, check: Check) {
  if (check.verdict === "pass") return 0;
  const reopen = RAISED + TO_CONTACT + SLIDE * 0.8;
  if (u < SWING_AT) return 0;
  if (u < SWUNG) return smooth((u - SWING_AT) / (SWUNG - SWING_AT));
  if (u < reopen) return 1;
  return 1 - smooth((u - reopen) / 0.5);
}

const dwelling = (u: number) => u >= ARRIVE && u < RAISED;

/** Earlier passes sitting in the result tray, for the single-run poses. */
function history(count: number): TokenTarget[] {
  return Array.from({ length: count }, (_, index) => {
    const check = checkAt([1, 3, 4][index] ?? 1);
    const [x, y] = TRAY_SLOTS[index]!;
    return { key: `history-${index}`, check, pos: [x, y, TRAY_FLOOR] as Point3, layer: "tray" as const, alpha: 1, lit: false };
  });
}

/** The endless idle tour at time `t` (seconds since the tour's run started). */
export function idleScene(t: number): Scene {
  const now = Math.floor(t / PERIOD);
  const tokens: TokenTarget[] = [];
  let lift = LIFTED;
  let arm = 0;
  let belt = SPEED;
  let measured = 0;
  let drag = 0;
  const passesBefore = (index: number) => tallyOf(index).passed;
  for (let index = Math.max(0, now - 9); index <= now; index++) {
    const u = t - index * PERIOD;
    const check = checkAt(index);
    if (u >= MEASURED) {
      measured = index + 1;
      drag = check.value;
    }
    lift = Math.min(lift, liftAt(u));
    arm = Math.max(arm, armAt(u, check));
    if (dwelling(u)) belt = 0;
    const slot = passesBefore(index);
    const where = tokenAt(u, check, slot);
    if (check.verdict === "pass") {
      let replacedAt = Infinity;
      for (let later = index + 1, seen = 0; seen < 4 && later <= now + 1; later++) {
        if (checkAt(later).verdict !== "pass") continue;
        seen++;
        if (seen === 4) replacedAt = later * PERIOD;
      }
      if (t >= replacedAt) continue;
    } else if (u > RUN_LONG.return + KEEP_RETURNED) continue;
    tokens.push({ key: `run-${index}`, check, pos: where.pos, layer: where.layer, alpha: where.alpha, lit: !where.done });
  }
  const tally = tallyOf(measured);
  return { tokens, lift, arm, belt, apart: false, drag, readout: tallyText(tally), phase: `running, ${tallyText(tally)}` };
}

/** One proposal through the gate, `t` seconds after the pose was set. */
export function singleScene(t: number, verdict: "pass" | "return", round = 0): Scene {
  const check = verdict === "pass" ? PASS_CHECK : RETURN_CHECK;
  const tokens = history(verdict === "pass" ? 2 : 3);
  const where = tokenAt(t, check, 2);
  tokens.push({ key: `${verdict}-${round}`, check, pos: where.pos, layer: where.layer, alpha: where.alpha, lit: true });
  const done = t >= MEASURED;
  return {
    tokens,
    lift: liftAt(t),
    arm: armAt(t, check),
    belt: dwelling(t) || where.done || where.layer !== "belt" ? 0 : SPEED,
    apart: false,
    drag: done ? check.value : 0,
    readout: done ? verdictText(check) : `checking proposal ${check.proposal}`,
    phase: done ? verdictText(check) : "checking",
  };
}

export function apartScene(): Scene {
  const tokens = history(3);
  const check = checkAt(4);
  tokens.push({ key: "apart-0", check, pos: [-60, 0, BT], layer: "belt", alpha: 1, lit: true });
  return { tokens, lift: 0, arm: 0, belt: 0, apart: true, drag: 0, readout: `apart · ${ASSEMBLIES.length} assemblies`, phase: "apart" };
}

/** The scene for a pose at `t` seconds since it was set. */
export function sceneAt(pose: GatePose, t: number, round = 0): Scene {
  if (pose === "apart") return apartScene();
  if (pose === "pass" || pose === "return") return singleScene(t, pose, round);
  return idleScene(IDLE_START + t);
}

/** The one still, readable moment each pose holds in thumbnails and under reduced motion. */
export const STILL_AT: Record<GatePose, number> = {
  idle: ARRIVE + 0.75 - 0.4,
  pass: RAISED + 1.15,
  return: RAISED + TO_CONTACT + SLIDE * 0.62,
  apart: 0,
};

export const stillScene = (pose: GatePose) => sceneAt(pose, STILL_AT[pose]);

/** Height the plunger tip rests at over a token whose centre is `distance` from the plunger axis. */
export function contactOver(distance: number, height: number) {
  return height * smooth((TOKEN_R + 1 - distance) / 4);
}
