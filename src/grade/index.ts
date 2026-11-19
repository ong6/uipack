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
export { resolveSpec } from "./spec";
export type { CheckId, SiteSpec, ThemeSetup, Viewport } from "./spec";
export type { Box as GradeBox } from "./measure";
export type { CheckResult, Finding, Status } from "./rules";
export { toMarkdown } from "./report";
export type { GradeReport, ViewReport } from "./report";
export { gradeUrl } from "./run";
export type { GradeOptions } from "./run";
export { buildPacket, findHints } from "./packet";
export type { PacketOptions } from "./packet";
export { tallyJudges } from "./tally";
export type { JudgeVerdict, PacketKey, Tally } from "./tally";
export { validateLedger } from "./ledger";
export { main } from "./cli";
