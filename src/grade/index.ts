/**
 * uipack/grade: verify UI work the same way every time (docs/grading/README.md). Node only.
 *
 * - Tier 1, mechanical: `gradeUrl(url, resolveSpec(spec))` runs every check at each viewport in
 *   light and dark under reduced motion and returns a JSON report; `toMarkdown` summarises it.
 * - Tier 2, judged: `buildPacket` writes blinded judge packets; `tallyJudges` turns verdicts into
 *   win rate and paired deltas against the calibration anchor.
 * - Tier 3, regression: `validateLedger` checks a fix ledger.
 * - `main(argv)` is the `uipack-grade` command.
 */
export { CHECK_IDS, CHECK_TITLES, DEFAULT_SPEC, UIPACK_SPEC, mergeSpec, resolveSpec, validateSpec } from "./spec";
export type { CheckId, SiteSpec, ThemeSetup, Viewport } from "./spec";
export { contrastRatio, flatten, isLargeText, luminance, over, parseColor } from "./color";
export type { RGBA } from "./color";
export type {
  Box as GradeBox,
  ClipSample,
  FocusSample,
  Measurements,
  MotionSample,
  RowSample,
  Spot,
  TargetSample,
  TextSample,
} from "./measure";
export { measureFocus, measureMotion, measurePage } from "./measure";
export {
  checkContrast,
  checkFaces,
  checkFocus,
  checkHeadingOrder,
  checkImages,
  checkMotion,
  checkOneH1,
  checkOverflow,
  checkRows,
  checkTargets,
  checkTextClip,
  checkTextOverlap,
  checkTextSize,
  evaluateView,
  faceAllowed,
  findOverlaps,
  firstFamily,
  sampleContrast,
} from "./rules";
export type { CheckResult, Extras, Finding, PlatformFontUse, Status } from "./rules";
export { REPORT_VERSION, summarise, toMarkdown } from "./report";
export type { GradeReport, ViewReport } from "./report";
export { decodePng, diffBitmaps } from "./png";
export { gradeUrl, loadPlaywright, withQuery } from "./run";
export type { GradeOptions } from "./run";
export {
  HINT_PATTERNS,
  JUDGE_PROMPT,
  PACKET_VIEWS,
  assignOrders,
  briefMarkdown,
  buildPacket,
  findHints,
  rubricVersion,
  seeded,
} from "./packet";
export type { PacketOptions, RegressionBrief } from "./packet";
export { formatTally, tallyJudges } from "./tally";
export type { JudgeVerdict, PacketKey, Tally } from "./tally";
export { validateLedger } from "./ledger";
export type { LedgerEntry } from "./ledger";
export { loadSpec, main } from "./cli";
export { facesFromStyleSpec, specFromStyleDoc } from "./style-spec";
