/* Every static path of the verification gate, computed once at module load,
   plus the builders for the few parts that change shape per frame (the arm,
   the needles, the belt's slats and the tokens). */
import {
  circleRing,
  corners,
  cylinder,
  depthOf,
  extrude,
  haloOf,
  insetPlan,
  knurl,
  lineOnTop,
  onTop,
  pathOf,
  planOutline,
  radialTicks,
  ring,
  segment,
  sideArc,
  sideSeam,
  slabOf,
  topTicks,
  type Flat,
  type Plan,
  type Plane,
  type Point3,
  type SolidPaths,
} from "../kit/iso-kit";
import { circleIn, faceCircle, prismOf, viewOf } from "../solid3";
import { LIMIT, SCALE } from "./model";
import {
  APRON,
  APRON_TOP,
  ARM_H,
  ARM_LONG,
  ARM_SWING,
  ARM_T,
  ARM_Z,
  BASE,
  BASE_H,
  BEAM_H,
  BEAM_Z,
  BELT_HALF,
  BELT_X0,
  BELT_X1,
  BT,
  CHUTE_LOW,
  CHUTE_MID,
  CHUTE_WALL,
  CHUTE_X0,
  CHUTE_X1,
  CHUTE_Y,
  DIAL_H,
  DIAL_R,
  DIAL_SWEEP,
  DIAL_TOP,
  DIAL_Z,
  DRUM_R,
  FOOT_H,
  GAP,
  GX,
  LEG,
  LEG_X,
  LIP,
  MAG,
  MAG_TOP,
  MAG_Z,
  P,
  PIVOT,
  POST,
  POST_Y,
  RAIL_IN,
  RAIL_OUT,
  RAIL_X0,
  RAIL_X1,
  RAIL_Z,
  RESULT_TRAY,
  RETURN_TRAY,
  ROD_LONG,
  ROD_R,
  TIP_H,
  TIP_R,
  TOKEN_R,
  TRAY_FLOOR,
  TRAY_WALL,
  at,
  chuteTop,
} from "./view";

const slab = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
const cyl = (x: number, y: number, r: number, z: number, h: number, steps = 32, bevel = 0) =>
  cylinder(x, y, r, z, h, P, steps, bevel);
const join = (paths: string[]) => paths.filter(Boolean).join("");
const seg = (a: Point3, b: Point3) => segment(a, b, P);
const byDepth = (points: Plane[]) => [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
/** A closed outline in the vertical plane y = `y` (a slot or a window on a face that looks toward +y). */
const faceRect = (x0: number, x1: number, y: number, z0: number, z1: number) =>
  pathOf([at([x0, y, z0]), at([x1, y, z0]), at([x1, y, z1]), at([x0, y, z1])], true);
/** A box with one sloped top, as a prism of its x–z profile swept along y. */
const profile = (points: [number, number][], y0: number, y1: number) =>
  prismOf(
    points.map(([x, z]) => [x, y0, z] as Point3),
    [0, y1 - y0, 0],
    P,
  );

/* ---------------- Base ---------------- */
const FEET = byDepth(corners(BASE, 20));
const BASE_SCREWS = corners(BASE, 9);
export const STRIP: Plan = { x: -120, y: BASE.y + BASE.d - 9, w: 196, d: 6, r: 1 };
const STRIP_TICKS = topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y + 0.8, 0.6, [1.8, 3.4], P);
const LABEL: Plan = { x: 92, y: 34, w: 46, d: 11, r: 2 };

export const BASE_ART = {
  halo: haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P),
  feet: FEET.map(([x, y]) => [cyl(x, y, 7, -BASE_H - FOOT_H, 1.6, 28), cyl(x, y, 5.4, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, 28)]),
  slab: slab(BASE, -BASE_H, BASE_H, 8, 1.6),
  groove: planOutline(insetPlan(BASE, 4.5), 0, P),
  screwRings: join(BASE_SCREWS.map(([x, y]) => ring(x, y, 2.2, 0, P, 16))),
  screws: BASE_SCREWS.map(([x, y]) => at([x, y, 0])),
  strip: slab(STRIP, 0, 0.6, 3),
  stripMinor: STRIP_TICKS.minor,
  stripMajor: STRIP_TICKS.major,
  stripScrews: [at([STRIP.x + 2, STRIP.y + 3, 0.6]), at([STRIP.x + STRIP.w - 2, STRIP.y + 3, 0.6])],
  label: slab(LABEL, 0, 0.8, 4),
  labelLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
  labelRule: join(
    [0, 1, 2].map((row) =>
      onTop(
        [
          [LABEL.x + 7, LABEL.y + 3.4 + row * 2.1],
          [LABEL.x + (row === 1 ? 26 : 36), LABEL.y + 3.4 + row * 2.1],
        ],
        0.8,
        P,
      ),
    ),
  ),
  labelScrews: [at([LABEL.x + 3.2, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 3.2, LABEL.y + LABEL.d / 2, 0.8])],
};

/* ---------------- Conveyor ---------------- */
const legPlan = (x: number, y: number): Plan => ({ x: x - LEG / 2, y: y - LEG / 2, w: LEG, d: LEG, r: 0.8 });
const LEGS = byDepth(LEG_X.flatMap((x) => [-15, 15].map((y) => [x, y] as Plane)));
const stretcher = (y: number): Plan => ({ x: LEG_X[0] + LEG / 2, y: y - 1.5, w: LEG_X[1] - LEG_X[0] - LEG, d: 3, r: 0.4 });
const railPlan = (y0: number, x0 = RAIL_X0, x1 = RAIL_X1): Plan => ({ x: x0, y: y0, w: x1 - x0, d: RAIL_OUT - RAIL_IN, r: 0.6 });
const BACK_RAIL = railPlan(-RAIL_OUT);
const FRONT_RAIL = railPlan(RAIL_IN);
const BELT: Plan = { x: BELT_X0, y: -BELT_HALF, w: BELT_X1 - BELT_X0, d: BELT_HALF * 2, r: 0 };
const drum = (x: number) => prismOf(circleIn([x, -BELT_HALF, BT - DRUM_R], DRUM_R, "y", 28), [0, BELT_HALF * 2, 0], P);
const LIP_TICKS = topTicks(-96, 8, 4, 5, RAIL_OUT - 0.4, BT + LIP, [-1.1, -2], P);
const MOTOR_C: Point3 = [BELT_X1, RAIL_OUT, BT - DRUM_R];
const MOTOR_LONG = 11.5;
const MOTOR_R = 6;
/** The visible near half of a ring round the motor (axis along y) at `y`, limb to limb. */
function motorBand(y: number) {
  const [vx, , vz] = viewOf(P);
  const facing = Math.atan2(vz, vx);
  const points: Flat[] = [];
  for (let step = 0; step <= 20; step++) {
    const angle = facing - Math.PI / 2 + (step / 20) * Math.PI;
    points.push(at([MOTOR_C[0] + MOTOR_R * Math.cos(angle), y, MOTOR_C[2] + MOTOR_R * Math.sin(angle)]));
  }
  return pathOf(points);
}
const BOX: Plan = { x: BELT_X1 - 4, y: RAIL_OUT + 2.5, w: 8, d: 6, r: 1 };

export const CONVEYOR_BACK = {
  legs: LEGS.map(([x, y]) => ({
    foot: slab(insetPlan(legPlan(x, y), -2.4), 0, 1.2, 3),
    post: slab(legPlan(x, y), 1.2, RAIL_Z - 1.2, 3),
    screws: [at([x - 3.6, y, 1.2]), at([x + 3.6, y, 1.2])],
  })),
  stretchers: [-15, 15].map((y) => slab(stretcher(y), 6, 3, 2)),
  backRail: slab(BACK_RAIL, RAIL_Z, BT - RAIL_Z, 3, 0.4),
  backLip: slab(BACK_RAIL, BT, LIP, 3, 0.3),
  backScrews: LEG_X.map((x) => at([x, -RAIL_OUT + 1.5, BT + LIP])),
};

export const CONVEYOR_MID = {
  drums: [drum(BELT_X0), drum(BELT_X1)],
  belt: slab(BELT, BT - 1, 1, 2),
};

/** Slat lines across the belt, `phase` world units along it. */
export function slatsOf(phase: number) {
  const step = 8;
  const lines: string[] = [];
  const first = BELT_X0 + 3 + (((phase % step) + step) % step);
  for (let x = first; x < BELT_X1 - 2; x += step) lines.push(lineOnTop([x, -BELT_HALF], [x, BELT_HALF], BT, P));
  return join(lines);
}

const FRONT_LIPS = [railPlan(RAIL_IN, RAIL_X0, GAP[0]), railPlan(RAIL_IN, GAP[1], RAIL_X1)];
export const CONVEYOR_FRONT = {
  rail: slab(FRONT_RAIL, RAIL_Z, BT - RAIL_Z, 3, 0.4),
  railSeam: join(LEG_X.map((x) => seg([x, RAIL_OUT, RAIL_Z], [x, RAIL_OUT, BT]))),
  railScrews: LEG_X.flatMap((x) => [at([x - 4, RAIL_OUT, RAIL_Z + 4]), at([x + 4, RAIL_OUT, RAIL_Z + 4])]),
  lips: FRONT_LIPS.map((plan) => slab(plan, BT, LIP, 3, 0.3)),
  lipMinor: LIP_TICKS.minor,
  lipMajor: LIP_TICKS.major,
  zero: lineOnTop([GX, RAIL_OUT - 0.4], [GX, RAIL_OUT - 2.6], BT + LIP, P),
  bearing: prismOf(circleIn([BELT_X0, RAIL_OUT, BT - DRUM_R], 4.2, "y", 24), [0, 1.8, 0], P),
  bearingBore: faceCircle([BELT_X0, RAIL_OUT + 1.8, BT - DRUM_R], 1.6, "y", P, 16),
  bearingScrews: [at([BELT_X0 - 3, RAIL_OUT + 1.8, BT - DRUM_R + 0.2]), at([BELT_X0 + 3, RAIL_OUT + 1.8, BT - DRUM_R + 0.2])],
  motor: prismOf(circleIn(MOTOR_C, MOTOR_R, "y", 32), [0, MOTOR_LONG, 0], P),
  motorBands: join([4, 8].map((dy) => motorBand(MOTOR_C[1] + dy))),
  motorCap: faceCircle([MOTOR_C[0], MOTOR_C[1] + MOTOR_LONG, MOTOR_C[2]], MOTOR_R - 1.4, "y", P, 28),
  motorBolts: [0, 1, 2, 3].map((index) => {
    const angle = Math.PI / 4 + (index * Math.PI) / 2;
    return at([
      MOTOR_C[0] + (MOTOR_R - 2.6) * Math.cos(angle),
      MOTOR_C[1] + MOTOR_LONG,
      MOTOR_C[2] + (MOTOR_R - 2.6) * Math.sin(angle),
    ]);
  }),
  motorShaft: at([MOTOR_C[0], MOTOR_C[1] + MOTOR_LONG, MOTOR_C[2]]),
  box: slab(BOX, MOTOR_C[2] + MOTOR_R - 0.6, 4.6, 3, 0.4),
  boxLine: planOutline(insetPlan(BOX, 1.4), MOTOR_C[2] + MOTOR_R + 4, P, 3),
  boxScrews: [
    at([BOX.x + 1.6, BOX.y + 1.6, MOTOR_C[2] + MOTOR_R + 4]),
    at([BOX.x + BOX.w - 1.6, BOX.y + BOX.d - 1.6, MOTOR_C[2] + MOTOR_R + 4]),
  ],
};

/* ---------------- Hopper ---------------- */
const CHEEK = (y: number): Plan => ({ x: MAG.x + 2, y, w: MAG.w - 4, d: RAIL_OUT - RAIL_IN, r: 0.5 });
const WINDOW: [number, number, number, number] = [MAG.x + 8, MAG.x + 16, MAG_Z + 8, MAG_TOP - 7];
const STACK = [5.1, 6.6, 3.8, 5.6, 4.9, 6.9, 4.4];
const COLLAR = insetPlan(MAG, -2.6);
const GATE: Plan = { x: MAG.x + MAG.w, y: -9, w: 1.6, d: 18, r: 0.5 };

export const HOPPER_BACK = {
  backCheek: slab(CHEEK(-RAIL_OUT), BT + LIP, MAG_Z + 6 - BT - LIP, 2),
  tube: slab(MAG, MAG_Z, MAG_TOP - MAG_Z, 3, 0.6),
  seams: join([MAG_Z + 14, MAG_TOP - 14].map((z) => sideSeam(MAG, z, P, 3))),
  window: faceRect(WINDOW[0], WINDOW[1], MAG.y + MAG.d, WINDOW[2], WINDOW[3]),
  stack: (() => {
    const lines: string[] = [];
    let z = WINDOW[2];
    for (const height of STACK) {
      z += height;
      if (z >= WINDOW[3] - 0.5) break;
      lines.push(seg([WINDOW[0], MAG.y + MAG.d, z], [WINDOW[1], MAG.y + MAG.d, z]));
    }
    return join(lines);
  })(),
  windowFill: faceRect(WINDOW[0], WINDOW[1], MAG.y + MAG.d, WINDOW[2], WINDOW[3]),
  collar: slab(COLLAR, MAG_TOP, 3, 3, 0.6),
  mouth: planOutline(insetPlan(MAG, 1.6), MAG_TOP + 3, P, 3),
  mouthFill: planOutline(insetPlan(MAG, 1.6), MAG_TOP + 3, P, 3),
  collarScrews: corners(COLLAR, 1.4).map(([x, y]) => at([x, y, MAG_TOP + 3])),
  gate: slab(GATE, MAG_Z, 7, 2, 0.3),
  gateScrews: [at([GATE.x + GATE.w, -5, MAG_Z + 4.4]), at([GATE.x + GATE.w, 5, MAG_Z + 4.4])],
};

export const HOPPER_FRONT = {
  cheek: slab(CHEEK(RAIL_IN), BT + LIP, MAG_Z + 6 - BT - LIP, 2),
  cheekScrews: [at([MAG.x + 6, RAIL_OUT, MAG_Z + 2.4]), at([MAG.x + MAG.w - 6, RAIL_OUT, MAG_Z + 2.4])],
};

/* ---------------- Gauge ---------------- */
const postPlan = (y: number): Plan => ({ x: GX - POST / 2, y: y - POST / 2, w: POST, d: POST, r: 0.8 });
const postArt = (y: number) => ({
  foot: slab(insetPlan(postPlan(y), -2.6), 0, 1.4, 3, 0.3),
  post: slab(postPlan(y), 1.4, BEAM_Z - 1.4, 3),
  screws: [at([GX - 4.4, y, 1.4]), at([GX + 4.4, y, 1.4])],
  seam: seg([GX + POST / 2, y + POST / 2, 1.4], [GX + POST / 2, y + POST / 2, BEAM_Z]),
});
const BEAM: Plan = { x: GX - 5, y: -POST_Y - 5, w: 10, d: POST_Y * 2 + 10, r: 1.5 };
const DIAL_FROM = -DIAL_SWEEP / 2;
const angleOf = (reading: number) => ((DIAL_FROM + (reading / SCALE) * DIAL_SWEEP) * Math.PI) / 180;
const DIAL_TICKS = radialTicks(GX, 0, DIAL_R - 3, 20, 2, DIAL_TOP, [1.3, 2.8], P, angleOf(0), (DIAL_SWEEP * Math.PI) / 180);
const onDial = (reading: number, radius: number): Plane => [
  GX + Math.sin(angleOf(reading)) * radius,
  -Math.cos(angleOf(reading)) * radius,
];

function arcOnDial(from: number, to: number, radius: number) {
  const points: Plane[] = [];
  for (let step = 0; step <= 24; step++) points.push(onDial(from + ((to - from) * step) / 24, radius));
  return onTop(points, DIAL_TOP, P);
}

export const GAUGE_BACK = postArt(-POST_Y);

export const GAUGE_FRONT = {
  front: postArt(POST_Y),
  guide: cyl(GX, 0, 3, BEAM_Z - 3, 3, 24),
  beam: slab(BEAM, BEAM_Z, BEAM_H, 3, 0.6),
  beamScrews: [-POST_Y, POST_Y].map((y) => at([GX, y, BEAM_Z + BEAM_H])),
  beamLine: planOutline(insetPlan(BEAM, 2), BEAM_Z + BEAM_H, P, 3),
  neck: cyl(GX, 0, 4, BEAM_Z + BEAM_H, DIAL_Z - BEAM_Z - BEAM_H, 24),
  puck: cyl(GX, 0, DIAL_R, DIAL_Z, DIAL_H, 64, 0.8),
  knurl: knurl(GX, 0, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3),
  band: sideArc(GX, 0, DIAL_R, DIAL_TOP - 3.4, P, 40),
  bezel: ring(GX, 0, DIAL_R - 2.2, DIAL_TOP, P, 64),
  minor: DIAL_TICKS.minor,
  major: DIAL_TICKS.major,
  /** The passing band, from 0 to the limit, along the inner ends of the major ticks. */
  band0: arcOnDial(0, LIMIT, DIAL_R - 3 - 2.8),
  limit: lineOnTop(onDial(LIMIT, DIAL_R - 0.8), onDial(LIMIT, DIAL_R - 3 - 2.8), DIAL_TOP + 0.05, P),
  limitDot: at([...onDial(LIMIT, DIAL_R - 0.8), DIAL_TOP + 0.05] as Point3),
  hub: ring(GX, 0, 1.6, DIAL_TOP, P, 16),
  crown: slab({ x: GX + DIAL_R - 1, y: -2.4, w: 5, d: 4.8, r: 1.2 }, DIAL_Z + 2, 4.4, 3),
  crownCap: slab({ x: GX + DIAL_R + 3.6, y: -3.2, w: 2.6, d: 6.4, r: 1.2 }, DIAL_Z + 1.4, 6, 3),
  crownKnurl: join(
    [-2.2, -1.1, 0, 1.1, 2.2].map((y) => seg([GX + DIAL_R + 6.2, y, DIAL_Z + 1.9], [GX + DIAL_R + 6.2, y, DIAL_Z + 6.9])),
  ),
};

/** The plunger, built resting on the belt; it moves straight up by the reading. */
export const PLUNGER = {
  rod: cyl(GX, 0, ROD_R, BT + TIP_H, ROD_LONG, 16),
  rodMarks: join([6, 9].map((rise) => sideArc(GX, 0, ROD_R, BT + TIP_H + rise, P, 12))),
  tip: cyl(GX, 0, TIP_R, BT, TIP_H, 20),
};

/** Needle (lit-fill wedge) for a reading. */
export function needleOf(reading: number) {
  const angle = angleOf(reading);
  const ux = Math.sin(angle);
  const uy = -Math.cos(angle);
  const point = (along: number, across: number) => at([GX + ux * along - uy * across, uy * along + ux * across, DIAL_TOP + 0.1]);
  return pathOf([point(DIAL_R - 3.6, 0), point(0, 0.75), point(-3.2, 0.35), point(-3.2, -0.35), point(0, -0.75)], true);
}

/** The drag hand: a thin pointer that stays at the last measured value. */
export function dragOf(reading: number) {
  return lineOnTop(onDial(reading, 1.6), onDial(reading, DIAL_R - 2.6), DIAL_TOP + 0.08, P);
}

/* ---------------- Diverter ---------------- */
const BRACKET: Plan = { x: PIVOT[0] - 6, y: PIVOT[1] - 6, w: 12, d: -RAIL_OUT - (PIVOT[1] - 6), r: 1 };
const HEAD_Z = ARM_Z + ARM_H + 1;
export const DIVERTER = {
  bracket: slab(BRACKET, RAIL_Z + 3, 4, 3, 0.4),
  bracketScrews: [
    at([BRACKET.x + 2.4, -RAIL_OUT - 1.6, RAIL_Z + 7]),
    at([BRACKET.x + BRACKET.w - 2.4, -RAIL_OUT - 1.6, RAIL_Z + 7]),
  ],
  post: cyl(PIVOT[0], PIVOT[1], 2.2, RAIL_Z + 7, ARM_Z - RAIL_Z - 7, 20),
  hub: cyl(PIVOT[0], PIVOT[1], 3.4, ARM_Z, ARM_H + 1, 24, 0.3),
  head: cyl(PIVOT[0], PIVOT[1], 4.6, HEAD_Z, 5, 32, 0.5),
  headKnurl: knurl(PIVOT[0], PIVOT[1], 4.6, HEAD_Z, HEAD_Z + 5, 36, P),
  stops: [0, ARM_SWING].map((deg) =>
    at([PIVOT[0] + Math.cos((deg * Math.PI) / 180) * 3.6, PIVOT[1] + Math.sin((deg * Math.PI) / 180) * 3.6, HEAD_Z + 5]),
  ),
};

/** The arm at a swing share 0–1, as a prism rebuilt per frame. */
export function armOf(share: number): SolidPaths {
  const angle = (share * ARM_SWING * Math.PI) / 180;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const half = ARM_T / 2;
  const ringPoints: Plane[] = [];
  const cap = (cx: number, cy: number, start: number) => {
    for (let step = 0; step <= 6; step++) {
      const a = start + (step / 6) * Math.PI;
      ringPoints.push([cx + Math.cos(a) * half, cy + Math.sin(a) * half]);
    }
  };
  const base = Math.atan2(uy, ux);
  cap(PIVOT[0] + ux * ARM_LONG, PIVOT[1] + uy * ARM_LONG, base - Math.PI / 2);
  cap(PIVOT[0] + ux * 2, PIVOT[1] + uy * 2, base + Math.PI / 2);
  return extrude(ringPoints, ARM_Z, ARM_H, P, { convex: true, bevel: 0.3 });
}

export function armPointerOf(share: number) {
  const angle = (share * ARM_SWING * Math.PI) / 180;
  return lineOnTop(
    [PIVOT[0] - Math.cos(angle) * 1.4, PIVOT[1] - Math.sin(angle) * 1.4],
    [PIVOT[0] + Math.cos(angle) * 3.6, PIVOT[1] + Math.sin(angle) * 3.6],
    HEAD_Z + 5,
    P,
  );
}

/* ---------------- Return chute ---------------- */
const floorBottom = 1.5;
const chuteFloor = profile(
  [
    [CHUTE_X0, CHUTE_LOW],
    [CHUTE_X1, chuteTop(CHUTE_X1)],
    [CHUTE_X1, chuteTop(CHUTE_X1) - floorBottom],
    [CHUTE_X0, CHUTE_LOW - floorBottom],
  ],
  CHUTE_Y[0],
  CHUTE_Y[1],
);
const wallOf = (y0: number, x1 = CHUTE_X1) =>
  profile(
    [
      [CHUTE_X0, CHUTE_LOW + 3.5],
      [x1, chuteTop(x1) + 3.5],
      [x1, chuteTop(x1) - floorBottom],
      [CHUTE_X0, CHUTE_LOW - floorBottom],
    ],
    y0,
    y0 + CHUTE_WALL,
  );
const SUPPORTS = [-60, -16].map((x) => ({ x, top: chuteTop(x) - floorBottom }));
const APRON_POST: Plane = [APRON.x + APRON.w - 8, CHUTE_MID];
const trayWalls = (plan: Plan, height: number) => {
  const t = 2;
  return {
    back: { x: plan.x, y: plan.y, w: plan.w, d: t, r: 0.6 },
    left: { x: plan.x, y: plan.y + t, w: t, d: plan.d - t * 2, r: 0.4 },
    right: { x: plan.x + plan.w - t, y: plan.y + t, w: t, d: plan.d - t * 2, r: 0.4 },
    front: { x: plan.x, y: plan.y + plan.d - t, w: plan.w, d: t, r: 0.6 },
    height,
  };
};
const RETURN_WALLS = trayWalls(RETURN_TRAY, TRAY_WALL);

export const CHUTE_BACK = {
  supports: SUPPORTS.map(({ x, top }) => ({
    foot: slab({ x: x - 4, y: CHUTE_MID - 4, w: 8, d: 8, r: 0.8 }, 0, 1.2, 3, 0.3),
    post: slab({ x: x - 2.2, y: CHUTE_MID - 2.2, w: 4.4, d: 4.4, r: 0.6 }, 1.2, top - 1.2, 3),
  })),
  apronPost: slab({ x: APRON_POST[0] - 2.2, y: APRON_POST[1] - 2.2, w: 4.4, d: 4.4, r: 0.6 }, 1.2, APRON_TOP - 1.5 - 1.2, 3),
  apronFoot: slab({ x: APRON_POST[0] - 4, y: APRON_POST[1] - 4, w: 8, d: 8, r: 0.8 }, 0, 1.2, 3, 0.3),
  trayFloor: slab(RETURN_TRAY, 0, TRAY_FLOOR, 4, 0.3),
  trayBack: slab(RETURN_WALLS.back, TRAY_FLOOR, TRAY_WALL - TRAY_FLOOR, 2),
  trayLeft: slab(RETURN_WALLS.left, TRAY_FLOOR, TRAY_WALL - TRAY_FLOOR, 2),
  floor: chuteFloor,
  floorLines: join(
    [CHUTE_Y[0] + 5.3, CHUTE_Y[1] - 5.3].map((y) => seg([CHUTE_X0, y, CHUTE_LOW], [CHUTE_X1, y, chuteTop(CHUTE_X1)])),
  ),
  apronLines: join(
    [CHUTE_Y[0] + 5.3, CHUTE_Y[1] - 5.3].map((y) => lineOnTop([APRON.x, y], [APRON.x + APRON.w, y], APRON_TOP, P)),
  ),
  apron: slab(APRON, APRON_TOP - floorBottom, floorBottom, 3, 0.3),
  backWall: wallOf(CHUTE_Y[0] - CHUTE_WALL),
};

const END_WALL: Plan = { x: APRON.x + APRON.w, y: RAIL_OUT, w: CHUTE_WALL, d: CHUTE_Y[1] + CHUTE_WALL - RAIL_OUT, r: 0.5 };
const APRON_FRONT: Plan = { x: APRON.x, y: CHUTE_Y[1], w: APRON.w, d: CHUTE_WALL, r: 0.5 };

export const CHUTE_FRONT = {
  frontWall: wallOf(CHUTE_Y[1]),
  apronWall: slab(APRON_FRONT, APRON_TOP - floorBottom, 6.5, 2),
  endWall: slab(END_WALL, APRON_TOP - floorBottom, 6.5, 2),
  wallScrews: [-70, -40, -10].map((x) => at([x, CHUTE_Y[1] + CHUTE_WALL, chuteTop(x) + 2])),
  trayRight: slab(RETURN_WALLS.right, TRAY_FLOOR, TRAY_WALL - TRAY_FLOOR, 2),
  trayFront: slab(RETURN_WALLS.front, TRAY_FLOOR, TRAY_WALL - TRAY_FLOOR, 2),
};

/* ---------------- Result tray ---------------- */
const RESULT_WALLS = trayWalls(RESULT_TRAY, 8);
export const TRAY_BACK = {
  floor: slab(RESULT_TRAY, 0, TRAY_FLOOR, 4, 0.3),
  floorGrid: join(
    [RESULT_TRAY.x + 19].map((x) =>
      onTop(
        [
          [x, RESULT_TRAY.y + 2],
          [x, RESULT_TRAY.y + RESULT_TRAY.d - 2],
        ],
        TRAY_FLOOR,
        P,
      ),
    ),
  ),
  back: slab(RESULT_WALLS.back, TRAY_FLOOR, 8 - TRAY_FLOOR, 2),
  left: slab(RESULT_WALLS.left, TRAY_FLOOR, 8 - TRAY_FLOOR, 2),
};
export const TRAY_FRONT = {
  right: slab(RESULT_WALLS.right, TRAY_FLOOR, 8 - TRAY_FLOOR, 2),
  front: slab(RESULT_WALLS.front, TRAY_FLOOR, 8 - TRAY_FLOOR, 2),
  screws: [RESULT_TRAY.x + 6, RESULT_TRAY.x + RESULT_TRAY.w - 6].map((x) => at([x, RESULT_TRAY.y + RESULT_TRAY.d - 1, 8])),
};

/* ---------------- Tokens ---------------- */
export interface TokenPaths {
  solid: SolidPaths;
  face: string;
  mark: Flat;
}

/** A token of height `height`, built with its base centred on the world origin. */
export function tokenOf(height: number): TokenPaths {
  const solid = extrude(circleRing(0, 0, TOKEN_R, 36), 0, height, P, { convex: true, bevel: 0.6 });
  return { solid, face: ring(0, 0, TOKEN_R - 2.4, height, P, 32), mark: at([0, 0, height]) };
}

/** The world origin on screen, to turn a token's world position into a translate. */
export const ORIGIN = at([0, 0, 0]);
