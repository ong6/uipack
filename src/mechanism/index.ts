/* uipack/mechanism: the Mechanism style. Crafted isometric machines whose
   working is the explanation, after Anatomy (MIT,
   https://github.com/wheresryan22/anatomy), in the Technical palette. */
export { VerificationGate, GateMachine, GATE_CAPTION, GATE_LIMIT, type VerificationGateProps, type GateMachineProps, type GatePose } from "./gate/VerificationGate";
export { MechanismFrame, type MechanismFrameProps } from "./MechanismFrame";
export { LIMIT, SCALE, CYCLE_LENGTH, checkAt, tallyOf, tallyText, verdictOf, verdictText, PASS_CHECK, RETURN_CHECK, type Check, type Tally, type Verdict } from "./gate/model";
export { sceneAt, stillScene, tokenAt, RUN_LONG, PERIOD, type Scene, type TokenTarget, type Layer } from "./gate/motion";
/**
 * The vendored Anatomy kit, for building new machines in this style: projection, plans, solids,
 * rings, ticks and seams, listed by name. Its static-HTML builders (solidSvg, figureSvg,
 * plateHtml, pageHtml…) and their unscoped ISO_CSS stay inside the kit: a machine renders through
 * Solid, Line and Dots below and styles with mechanism.css.
 */
export {
  AZIMUTH,
  ELEVATION,
  SHADES,
  axisVector,
  boxCorners,
  cameraOf,
  circleRing,
  coil,
  corners,
  cylinder,
  depthOf,
  dotGrid,
  extrude,
  fitProjection,
  haloOf,
  holdStill,
  insetPlan,
  iso,
  joinPaths,
  knurl,
  lineOnTop,
  onTop,
  pathOf,
  planOutline,
  pointsAt,
  radialTicks,
  rise,
  ring,
  ringOf,
  ringSeam,
  roundedPlan,
  screenRise,
  segment,
  sideArc,
  sideMatrix,
  sideRing,
  sideSeam,
  sideTicks,
  slabOf,
  topMatrix,
  topTicks,
  towardViewer,
  translateAlong,
  type ExtrudeOptions,
  type FadeLineStyle,
  type Faded,
  type FitOptions,
  type Flat,
  type LineStyle,
  type LineTone,
  type Plan,
  type Plane,
  type Point3,
  type Projection,
  type SolidPaths,
  type SolidStyle,
  type Ticks,
  type Tone,
  type WireStyle,
} from "./kit/iso-kit";
export { Solid, Line, Dots, Wire, FaceText } from "./kit/draw";
export { follow, spring, asksForStillness, useStillness, type Spring } from "./kit/live";
export { prismOf, circleIn, faceCircle, viewOf } from "./solid3";
