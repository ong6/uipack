# Calibration anchors

A score means nothing without a known page scored beside it by the same judges on the same rubric.
Every packet carries one anchor (`R`), a human-made page of known quality for the page type. A
target reads relative to it: "B is 1 point under linear.app" is a result; "B is an 8" is not. If an
anchor that is consistently rated about 9 scores 7 in a round, the judges are harsh that round and
a target of 9 is out of reach for anyone.

## Anchors

| Page type | Anchor | Prior score | Capture date | Notes |
| --- | --- | --- | --- | --- |
| Landing | https://linear.app | about 9 | 2026-11-06 | Product shown in the hero; dark-only (ignores the colour scheme) |
| Article | Julia Evans, https://jvns.ca (a recent post) | 7-8 | TODO: capture | Plain, specific, answer-first writing; modest visual craft |
| Documentation | Atlassian support docs (a how-to page) | 6 | TODO: capture | Competent, template-driven |
| Deck slide | TODO: a public deck rated 9 | | | |
| Dashboard | TODO: a public dashboard rated 9 | | | |
| Diagram | TODO: a figure from a top engineering blog | | | |

The prior scores come from earlier judge rounds (summary in the coordinator's handoff notes,
2026-11-06) under older rubrics. Re-score each anchor under the current rubric version before
relying on it, and record the new score here with the rubric version and judge count.

## Capture an anchor

1. Capture it with the same script as every candidate, so the comparison is fair:
   `npm run grade -- packet …` captures a URL source itself; to keep a fixed copy, capture once into a
   folder and pass the folder (`--anchor <dir>`) every round. A live page changes; a folder does not.
2. Store the folder outside the repo (screenshots of other sites are not ours to publish), under the
   run's evaluation folder, and note its path and date in the table.
3. Run tier 1 on it too (no `--spec`, faces unchecked) and keep the report: it shows what a top page
   fails mechanically, so tier-1 thresholds are not mistaken for taste.

## Tier 1 on the landing anchor (2026-11-06)

linear.app at 1440 and 390 light fails tier 1 on contrast (dimmed text in its product mock-ups,
about 2.6:1 and 3.4:1), tap targets (14px icon buttons in the mock-ups, 32px header links at 390),
text size (10-11px labels), looping dot animations under reduced motion, and one skipped heading
level. That is expected: tier 1 is a floor for our pages, not a definition of a 9.
