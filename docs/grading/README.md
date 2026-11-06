# Grading UI work

Every agent grades UI work the same way, in three tiers. Tier 1 is a machine check and must pass
before any handoff. Tier 2 is judged, only by fresh judges who did not build the work, pairwise
against a comparison and a calibration anchor. Tier 3 keeps rounds comparable: a fixed brief set
and a ledger that proves each fix reached the next build.

| Tier | What | Who runs it | Gate |
| --- | --- | --- | --- |
| 1 Mechanical | 13 deterministic checks at 1440 and 390, light and dark ([checks](tier-1.md)) | The builder, before handoff; CI | Exit code 0 |
| 2 Judged | Pairwise A vs B on one brief, frozen rubric, two judges in opposite order ([protocol](protocol.md)) | A lead, with fresh subagents | Win rate and paired delta, read against the [anchor](calibration.md) |
| 3 Regression | 15 frozen briefs and the fix ledger ([regression set](regression.md)) | The lead, every round | Same briefs every round; a fix counts only when someone else verified it |

## Grade your own work before handing off

1. Run tier 1 on every page you changed, served locally:

   ```sh
   npm run grade -- check http://localhost:5800/web --spec uipack --out <run dir>/web
   # another site: --spec STYLE.md (its style spec) or a grade config JSON; external page: no --spec
   ```

2. Exit code 0 means no check failed in any view. On a failure, open `summary.md`, then each
   finding's crop. Fix the page, or, if the finding is wrong, fix the check (with a test) rather
   than ignoring it. A spec `ignore` or `skip` needs a reason a reviewer would accept.
3. Hand off with the report path and the result in one line ("tier 1: pass, 4 views, report at …").
   Warnings (`warn`) are listed, not blocking.
4. Do not score your own work on tier 2. A self-score is not evidence. Say "tier 2 not run" if no
   judge has seen it.

## Grade a subagent's work as the lead

1. Re-run tier 1 yourself on the delivered URL or build; do not trust a pasted summary.
2. Build the judge packet: `npm run grade -- packet --brief <brief> --rubric <rubric> --a <previous or comparison> --b <new> --anchor <anchor shots> --out <packets> --key <key file outside packets>`.
3. Spawn two fresh judges (no shared context, never the builder), one on `judge-1/`, one on
   `judge-2/` (the opposite order). Give each only its packet folder. Never pass the key, the
   target, the round number or which side is new.
4. `npm run grade -- tally --key <key> judge-1.json judge-2.json`. Exit code 1 means the judges
   disagree by 2 or more, or prefer opposite sides: run a third judge on `judge-3/` and tally all three.
5. Report the win rate, the paired delta and the scores relative to the anchor, with the judge count
   and order. Never report a raw 1-10 alone.
6. Record each claimed fix in the [fix ledger](regression.md#fix-ledger) and have someone other
   than the improver verify it.

## Why it works this way

Earlier review rounds failed in known ways: absolute 1-10 scores drifted a point between fresh
judges; judges preferred whichever side they saw first; briefs and the comparison changed every
round; rubrics changed mid-climb; nothing anchored what a 9 looks like; and fixes were rules the
judge prescribed, checked only by the agent that made them. Each rule above removes one of those.

## Entry points

| Use | Where |
| --- | --- |
| CLI in this repo | `npm run grade -- <check, spec, packet, tally, ledger>` (`scripts/grade.ts`) |
| CLI in a consumer | `npx uipack-grade <command>` (needs `playwright` and its Chromium) |
| Library | `import { gradeUrl, resolveSpec, buildPacket, tallyJudges } from "uipack/grade"` (Node only) |
| Code | `src/grade/` (rules are pure and unit-tested in `test/grade-rules.test.tsx`) |
