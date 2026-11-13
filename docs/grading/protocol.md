# Pairwise judging

Tier 2 of [grading](README.md): judges compare; they do not grade in a vacuum. Absolute 1-10 scores drifted about a point between
fresh judges on identical images, while their preferences agreed, so the result is the preference
and the paired difference, read against a calibration anchor.

## Values

| Rule | Value |
| --- | --- |
| Judges per comparison | 2, in opposite order; a third when they disagree |
| Disagreement | Overall paired deltas differ by 2 or more, or opposite preferences |
| Reported | Win rate of B over A, mean paired delta (overall and per criterion), scores minus the anchor's |
| Never reported | A raw 1-10 without the anchor's score from the same judges |
| Rubric | One frozen version for the whole climb (below) |
| Capture | One script for every side: full page, reduced motion, settled, 1440 and 390 at 2x, light and dark |

## Rubrics

| Page type | Current |
| --- | --- |
| Landing | [landing-v1.md](rubrics/landing-v1.md) |
| Documentation and article | [docs-v1.md](rubrics/docs-v1.md) |
| Deck slide | [deck-slide-v1.md](rubrics/deck-slide-v1.md) |
| Dashboard | [dashboard-v1.md](rubrics/dashboard-v1.md) |
| Diagram | [diagram-v1.md](rubrics/diagram-v1.md) |

Each criterion has a definition, what a 3, a 6 and a 9 look like, and a concrete check the judge
performs. A rubric is frozen: `docs/grading/FROZEN.json` holds its hash and a unit test fails if it
changes. A new criterion is a new version file; compare rounds only within one version.

## What A and B are

A comparison is two builds on the same brief: the new build against the previous one (did the
change help?), or against an independent build from the same brief (is it better than an agent
without the system?). Run the first every round; the second when the question is the system's
worth. Never compare a long-lived showcase against a page built fresh for the brief.

## Build the packet

```sh
npm run grade -- packet --brief docs/grading/regression/landing/brief-1.v1.json \
  --rubric docs/grading/rubrics/landing-v1.md --a <url or dir> --b <url or dir> \
  --anchor <anchor shots dir> --out <run>/packets --key <run>/key/key.json
```

A source is a URL (captured now with the packet capture) or a folder of `<view>.png` files from the
same capture. The builder writes `judge-1/`, `judge-2/` (the same pair in the opposite order) and
`judge-3/` (a fresh random order for a tie-break). Each holds `A-<view>.png`, `B-<view>.png`,
`R-<view>.png` (the anchor), `brief.md`, `rubric.md` and `judge-prompt.md`; nothing else. It
refuses a key inside the packet folder, an unversioned rubric, and judge material that names a
side or the system under test (`findHints`).

## Brief the judge

Spawn a fresh subagent per packet with no inherited context and this prompt, nothing more:

```text
You are an independent design judge. Read judge-prompt.md in <packet folder> and follow it exactly. Do not edit files or launch agents. Return only the JSON it asks for.
```

Never tell a judge the target score, the round, which side is new, or what an earlier judge said.
The judge returns `{packet, rubric, rubricVersion, criteria: [{id, A, B, R, evidence}], overall: {A, B, R}, preference, margin, defects, confidence}`.

## Tally

```sh
npm run grade -- tally --key <run>/key/key.json judge-1.json judge-2.json [judge-3.json]
```

It maps labels back through the key and prints the win rate, paired deltas, scores relative to the
anchor, and how many judges preferred the side they saw first. Exit code 1 asks for a third judge,
or, when the output starts "NOT A RESULT", says a verdict matched no packet in the key (every
dropped verdict is listed) and nothing it printed is a result.

## Defects are input, not rules

A judge's defect list says what is wrong, not the rule to add. The improver fixes the cause in the
library or the skill, logs it in the [fix ledger](regression.md#fix-ledger), and the next round on
the same briefs shows whether it worked.
