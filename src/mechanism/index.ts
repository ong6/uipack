/* uipack/mechanism: the Mechanism style. Crafted isometric machines whose
   working is the explanation, after Anatomy (MIT,
   https://github.com/wheresryan22/anatomy), in the Technical palette. */
export {
  VerificationGate,
  GateMachine,
  GATE_CAPTION,
  GATE_LIMIT,
  type VerificationGateProps,
  type GateMachineProps,
  type GatePose,
} from "./gate/VerificationGate";
export { MechanismFrame, type MechanismFrameProps } from "./MechanismFrame";
// The gate's model and motion, renamed at this boundary so a second machine's `checkAt` or `PERIOD`
// cannot clash: every machine-specific export carries its machine's prefix. (GATE_LIMIT is above.)
export {
  CYCLE_LENGTH as GATE_CYCLE_LENGTH,
  PASS_CHECK as GATE_PASS_CHECK,
  RETURN_CHECK as GATE_RETURN_CHECK,
  SCALE as GATE_SCALE,
  checkAt as gateCheckAt,
  tallyOf as gateTallyOf,
  tallyText as gateTallyText,
  verdictOf as gateVerdictOf,
  verdictText as gateVerdictText,
  type Check as GateCheck,
  type Tally as GateTally,
  type Verdict as GateVerdict,
} from "./gate/model";
export {
  PERIOD as GATE_PERIOD,
  RUN_LONG as GATE_RUN_LONG,
  sceneAt as gateSceneAt,
  stillScene as gateStillScene,
  tokenAt as gateTokenAt,
  type Layer as GateLayer,
  type Scene as GateScene,
  type TokenTarget as GateTokenTarget,
} from "./gate/motion";
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
// The kit's own stillness helpers (asksForStillness, useStillness) stay internal: parts read
// reduced motion through usePrefersReducedMotion from "uipack".
export { follow, spring, type Spring } from "./kit/live";
export { prismOf, circleIn, faceCircle, viewOf } from "./solid3";
