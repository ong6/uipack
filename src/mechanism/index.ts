/* uipack/mechanism: the Mechanism style. Crafted isometric machines whose
   working is the explanation, after Anatomy (MIT,
   https://github.com/wheresryan22/anatomy), in the Technical palette. */
export {
  VerificationGate,
  GateMachine,
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
// The vendored Anatomy kit (kit/), solid3 and the springs stay inside the package: a new machine
// lives in src/mechanism/ and imports them there (docs/mechanism.md). Point3 is exported because
// gateTokenAt returns it.
export { type Point3 } from "./kit/iso-kit";
