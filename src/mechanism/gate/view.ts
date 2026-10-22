/* World layout of the verification gate, in world units (about 1 px of the
   real thing): x runs along the belt from the hopper to the result tray, y is
   across it (positive toward the viewer), z is up. */
import { boxCorners, fitProjection, iso, translateAlong, type Flat, type Plan, type Point3 } from "../kit/iso-kit";

export const WIDTH = 600;
export const HEIGHT = 360;
export const AZIMUTH = 57;

/* Base plate and its feet. */
export const BASE: Plan = { x: -152, y: -36, w: 304, d: 96, r: 8 };
export const BASE_H = 9;
export const FOOT_H = 5;

/* The conveyor: belt top, drums, side rails and legs. */
export const BT = 30;
export const BELT_X0 = -128;
export const BELT_X1 = 96;
export const DRUM_R = 5;
export const BELT_HALF = 13;
export const RAIL_IN = 13.5;
export const RAIL_OUT = 16.5;
export const RAIL_X0 = BELT_X0 - DRUM_R - 3;
export const RAIL_X1 = BELT_X1 + DRUM_R + 3;
export const RAIL_Z = BT - 13;
export const LIP = 2;
export const LEG_X = [-112, 80] as const;
export const LEG = 6;
/** Where the front lip is cut away so a diverted token can leave the belt. */
export const GAP: [number, number] = [14, 64];

/* The hopper: a square magazine of proposals above the start of the belt. */
export const MAG: Plan = { x: -124, y: -RAIL_IN, w: 24, d: RAIL_IN * 2, r: 1.5 };
export const MAG_Z = BT + 9;
export const MAG_TOP = BT + 58;

/* The gauge: a bridge over the belt carrying a face-up dial indicator. */
export const GX = -20;
export const POST_Y = 20;
export const POST = 6;
export const BEAM_Z = BT + 36;
export const BEAM_H = 6;
export const DIAL_R = 15;
export const DIAL_Z = BEAM_Z + BEAM_H + 2;
export const DIAL_H = 8;
export const DIAL_TOP = DIAL_Z + DIAL_H;
/** Degrees of needle travel per unit read; the scale spans 0–10 over 300°. */
export const DIAL_SWEEP = 300;
export const ROD_R = 1.3;
export const ROD_LONG = 40;
export const TIP_R = 2.4;
export const TIP_H = 2;
/** Plunger lift between tokens. 0: the tip rides on the belt and rises up each token's chamfer, so the dial reads 0, then the value, then 0. */
export const LIFTED = 0;

/* The diverter: an arm on a pivot behind the belt that swings across it. */
export const PIVOT: Flat = [-10, -21];
export const ARM_LONG = 72;
export const ARM_Z = BT + 2.5;
export const ARM_H = 6.5;
export const ARM_T = 2;
/** Arm angle when it diverts, in degrees from +x toward +y. */
export const ARM_SWING = 28;

/* The return chute, in front of the belt, sloping back down toward the hopper. */
export const CHUTE_Y: [number, number] = [26, 42];
export const CHUTE_WALL = 2;
export const CHUTE_X0 = -86;
export const CHUTE_X1 = 10;
export const APRON: Plan = { x: CHUTE_X1, y: RAIL_OUT, w: 74, d: CHUTE_Y[1] - RAIL_OUT, r: 1 };
export const APRON_TOP = BT - 1.5;
export const CHUTE_LOW = 9;
export const RETURN_TRAY: Plan = { x: -114, y: 22, w: 30, d: 26, r: 2 };
export const TRAY_WALL = 7;

/* The result tray past the end of the belt. */
export const RESULT_TRAY: Plan = { x: 106, y: -20, w: 38, d: 40, r: 2 };
export const TRAY_FLOOR = 1.5;

/* Tokens: machined pucks whose height is the measured value. */
export const TOKEN_R = 7;
export const CHUTE_MID = (CHUTE_Y[0] + CHUTE_Y[1]) / 2;

export const chuteTop = (x: number) => CHUTE_LOW + ((x - CHUTE_X0) / (CHUTE_X1 - CHUTE_X0)) * (APRON_TOP - CHUTE_LOW);

/* Assemblies for the apart pose, each with its disassembly vector. Order is the opening stagger. */
export const ASSEMBLIES = ["hopper", "gauge", "diverter", "chute", "tray", "conveyor"] as const;
export type Assembly = (typeof ASSEMBLIES)[number];
export const MOVES: Record<Assembly, Point3> = {
  hopper: [-30, 0, 22],
  gauge: [0, 0, 24],
  diverter: [0, -22, 16],
  chute: [0, 26, 0],
  tray: [30, 0, 0],
  conveyor: [0, 0, 10],
};

export const P = fitProjection(
  [
    ...boxCorners(BASE, -BASE_H - FOOT_H, 0),
    [MAG.x + MOVES.hopper[0], MAG.y, MAG_TOP + 3 + MOVES.hopper[2]],
    [MAG.x + MAG.w, MAG.y, MAG_TOP + 3],
    [GX, -DIAL_R, DIAL_TOP + MOVES.gauge[2]],
    [RESULT_TRAY.x + RESULT_TRAY.w + MOVES.tray[0], RESULT_TRAY.y + RESULT_TRAY.d, 0],
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: AZIMUTH },
);

export const at = (point: Point3) => iso(point, P);
export const move = (by: Point3) => translateAlong(P, by);
