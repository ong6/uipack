/* uipack/mechanism: the Mechanism style. Crafted isometric machines whose
   working is the explanation, after Anatomy (MIT,
   https://github.com/wheresryan22/anatomy), in the Technical palette. */
export { VerificationGate, GateMachine, GATE_CAPTION, GATE_LIMIT, type VerificationGateProps, type GateMachineProps, type GatePose } from "./VerificationGate";
export { MechanismFrame, type MechanismFrameProps } from "./MechanismFrame";
export { LIMIT, SCALE, CYCLE_LENGTH, checkAt, tallyOf, tallyText, verdictOf, verdictText, PASS_CHECK, RETURN_CHECK, type Check, type Tally, type Verdict } from "./gate";
export { sceneAt, stillScene, tokenAt, RUN_LONG, PERIOD, type Scene, type TokenTarget, type Layer } from "./motion";
/** The vendored Anatomy kit, for building new machines in this style. */
export * from "./kit/iso-kit";
export { Solid, Line, Dots, Wire, FaceText } from "./kit/draw";
export { follow, spring, asksForStillness, useStillness, type Spring } from "./kit/live";
export { prismOf, circleIn, faceCircle, viewOf } from "./solid3";
